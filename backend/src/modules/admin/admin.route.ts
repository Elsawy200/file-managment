import express from "express";
import { adminController } from "./admin.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { adminOnly } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  listUsersSchema,
  updateRoleSchema,
  userIdParamSchema,
  listAdminFilesSchema,
  fileIdParamSchema,
} from "./admin.schema.js";

const router = express.Router();


router.use(authenticate, adminOnly);


router.get("/dashboard", adminController.getDashboard);


router.get("/users", validate(listUsersSchema), adminController.listUsers);
router.patch(
  "/users/:id/role",
  validate(updateRoleSchema),
  adminController.updateUserRole,
);
router.delete(
  "/users/:id",
  validate(userIdParamSchema),
  adminController.deleteUser,
);

router.get("/files", validate(listAdminFilesSchema), adminController.listAllFiles);
router.delete(
  "/files/:id",
  validate(fileIdParamSchema),
  adminController.deleteFile,
);

export default router;

