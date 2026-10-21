import fs from "node:fs/promises";
import { prisma } from "../../lib/prisma.js";
import { deleteFromCloudinary } from "../../lib/cloudinary.js";
import {
  NotFoundError,
  BadRequestError,
} from "../../utils/app-error.js";
import { Prisma, Role } from "@prisma/client";

interface ListUsersFilter {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
}

interface ListAdminFilesFilter {
  page: number;
  limit: number;
  search?: string;
  userId?: number;
  category?: "all" | "images" | "documents" | "spreadsheets" | "text";
  mimeType?: string;
  sortBy?: "createdAt" | "size" | "originalName";
  sortOrder?: "asc" | "desc";
}

export const adminService = {

  async listUsers(filter: ListUsersFilter) {
    const { page = 1, limit = 10, search, role } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [totalItems, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { files: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      users,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  },


  async updateUserRole(currentAdminId: number, targetUserId: number, newRole: Role) {
    if (currentAdminId === targetUserId && newRole !== Role.ADMIN) {
      throw new BadRequestError("You cannot remove administrator privileges from your own account.");
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  },

  async deleteUser(currentAdminId: number, targetUserId: number) {
    if (currentAdminId === targetUserId) {
      throw new BadRequestError("You cannot delete your own administrator account.");
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { files: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    for (const file of user.files) {
      const meta = (file.extractedMeta as Record<string, unknown>) || {};
      const resourceType =
        (meta.resourceType as "image" | "raw" | "video") ||
        (file.mimeType.startsWith("image/") ? "image" : "raw");

      if (file.path.startsWith("http://") || file.path.startsWith("https://")) {
        await deleteFromCloudinary(file.storedName, resourceType);
      } else {
        await fs.unlink(file.path).catch(() => {});
      }
    }

    await prisma.user.delete({
      where: { id: targetUserId },
    });

    return {
      message: `User ${user.email} and all their ${user.files.length} file(s) were successfully deleted.`,
      userId: targetUserId,
    };
  },


  async listAllFiles(filter: ListAdminFilesFilter) {
    const {
      page = 1,
      limit = 10,
      search,
      userId,
      category = "all",
      mimeType,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filter;

    const skip = (page - 1) * limit;

    const where: Prisma.FileWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.originalName = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (mimeType) {
      where.mimeType = mimeType;
    } else if (category && category !== "all") {
      switch (category) {
        case "images":
          where.mimeType = { startsWith: "image/" };
          break;
        case "documents":
          where.mimeType = {
            in: [
              "application/pdf",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "application/msword",
            ],
          };
          break;
        case "spreadsheets":
          where.mimeType = {
            in: [
              "text/csv",
              "application/vnd.ms-excel",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ],
          };
          break;
        case "text":
          where.mimeType = {
            in: ["text/plain", "application/json"],
          };
          break;
      }
    }

    const [totalItems, files] = await Promise.all([
      prisma.file.count({ where }),
      prisma.file.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      files,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  },

  
  async deleteFile(fileId: number) {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundError("File not found");
    }

    const meta = (file.extractedMeta as Record<string, unknown>) || {};
    const resourceType =
      (meta.resourceType as "image" | "raw" | "video") ||
      (file.mimeType.startsWith("image/") ? "image" : "raw");

    if (file.path.startsWith("http://") || file.path.startsWith("https://")) {
      await deleteFromCloudinary(file.storedName, resourceType);
    } else {
      await fs.unlink(file.path).catch(() => {});
    }

    await prisma.file.delete({
      where: { id: fileId },
    });

    return { message: "File deleted successfully", fileId };
  },


  async getDashboardStatistics() {
    const [totalUsers, verifiedUsers, totalFiles, storageAgg] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { emailVerified: true } }),
        prisma.file.count(),
        prisma.file.aggregate({
          _sum: { size: true },
        }),
      ]);

    const totalStorageBytes = storageAgg._sum.size || 0;

    const mimeGroups = await prisma.file.groupBy({
      by: ["mimeType"],
      _count: { id: true },
      _sum: { size: true },
      orderBy: {
        _count: { id: "desc" },
      },
      take: 6,
    });

    const mostUploadedFileTypes = mimeGroups.map((group) => {
      let friendlyName = group.mimeType;
      if (group.mimeType.startsWith("image/")) friendlyName = "Images";
      else if (group.mimeType === "application/pdf") friendlyName = "PDF Documents";
      else if (group.mimeType.includes("word") || group.mimeType.includes("document")) {
        friendlyName = "Word Documents";
      } else if (group.mimeType.includes("csv") || group.mimeType.includes("sheet")) {
        friendlyName = "Spreadsheets";
      } else if (group.mimeType.startsWith("text/")) {
        friendlyName = "Plain Text";
      }

      return {
        mimeType: group.mimeType,
        displayName: friendlyName,
        count: group._count.id,
        bytes: group._sum.size || 0,
      };
    });

    const recentUploads = await prisma.file.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      metrics: {
        totalUsers,
        verifiedUsers,
        totalFiles,
        totalStorageBytes,
      },
      mostUploadedFileTypes,
      recentUploads,
    };
  },
};

