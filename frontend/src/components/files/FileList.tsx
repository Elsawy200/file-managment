"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, FileX } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Skeleton } from "@/components/common/Skeleton";
import { FileCard } from "./FileCard";
import { useFiles } from "@/hooks/useFiles";
import type { FileFilterParams } from "@/types";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "images", label: "Images" },
  { value: "documents", label: "Docs" },
  { value: "spreadsheets", label: "Sheets" },
  { value: "text", label: "Text" },
] as const;

export function FileList() {
  const [params, setParams] = useState<FileFilterParams>({
    page: 1,
    limit: 12,
    category: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
    search: "",
  });

  const [searchInput, setSearchInput] = useState("");
  const { data, isLoading } = useFiles(params);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((p) => ({ ...p, search: searchInput, page: 1 }));
  };

  const handleCategory = (category: FileFilterParams["category"]) => {
    setParams((p) => ({ ...p, category, page: 1 }));
  };

  const handlePage = (newPage: number) => {
    setParams((p) => ({ ...p, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const files = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            <Search className="h-3.5 w-3.5" />
          </Button>
        </form>

        <div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-0.5">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleCategory(value as FileFilterParams["category"])}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                params.category === value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16"
        >
          <FileX className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No files found</p>
          <p className="text-xs text-slate-400">
            Try a different search or upload some files.
          </p>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {files.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </AnimatePresence>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">
                {pagination.totalItems} files · Page {pagination.currentPage ?? pagination.page} of{" "}
                {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => handlePage((pagination.currentPage ?? pagination.page ?? 1) - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => handlePage((pagination.currentPage ?? pagination.page ?? 1) + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

