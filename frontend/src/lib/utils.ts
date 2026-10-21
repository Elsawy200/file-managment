import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getFileCategory(mimeType: string): string {
  if (!mimeType) return "other";
  if (mimeType.startsWith("image/")) return "images";
  if (mimeType === "application/pdf") return "documents";
  if (
    mimeType.includes("word") ||
    mimeType.includes("officedocument.wordprocessingml")
  ) {
    return "documents";
  }
  if (
    mimeType.includes("sheet") ||
    mimeType.includes("csv") ||
    mimeType.includes("excel")
  ) {
    return "spreadsheets";
  }
  if (mimeType.startsWith("text/")) return "text";
  return "other";
}

