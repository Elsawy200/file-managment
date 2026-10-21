export type Role = "USER" | "ADMIN";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface FileItem {
  id: number;
  userId: number;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  path: string;
  extractedText?: string | null;
  extractedMeta?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface PaginationMeta {
  page?: number;
  currentPage?: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface BaseApiResponse {
  success: boolean;
  message: string;
}

export interface FileCategoryStat {
  category: string;
  count: number;
  bytes: number;
}

export interface FileStatistics {
  totalFiles: number;
  totalStorageBytes: number;
  byFileType: FileCategoryStat[];
}

export interface AdminDashboardStatistics {
  totalUsers: number;
  verifiedUsers: number;
  totalFiles: number;
  totalStorageBytes: number;
  mostUploadedFileTypes: {
    mimeType: string;
    displayName: string;
    count: number;
    bytes: number;
  }[];
  recentUploads: FileItem[];
}

export interface FileFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: "all" | "images" | "documents" | "spreadsheets" | "text";
  sortBy?: "createdAt" | "size" | "originalName";
  sortOrder?: "asc" | "desc";
}

export interface AdminUserFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
}

