"use client";

import { motion } from "framer-motion";
import { FileUploadZone } from "@/components/files/FileUploadZone";
import { FileList } from "@/components/files/FileList";
import { FileStatsCard } from "@/components/files/FileStatsCard";
import { useFileStats } from "@/hooks/useFiles";
import { useAuth } from "@/providers/AuthProvider";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useFileStats();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <h1 className="text-xl font-bold text-slate-900">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Manage and organize your uploaded files.
        </p>
      </motion.div>

      <FileStatsCard stats={stats} isLoading={statsLoading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-50">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">Upload Files</h2>
            <FileUploadZone />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-50">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">My Files</h2>
            <FileList />
          </div>
        </div>
      </div>
    </div>
  );
}

