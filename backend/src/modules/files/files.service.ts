import fs from "node:fs/promises";
import { prisma } from "../../lib/prisma.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../lib/cloudinary.js";
import { extractFileContent } from "./content-extractor.js";
import { NotFoundError, BadRequestError } from "../../utils/app-error.js";
import { Prisma, Role } from "@prisma/client";

interface ListFilesFilter {
  page: number;
  limit: number;
  search?: string;
  category?: "all" | "images" | "documents" | "spreadsheets" | "text";
  mimeType?: string;
  sortBy?: "createdAt" | "size" | "originalName";
  sortOrder?: "asc" | "desc";
}

export const filesService = {

  async uploadFiles(userId: number, files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestError("No files uploaded");
    }

    const createdRecords = [];

    try {
      for (const file of files) {
        let extractedText: string | null = null;
        let extractionMeta: Record<string, unknown> = {};

        if (!file.mimetype.startsWith("image/")) {
          const extraction = await extractFileContent(file.path, file.mimetype);
          extractedText = extraction.text;
          extractionMeta = extraction.meta;
        }

        const cloudResult = await uploadToCloudinary(file.path);

        const record = await prisma.file.create({
          data: {
            userId,
            originalName: file.originalname,
            storedName: cloudResult.publicId,
            mimeType: file.mimetype,
            size: file.size,
            path: cloudResult.secureUrl,
            extractedText,
            extractedMeta: {
              provider: "cloudinary",
              resourceType: cloudResult.resourceType,
              format: cloudResult.format,
              width: cloudResult.width,
              height: cloudResult.height,
              ...extractionMeta,
            } as Prisma.InputJsonValue,
          },
        });

        createdRecords.push(record);
      }
    } finally {
      // Vercel's /tmp storage is ephemeral and can be reused by warm instances.
      await Promise.all(
        files.map((file) => fs.unlink(file.path).catch(() => undefined)),
      );
    }

    return createdRecords;
  },


  async getFiles(userId: number, filter: ListFilesFilter) {
    const {
      page = 1,
      limit = 10,
      search,
      category = "all",
      mimeType,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filter;

    const skip = (page - 1) * limit;

    const where: Prisma.FileWhereInput = {
      userId,
    };

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


  async getFileById(userId: number, role: Role, fileId: number) {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        ...(role === Role.ADMIN ? {} : { userId }),
      },
      ...(role === Role.ADMIN
        ? { include: { user: { select: { id: true, name: true, email: true } } } }
        : {}),
    });

    if (!file) {
      throw new NotFoundError("File not found");
    }

    return file;
  },


  async deleteFile(userId: number, fileId: number) {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
    });

    if (!file) {
      throw new NotFoundError("File not found");
    }

    const meta = (file.extractedMeta as Record<string, unknown>) || {};
    const resourceType =
      (meta.resourceType as "image" | "raw" | "video") ||
      (file.mimeType.startsWith("image/") ? "image" : "raw");


    await deleteFromCloudinary(file.storedName, resourceType);

    await prisma.file.delete({
      where: { id: fileId },
    });

    return { message: "File deleted successfully", fileId };
  },

  
  async getStatistics(userId: number) {
    const aggregate = await prisma.file.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { size: true },
    });

    const totalFiles = aggregate._count.id || 0;
    const totalStorageBytes = aggregate._sum.size || 0;

    const mimeGroups = await prisma.file.groupBy({
      by: ["mimeType"],
      where: { userId },
      _count: { id: true },
      _sum: { size: true },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    const byFileType = mimeGroups.map((group) => {
      let friendlyCategory = "Other";
      if (group.mimeType.startsWith("image/")) friendlyCategory = "Images";
      else if (group.mimeType === "application/pdf") friendlyCategory = "PDF";
      else if (
        group.mimeType.includes("word") ||
        group.mimeType.includes("document")
      ) {
        friendlyCategory = "Word Documents";
      } else if (
        group.mimeType.includes("csv") ||
        group.mimeType.includes("sheet") ||
        group.mimeType.includes("excel")
      ) {
        friendlyCategory = "Spreadsheets";
      } else if (group.mimeType.startsWith("text/")) {
        friendlyCategory = "Plain Text";
      }

      return {
        mimeType: group.mimeType,
        category: friendlyCategory,
        count: group._count.id,
        bytes: group._sum.size || 0,
      };
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentFiles = await prisma.file.findMany({
      where: {
        userId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
        size: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const historyMap = new Map<string, { count: number; bytes: number }>();
    for (const item of recentFiles) {
      const dateKey = item.createdAt.toISOString().slice(0, 10);
      const existing = historyMap.get(dateKey) || { count: 0, bytes: 0 };
      historyMap.set(dateKey, {
        count: existing.count + 1,
        bytes: existing.bytes + item.size,
      });
    }

    const uploadHistory = Array.from(historyMap.entries()).map(
      ([date, data]) => ({
        date,
        count: data.count,
        bytes: data.bytes,
      }),
    );

    return {
      totalFiles,
      totalStorageBytes,
      byFileType,
      uploadHistory,
    };
  },
};
