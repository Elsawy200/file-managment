import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { OtpPurpose } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { sendMail, otpEmail, passwordResetEmail } from "../../lib/mailer.js";
import { AppError, BadRequestError } from "../../utils/app-error.js";

const OTP_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SEC = 60;

const hashCode = (email: string, purpose: string, code: string) =>
  createHmac("sha256", env.OTP_SECRET)
    .update(`${email}:${purpose}:${code}`)
    .digest("hex");

const safeEqual = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export const otpService = {
  async send(email: string, purpose: OtpPurpose) {
    const existing = await prisma.otp.findUnique({
      where: { email_purpose: { email, purpose } },
    });

    const elapsedMs = existing ? Date.now() - existing.createdAt.getTime() : 0;
    if (existing && elapsedMs < RESEND_COOLDOWN_SEC * 1000) {
      throw new AppError(
        "Please wait before requesting another code",
        429,
        "OTP_COOLDOWN",
        {
          retryAfterSeconds: Math.ceil(
            (RESEND_COOLDOWN_SEC * 1000 - elapsedMs) / 1000,
          ),
        },
      );
    }

    const code = randomInt(100000, 1000000).toString(); 
    const data = {
      codeHash: hashCode(email, purpose, code),
      attempts: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60 * 1000),
    };

    const codeHash = hashCode(email, purpose, code);
    await prisma.otp.upsert({
      where: { email_purpose: { email, purpose } },
      create: { email, purpose, ...data, codeHash },
      update: { ...data, codeHash },
    });

    const isPasswordReset = purpose === "PASSWORD_RESET";
    try {
      await sendMail(
        email,
        isPasswordReset ? "Reset your password" : "Your verification code",
        isPasswordReset
          ? passwordResetEmail(code, OTP_TTL_MIN)
          : otpEmail(code, OTP_TTL_MIN),
      );
    } catch (error) {
      // Remove only this failed attempt, in case another request replaced it meanwhile.
      await prisma.otp.deleteMany({
        where: { email, purpose, codeHash },
      });
      throw error;
    }
  },

  async verify(email: string, purpose: OtpPurpose, code: string) {
    const invalid = () => new BadRequestError("Invalid or expired code");

    const otp = await prisma.otp.findUnique({
      where: { email_purpose: { email, purpose } },
    });
    if (!otp) throw invalid();

    if (otp.expiresAt < new Date()) {
      await prisma.otp.delete({ where: { id: otp.id } });
      throw invalid();
    }


    const { attempts } = await prisma.otp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });

    if (attempts > MAX_ATTEMPTS) {
      await prisma.otp.delete({ where: { id: otp.id } });
      throw new AppError(
        "Too many attempts, request a new code",
        429,
        "OTP_LOCKED",
      );
    }

    if (!safeEqual(otp.codeHash, hashCode(email, purpose, code)))
      throw invalid();

    await prisma.otp.delete({ where: { id: otp.id } }); 
  },
};
