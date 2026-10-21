import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { env } from "../config/env.js";

import {
  AppError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/app-error.js";

const normalizeError = (err: unknown): AppError => {
  if (err instanceof AppError) return err;

  if (err instanceof ZodError) {
    return new ValidationError(
      err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return new ConflictError("Resource already exists", {
          fields: err.meta?.target,
        });
      case "P2025":
        return new NotFoundError("Record not found");
      case "P2003":
        return new AppError(
          "Related record does not exist",
          409,
          "FOREIGN_KEY_VIOLATION",
        );
      default:
        return new AppError(
          `Database error [${err.code}]: ${err.message}`,
          500,
          "DATABASE_ERROR",
          err.meta,
        );
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return new AppError(
      `Database validation error: ${err.message}`,
      400,
      "DB_VALIDATION_ERROR",
    );
  }

  if (err instanceof SyntaxError && "body" in err) {
    return new AppError("Malformed JSON body", 400, "INVALID_JSON");
  }

  const rawMessage = err instanceof Error ? err.message : String(err);
  return new AppError(
    env.NODE_ENV === "production" ? "Internal server error" : rawMessage,
    500,
    "INTERNAL_ERROR",
    env.NODE_ENV === "production" ? undefined : (err instanceof Error ? err.stack : err),
    false,
  );
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Always log the full error in server console
  console.error("❌ [ERROR HANDLER CAUGHT]:", err);

  const error = normalizeError(err);

  res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    },
  });
};
