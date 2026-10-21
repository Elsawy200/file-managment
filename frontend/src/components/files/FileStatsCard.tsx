"use client";

import { HardDrive, Files, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/common/Skeleton";
import { formatBytes } from "@/lib/utils";
import type { FileStatistics } from "@/types";

interface FileStatsCardProps {
  stats?: FileStatistics;
  isLoading: boolean;
}

export function FileStatsCard({ stats, isLoading }: FileStatsCardProps) {
  const cards = [
    {
      label: "Total Files",
      value: stats?.totalFiles ?? 0,
      icon: Files,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
      display: String(stats?.totalFiles ?? 0),
    },
    {
      label: "Storage Used",
      value: stats?.totalStorageBytes ?? 0,
      icon: HardDrive,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      display: formatBytes(stats?.totalStorageBytes ?? 0),
    },
    {
      label: "File Types",
      value: stats?.byFileType?.length ?? 0,
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-50",
      display: String(stats?.byFileType?.length ?? 0),
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map(({ label, icon: Icon, color, bg, display }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-50"
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="text-lg font-bold text-slate-900 leading-tight">
              {display}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

