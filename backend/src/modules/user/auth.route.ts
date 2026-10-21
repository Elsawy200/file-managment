import express from "express";
import { authController } from "./auth.controller.js";
import { validate } from "../../middlewares/validate.js";
import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
  emailOnlySchema,
  resetPasswordSchema,
} from "./auth.schema.js";
import { authorize } from "../../middlewares/authorize.js";
import {authenticate} from '../../middlewares/authenticate.js'

const router = express.Router();

router.post("/login", validate(loginSchema), authController.login);

router.post("/register", validate(registerSchema), authController.register);
router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  authController.verifyEmail,
);

router.post(
  "/resend-verification",
  validate(emailOnlySchema),
  authController.resendVerification,
);

router.post(
  "/forgot-password",
  validate(emailOnlySchema),
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword,
);

router.get("/profile", authenticate, authorize("USER"), authController.profile);




export default router;
