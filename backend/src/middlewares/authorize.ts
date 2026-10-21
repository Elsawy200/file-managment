import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "../utils/app-error.js";

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: { role: Role } }).user;
    if (!user) throw new UnauthorizedError();
    if (!roles.includes(user.role)) {
      throw new ForbiddenError("Access denied. Administrator privileges required.");
    }
    next();
  };

export const adminOnly = authorize(Role.ADMIN);

