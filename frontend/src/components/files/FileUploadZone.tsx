"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/common/Button";
import { useUploadFiles } from "@/hooks/useFiles";
import { formatBytes } from "@/lib/utils";
import { toast } from "sonner";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface PendingFile {
  id: string;
  file: File;
}

export function FileUploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const { mutate: upload, isPending } = useUploadFiles();

  const addFiles = useCallback((incoming: File[]) => {
    const oversizedFiles = incoming.filter((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (oversizedFiles.length > 0) {
      toast.error(
        `${oversizedFiles.map((file) => file.name).join(", ")} ${
          oversizedFiles.length === 1 ? "exceeds" : "exceed"
        } the 5 MB file limit.`,
      );
    }

    const entries = incoming
      .filter((file) => file.size <= MAX_FILE_SIZE_BYTES)
      .map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      file: f,
      }));
    setPendingFiles((prev) => [...prev, ...entries]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(Array.from(e.target.files));
      }
      e.target.value = "";
    },
    [addFiles]
  );

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = () => {
    if (!pendingFiles.length) return;
    const formData = new FormData();
    pendingFiles.forEach(({ file }) => formData.append("files", file));
    upload(formData, {
      onSuccess: () => setPendingFiles([]),
    });
  };

  return (
    <div className="space-y-3">
      <motion.label
        htmlFor="file-input"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging ? "#6366f1" : "#e2e8f0",
          backgroundColor: isDragging ? "#eef2ff" : "#f8fafc",
        }}
        transition={{ duration: 0.15 }}
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer p-8 text-center transition-colors"
      >
        <motion.div
          animate={{ scale: isDragging ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100"
        >
          <Upload className={`h-6 w-6 ${isDragging ? "text-indigo-600" : "text-indigo-500"}`} />
        </motion.div>
        <div>
          <p className="text-sm font-semibold text-slate-700">
            {isDragging ? "Drop files here" : "Drag & drop or click to upload"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            PDF, Word, Images, Text, Spreadsheets · Max 5 MB per file
          </p>
        </div>
        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
          accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,image/*"
        />
      </motion.label>

      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
              {pendingFiles.map(({ id, file }) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2"
                >
                  <FileText className="h-4 w-4 shrink-0 text-indigo-400" />
                  <span className="flex-1 truncate text-xs text-slate-700">
                    {file.name}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatBytes(file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(id)}
                    className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>

            <Button
              onClick={handleUpload}
              isLoading={isPending}
              disabled={isPending}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4" />
              Upload {pendingFiles.length} file{pendingFiles.length !== 1 ? "s" : ""}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

