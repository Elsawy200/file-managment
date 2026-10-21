"use client";

import { use } from "react";
import { useFileDetails } from "@/hooks/useFiles";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Download,
  HardDrive,
  Calendar,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/common/Button";
import { Skeleton } from "@/components/common/Skeleton";
import { Badge } from "@/components/common/Badge";
import { formatBytes, formatDate, getFileCategory } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export default function FileDetailsPage({ params }: Params) {
  const { id } = use(params);
  const { data: file, isLoading } = useFileDetails(Number(id));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <FileText className="h-12 w-12 mb-3" />
        <p className="text-sm font-medium">File not found</p>
        <Link href="/dashboard" className="mt-3">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const category = getFileCategory(file.mimeType);
  const isImage = file.mimeType.startsWith("image/");

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        </Link>
        <h1 className="truncate text-lg font-bold text-slate-900">
          {file.originalName}
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-50"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <HardDrive className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Size</p>
              <p className="text-sm font-semibold text-slate-800">{formatBytes(file.size)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <Tag className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Type</p>
              <Badge variant="info" className="mt-0.5 capitalize">{category}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <Calendar className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Uploaded</p>
              <p className="text-xs font-medium text-slate-800">{formatDate(file.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={file.path} target="_blank" rel="noopener noreferrer" className="w-full">
              <Button variant="primary" size="sm" className="w-full">
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </a>
          </div>
        </div>
      </motion.div>

      {isImage && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-50"
        >
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Image Preview</h2>
          <img
            src={file.path}
            alt={file.originalName}
            className="max-h-[32rem] w-full rounded-xl bg-slate-50 object-contain"
          />
        </motion.div>
      )}

      {file.extractedText && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-50"
        >
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Extracted Content
          </h2>
          <div className="rounded-xl bg-slate-50 p-4 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-xs text-slate-700 leading-relaxed font-mono">
              {file.extractedText}
            </pre>
          </div>
        </motion.div>
      )}
    </div>
  );
}

