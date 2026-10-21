import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

export const sendMail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({ from: env.MAIL_FROM, to, subject, html });
  } catch (err) {
    const smtpError = err as {
      name?: string;
      code?: string;
      command?: string;
      responseCode?: number;
    };
    // Log transport diagnostics only; never log SMTP credentials or message content.
    console.error("SMTP email delivery failed", {
      name: smtpError.name,
      code: smtpError.code,
      command: smtpError.command,
      responseCode: smtpError.responseCode,
    });
    throw new AppError(
      "Could not send email, try again later",
      502,
      "EMAIL_SEND_FAILED",
    );
  }
};

export const otpEmail = (code: string, minutes: number) => `
  <div style="font-family:sans-serif">
    <h2>Your verification code</h2>
    <p style="font-size:32px;letter-spacing:6px"><b>${code}</b></p>
    <p>It expires in ${minutes} minutes. If you did not request it, ignore this email.</p>
  </div>`;

export const passwordResetEmail = (code: string, minutes: number) => `
  <div style="font-family:sans-serif">
    <h2>Reset your password</h2>
    <p>Enter this code to choose a new password:</p>
    <p style="font-size:32px;letter-spacing:6px"><b>${code}</b></p>
    <p>It expires in ${minutes} minutes. If you did not request a password reset, ignore this email.</p>
  </div>`;
