"use client";

import { motion } from "framer-motion";
import { Users, Files, HardDrive, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/common/Skeleton";
import { formatBytes } from "@/lib/utils";
import type { AdminDashboardStatistics } from "@/types";

interface AdminStatsProps {
  stats?: AdminDashboardStatistics;
  isLoading: boolean;
}

export function AdminStats({ stats, isLoading }: AdminStatsProps) {
  const cards = [
    {
      label: "Total Users",
      display: String(stats?.totalUsers ?? 0),
      icon: Users,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
    {
      label: "Verified Users",
      display: String(stats?.verifiedUsers ?? 0),
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Files",
      display: String(stats?.totalFiles ?? 0),
      icon: Files,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      label: "Total Storage",
      display: formatBytes(stats?.totalStorageBytes ?? 0),
      icon: HardDrive,
      color: "text-rose-500",
      bg: "bg-rose-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map(({ label, display, icon: Icon, color, bg }, i) => (
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
              <p className="text-lg font-bold text-slate-900 leading-tight">{display}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {stats?.mostUploadedFileTypes && stats.mostUploadedFileTypes.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-50">
          <p className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            File Types Breakdown
          </p>
          <div className="space-y-2">
            {stats.mostUploadedFileTypes.map((type, i) => {
              const maxCount = stats.mostUploadedFileTypes[0]?.count ?? 1;
              const percent = Math.round((type.count / maxCount) * 100);
              return (
                <div key={type.mimeType} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-xs text-slate-600">
                    {type.displayName}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ delay: i * 0.05 + 0.2, duration: 0.4 }}
                      className="h-full rounded-full bg-indigo-400"
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs font-semibold text-slate-700">
                    {type.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

