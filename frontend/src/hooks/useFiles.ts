"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type {
  FileItem,
  FileStatistics,
  FileFilterParams,
  PaginatedResponse,
  SingleResponse,
  BaseApiResponse,
} from "@/types";

export function useFiles(params: FileFilterParams = {}) {
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
    queryKey: ["files", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<FileItem>>(
        `/files${queryString ? `?${queryString}` : ""}`
      );
      return data;
    },
  });
}

export function useFileDetails(id: number | null) {
  return useQuery({
    queryKey: ["file", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get<SingleResponse<FileItem>>(`/files/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useFileStats() {
  return useQuery({
    queryKey: ["file-stats"],
    queryFn: async () => {
      const { data } = await api.get<SingleResponse<FileStatistics>>(
        "/files/statistics"
      );
      return data.data;
    },
  });
}

export function useUploadFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post<SingleResponse<FileItem[]>>(
        "/files/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Files uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["file-stats"] });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to upload files";
      toast.error(message);
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete<BaseApiResponse>(`/files/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "File deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["file-stats"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to delete file";
      toast.error(message);
    },
  });
}

