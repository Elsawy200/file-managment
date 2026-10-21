import jwt, { type JwtPayload } from "jsonwebtoken";
import type { StringValue } from "ms";
import { createHash, randomUUID } from "crypto";
import type { Role } from "@prisma/client";
import { env } from "../config/env.js";

export const signAccessToken = (user: { id: number; role: Role }) =>
  jwt.sign({ id: user.id, role: user.role }, env.JWT_ACCESS_SECRET, {
    subject: String(user.id),
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as StringValue,
    algorithm: "HS256",
  });

export const signRefreshToken = (userId: number) =>
  jwt.sign({}, env.JWT_REFRESH_SECRET, {
    subject: String(userId),
    jwtid: randomUUID(),
    expiresIn: `${env.JWT_REFRESH_EXPIRES_IN_DAYS}d`,
    algorithm: "HS256",
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ["HS256"],
  }) as JwtPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET, {
    algorithms: ["HS256"],
  }) as JwtPayload;

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
