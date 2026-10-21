import type { Request, Response, NextFunction } from "express";
import { adminService } from "./admin.service.js";
import { Role } from "@prisma/client";

type AuthAdminRequest = Request & {
  user: {
    id: number;
    role: Role;
  };
};

export const adminController = {

  async getDashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStatistics();
      res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  },


  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listUsers(req.query as any);
      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  },


  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthAdminRequest;
      const targetUserId = Number(req.params.id);
      const { role } = req.body;

      const updatedUser = await adminService.updateUserRole(
        authReq.user.id,
        targetUserId,
        role,
      );

      res.json({
        success: true,
        message: `User role updated to ${role} successfully.`,
        data: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthAdminRequest;
      const targetUserId = Number(req.params.id);
      const updatedUser = await adminService.updateUser(
        authReq.user.id,
        targetUserId,
        req.body,
      );

      res.json({
        success: true,
        message: "User updated successfully.",
        data: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  },

  
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthAdminRequest;
      const targetUserId = Number(req.params.id);

      const result = await adminService.deleteUser(
        authReq.user.id,
        targetUserId,
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  },


  async listAllFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listAllFiles(req.query as any);
      res.json({
        success: true,
        data: result.files,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  },

  
  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const fileId = Number(req.params.id);
      const result = await adminService.deleteFile(fileId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  },
};

