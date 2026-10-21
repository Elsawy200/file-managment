"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Download,
  Trash2,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { useDeleteFile } from "@/hooks/useFiles";
import { formatBytes, formatDate, getFileCategory } from "@/lib/utils";
import type { FileItem } from "@/types";

interface FileCardProps {
  file: FileItem;
  showUser?: boolean;
  onDelete?: (id: number) => void;
  deleteMutation?: ReturnType<typeof useDeleteFile>;
}

const categoryConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  images: { icon: Image, color: "text-blue-500", bg: "bg-blue-50" },
  documents: { icon: FileText, color: "text-rose-500", bg: "bg-rose-50" },
  spreadsheets: { icon: FileSpreadsheet, color: "text-emerald-500", bg: "bg-emerald-50" },
  text: { icon: FileText, color: "text-amber-500", bg: "bg-amber-50" },
  other: { icon: File, color: "text-slate-500", bg: "bg-slate-100" },
};

export function FileCard({ file, showUser = false, deleteMutation }: FileCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const defaultDelete = useDeleteFile();
  const { mutate: deleteFile, isPending } = deleteMutation || defaultDelete;

  const category = getFileCategory(file.mimeType);
  const config = categoryConfig[category] || categoryConfig.other;
  const Icon = config.icon;

  const handleDelete = () => {
    deleteFile(file.id, {
      onSuccess: () => setConfirmOpen(false),
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-50 hover:border-slate-200 hover:shadow-md hover:shadow-slate-100 transition-all duration-200"
      >
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bg}`}>
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {file.originalName}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatBytes(file.size)} · {formatDate(file.createdAt)}
            </p>
            {showUser && file.user && (
              <p className="text-xs text-indigo-500 mt-0.5">{file.user.email}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link href={`/files/${file.id}`} className="flex-1">
            <Button variant="ghost" size="sm" className="w-full text-slate-500">
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
          </Link>
          <a href={file.path} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </a>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete File"
        description="This action cannot be undone."
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-800">{file.originalName}</span>?
        </p>
        <div className="mt-5 flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={isPending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}

