import bcrypt from "bcrypt";
import { User } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

import { otpService } from "../otp/otp.service.js";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/tokens.js";
import { ConflictError, UnauthorizedError } from "../../utils/app-error.js";

const SALT_ROUNDS = 12;

const toSafeUser = ({ password, ...safe }: User) => safe;

const issueTokens = async (user: User) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user.id);
  return { accessToken, refreshToken };
};

export const authService = {
  async verifyEmail(email: string, code: string) {
    await otpService.verify(email, "EMAIL_VERIFICATION", code);
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });
  },

  async resendVerification(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerified)
      await otpService.send(email, "EMAIL_VERIFICATION");
  
  },

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return the same result to avoid revealing which emails are registered.
    if (user) await otpService.send(email, "PASSWORD_RESET");
  },

  async resetPassword(input: { email: string; otp: string; newPassword: string }) {
    await otpService.verify(input.email, "PASSWORD_RESET", input.otp);
    await prisma.user.update({
      where: { email: input.email },
      data: { password: await bcrypt.hash(input.newPassword, SALT_ROUNDS) },
    });
  },

  async register(input: { email: string; name: string; password: string }) {
    const exists = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (exists) throw new ConflictError("Email already in use");

    const user = await prisma.user.create({
      data: {
        ...input,
        password: await bcrypt.hash(input.password, SALT_ROUNDS),
      },
    });
    await otpService.send(user.email, "EMAIL_VERIFICATION");

    return { user: toSafeUser(user), ...(await issueTokens(user)) };
  },

  async login(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    const valid = user && (await bcrypt.compare(input.password, user.password));

    if (!user || !valid)
      throw new UnauthorizedError(
        "Invalid email or password",
        "INVALID_CREDENTIALS",
      );

    return { user: toSafeUser(user), ...(await issueTokens(user)) };
  },

  async refresh(token?: string) {
    if (!token) throw new UnauthorizedError("Refresh token missing");

    let userId: number;
    try {
      userId = Number(verifyRefreshToken(token).sub);
    } catch {
      throw new UnauthorizedError("Invalid refresh token", "INVALID_TOKEN");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedError("User no longer exists");

    return issueTokens(user);
  },

  async getMe(userId: number) {

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedError("User no longer exists");
    return toSafeUser(user);
  },
};
