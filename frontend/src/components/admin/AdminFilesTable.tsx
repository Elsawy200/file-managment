"use client";

import { useState } from "react";
import { Search, Trash2, FileX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Skeleton } from "@/components/common/Skeleton";
import { useAdminFiles, useAdminDeleteFile } from "@/hooks/useAdmin";
import { formatBytes, formatDate, getFileCategory } from "@/lib/utils";
import type { FileFilterParams, FileItem } from "@/types";

export function AdminFilesTable() {
  const [params, setParams] = useState<FileFilterParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [searchInput, setSearchInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<FileItem | null>(null);

  const { data, isLoading } = useAdminFiles(params);
  const { mutate: deleteFile, isPending: deleteLoading } = useAdminDeleteFile();

  const files = data?.data ?? [];
  const pagination = data?.pagination;
  const currentPage = pagination?.currentPage ?? pagination?.page ?? params.page ?? 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((p) => ({ ...p, search: searchInput, page: 1 }));
  };

  const handlePage = (newPage: number) => {
    setParams((p) => ({ ...p, page: newPage }));
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
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

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-slate-400">
          <FileX className="h-8 w-8 mb-2" />
          <p className="text-sm">No files found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">File</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide sm:table-cell">Owner</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide md:table-cell">Size</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide lg:table-cell">Uploaded</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              <AnimatePresence>
                {files.map((file) => (
                  <motion.tr
                    key={file.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="truncate max-w-[180px] font-medium text-slate-800">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">
                        {getFileCategory(file.mimeType)}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {file.user ? (
                        <div>
                          <p className="text-xs font-medium text-slate-700">{file.user.name}</p>
                          <p className="text-xs text-slate-400">{file.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-slate-500 md:table-cell">
                      {formatBytes(file.size)}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-slate-500 lg:table-cell">
                      {formatDate(file.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDelete(file)}
                          className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            {pagination.totalItems} files · Page {currentPage} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => handlePage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => handlePage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete File"
        description="This action cannot be undone."
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-800">{confirmDelete?.originalName}</span>?
        </p>
        <div className="mt-5 flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={deleteLoading}
            onClick={() => {
              if (confirmDelete) {
                deleteFile(confirmDelete.id, {
                  onSuccess: () => setConfirmDelete(null),
                });
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

