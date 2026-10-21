import express from "express";
import { filesController } from "./files.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { uploadMultiple } from "../../middlewares/file.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { fileIdParamSchema, listFilesSchema } from "./files.schema.js";

const router = express.Router();


router.use(authenticate);


router.post("/upload", uploadMultiple("files"), filesController.upload);


router.get("/statistics", filesController.statistics);


router.get("/", validate(listFilesSchema), filesController.list);

router.get("/:id", validate(fileIdParamSchema), filesController.getDetails);


router.get("/:id/download", validate(fileIdParamSchema), filesController.download);


router.delete("/:id", validate(fileIdParamSchema), filesController.delete);

export default router;

