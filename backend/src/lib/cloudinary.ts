import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "node:fs/promises";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  format: string;
  resourceType: string;
  width?: number;
  height?: number;
  bytes: number;
}

/**
 * Upload any file (Image, PDF, Document, etc.) to Cloudinary and clean up the local temp file.
 */
export const uploadToCloudinary = async (
  filePath: string,
  folder = "goldera/files",
): Promise<CloudinaryUploadResult> => {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    throw new AppError(
      "Cloudinary credentials are not configured in environment variables",
      500,
      "CLOUDINARY_CONFIG_ERROR",
    );
  }

  try {
    console.log(`📤 Uploading to Cloudinary [${filePath}]...`);
    const result: UploadApiResponse = await cloudinary.uploader.upload(
      filePath,
      {
        folder,
        resource_type: "auto",
      },
    );

    console.log("☁️ Successfully uploaded to Cloudinary:", result.secure_url);

    // Remove local file after successful upload
    await fs.unlink(filePath).catch(() => {});

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format || "",
      resourceType: result.resource_type || "auto",
      width: result.width,
      height: result.height,
      bytes: result.bytes || 0,
    };
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    // Remove local file on failure to prevent orphaned files
    await fs.unlink(filePath).catch(() => {});
    throw new AppError(
      `Cloudinary upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      500,
      "CLOUDINARY_UPLOAD_ERROR",
      error,
    );
  }
};

export const uploadImageToCloudinary = uploadToCloudinary;

/**
 * Delete an asset from Cloudinary by its publicId and resourceType.
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: string = "image",
): Promise<void> => {
  if (!env.CLOUDINARY_CLOUD_NAME) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType as any,
    });
  } catch (error) {
    console.error(`Failed to delete asset ${publicId} from Cloudinary:`, error);
  }
};

export { cloudinary };
