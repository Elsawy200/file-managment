import multer, { FileFilterCallback, MulterError } from "multer";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../utils/app-error.js";

// Vercel's deployed application directory is read-only. Use its writable
// temporary filesystem for the short-lived file needed before Cloudinary upload.
const UPLOAD_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "goldera-uploads")
  : path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 15 MB file size limit
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_FILES_COUNT = 10;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  // Documents
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  // Text & Data
  "text/plain",
  "text/csv",
  "application/json",
  // Spreadsheets
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Configure disk storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File validation filter
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Unsupported file type: ${file.mimetype}. Allowed types: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, JSON, PNG, JPG, WEBP, GIF`,
      ),
    );
  }
};

const multerInstance = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_COUNT,
  },
  fileFilter,
});

/**
 * Handles Multer-specific errors and converts them to friendly BadRequestErrors.
 */
const handleMulterError = (err: unknown, next: NextFunction) => {
  if (!err) return next();

  if (err instanceof MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return next(
          new BadRequestError(
            `File size exceeds maximum allowed limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
          ),
        );
      case "LIMIT_FILE_COUNT":
        return next(
          new BadRequestError(
            `Too many files uploaded. Maximum is ${MAX_FILES_COUNT} files`,
          ),
        );
      case "LIMIT_UNEXPECTED_FILE":
        return next(
          new BadRequestError(
            `Unexpected upload field: '${err.field}'. Check your form-data field name`,
          ),
        );
      default:
        return next(new BadRequestError(`Upload error: ${err.message}`));
    }
  }

  return next(err);
};

/**
 * Middleware for single file upload
 * @param fieldName Form-data field name (default: "file")
 */
export const uploadSingle = (fieldName = "file") => {
  const upload = multerInstance.single(fieldName);
  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err) => handleMulterError(err, next));
  };
};

/**
 * Middleware for multiple files upload
 * @param fieldName Form-data field name (default: "files")
 * @param maxCount Max files allowed in this request (default: 10)
 */
export const uploadMultiple = (
  fieldName = "files",
  maxCount = MAX_FILES_COUNT,
) => {
  const upload = multerInstance.array(fieldName, maxCount);
  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err) => handleMulterError(err, next));
  };
};

export { UPLOAD_DIR, MAX_FILE_SIZE_BYTES, MAX_FILES_COUNT };

