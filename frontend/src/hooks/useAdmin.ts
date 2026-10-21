"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type {
  User,
  FileItem,
  Role,
  AdminDashboardStatistics,
  AdminUserFilterParams,
  FileFilterParams,
  PaginatedResponse,
  SingleResponse,
  BaseApiResponse,
} from "@/types";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const { data } = await api.get<SingleResponse<AdminDashboardStatistics>>(
        "/admin/dashboard"
      );
      return data.data;
    },
  });
}

export function useAdminUsers(params: AdminUserFilterParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.search) queryParams.set("search", params.search);
  if (params.role) queryParams.set("role", params.role);

  const queryString = queryParams.toString();

  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<User>>(
        `/admin/users${queryString ? `?${queryString}` : ""}`
      );
      return data;
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, role }: { id: number; role: Role }) => {
      const { data } = await api.patch<SingleResponse<User>>(
        `/admin/users/${id}/role`,
        { role }
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "User role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update user role";
      toast.error(message);
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: number;
      name?: string;
      role?: Role;
      emailVerified?: boolean;
    }) => {
      const { data } = await api.patch<SingleResponse<User>>(
        `/admin/users/${id}`,
        updates,
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error: unknown) => {
      const message =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to update user");
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete<BaseApiResponse>(`/admin/users/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "files"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to delete user";
      toast.error(message);
    },
  });
}

export function useAdminFiles(params: FileFilterParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.search) queryParams.set("search", params.search);
  if (params.category && params.category !== "all") {
    queryParams.set("category", params.category);
  }
  if (params.sortBy) queryParams.set("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.set("sortOrder", params.sortOrder);

  const queryString = queryParams.toString();

  return useQuery({
    queryKey: ["admin", "files", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<FileItem>>(
        `/admin/files${queryString ? `?${queryString}` : ""}`
      );
      return data;
    },
  });
}

export function useAdminDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete<BaseApiResponse>(`/admin/files/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "File deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "files"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to delete file";
      toast.error(message);
    },
  });
}

