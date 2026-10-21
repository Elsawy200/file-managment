import { z } from "zod";

export const listFilesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    mimeType: z.string().trim().optional(),
    category: z
      .enum(["all", "images", "documents", "spreadsheets", "text"])
      .optional()
      .default("all"),
    sortBy: z
      .enum(["createdAt", "size", "originalName"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const fileIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Invalid file ID"),
  }),
});

