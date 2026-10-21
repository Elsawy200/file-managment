import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/tokens.js";
import { UnauthorizedError } from "../utils/app-error.js";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    throw new UnauthorizedError("Authentication required");

  const payload = verifyAccessToken(header.slice(7));
  (req as Request & { user: { id: number; role: typeof payload.role } }).user = {
    id: Number(payload.sub),
    role: payload.role,
  };
  next();
};
