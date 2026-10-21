import { authService } from "./auth.service.js";
import { Request, Response, NextFunction } from "express";

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, accessToken, refreshToken } = await authService.login(
        req.body,
      );
      res.json({ user, accessToken, refreshToken });
    } catch (err) {
      next(err);
    }
  },

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, accessToken, refreshToken } = await authService.register(
        req.body,
      );
      res.status(201).json({ user, accessToken, refreshToken });
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.verifyEmail(req.body.email, req.body.otp);
      res.json({ success: true, message: "Email verified" });
    } catch (err) {
      next(err);
    }
  },

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resendVerification(req.body.email);
      res.json({ success: true, message: "A code was sent" });
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.requestPasswordReset(req.body.email);
      res.json({
        success: true,
        message: "If an account exists for this email, a reset code has been sent.",
      });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body);
      res.json({ success: true, message: "Password reset successfully. You can now sign in." });
    } catch (err) {
      next(err);
    }
  },

  async profile(
    req: Request & { user?: { id: any } },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const user = await authService.getMe(req.user?.id);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },
};
