import type { Request, Response, NextFunction } from "express";
import { NotFoundError } from "../utils/app-error.js";

export const notFound = (req: Request, _res: Response, next: NextFunction) =>
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
