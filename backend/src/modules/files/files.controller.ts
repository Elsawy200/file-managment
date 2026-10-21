import type { Request, Response, NextFunction } from "express";
import { filesService } from "./files.service.js";
import { BadRequestError } from "../../utils/app-error.js";
import { Role } from "@prisma/client";

type AuthRequest = Request & {
  user: {
    id: number;
    role: Role;
  };
};

export const filesController = {

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new BadRequestError("No files uploaded");
      }

      const uploadedFiles = await filesService.uploadFiles(authReq.user.id, files);

      res.status(201).json({
        success: true,
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        data: uploadedFiles,
      });
    } catch (err) {
      
      next(err);
    }
  },

 
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const result = await filesService.getFiles(authReq.user.id, req.query as any);

      res.json({
        success: true,
        data: result.files,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  },


  async getDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const fileId = Number(req.params.id);

      const file = await filesService.getFileById(authReq.user.id, authReq.user.role, fileId);

      res.json({
        success: true,
        data: file,
      });
    } catch (err) {
      next(err);
    }
  },

 
  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const fileId = Number(req.params.id);

      const file = await filesService.getFileById(authReq.user.id, authReq.user.role, fileId);

      if (file.path.startsWith("http://") || file.path.startsWith("https://")) {
        return res.redirect(file.path);
      }

      res.download(file.path, file.originalName);
    } catch (err) {
      next(err);
    }
  },


  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const fileId = Number(req.params.id);

      const result = await filesService.deleteFile(authReq.user.id, fileId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  },


  async statistics(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const stats = await filesService.getStatistics(authReq.user.id);

      res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  },
};

