import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string({error:'Email is required'}).email().toLowerCase(),
    name: z.string({error:'Name is required'}).min(2).max(60),
    password: z
      .string({error:'Password is required'})
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({error:'Email is required'}).email().toLowerCase(),
    password: z.string({error:'Password is required'}).min(1),
  }),
});

const email = z.string().email().toLowerCase();

export const emailOnlySchema = z.object({ body: z.object({ email }) });

export const verifyEmailSchema = z.object({
  body: z.object({ email, otp: z.string().regex(/^\d{6}$/, 'Code must be 6 digits') }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email,
    otp: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
    newPassword: z
      .string({ error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),
  }),
});
