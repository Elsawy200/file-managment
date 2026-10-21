"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminStats } from "@/components/admin/AdminStats";
import { UserTable } from "@/components/admin/UserTable";
import { AdminFilesTable } from "@/components/admin/AdminFilesTable";
import { useAdminDashboard } from "@/hooks/useAdmin";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "users", label: "Users" },
  { value: "files", label: "Files" },
] as const;

type Tab = (typeof TABS)[number]["value"];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const { data: stats, isLoading: statsLoading } = useAdminDashboard();

  return (
    <ProtectedRoute adminOnly>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage users, files, and platform statistics.
          </p>
        </motion.div>

        <div className="flex gap-1 rounded-xl border border-slate-100 bg-slate-50 p-0.5 w-fit">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
                activeTab === value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <AdminStats stats={stats} isLoading={statsLoading} />
        )}

        {activeTab === "users" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-50">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">User Management</h2>
            <UserTable />
          </div>
        )}

        {activeTab === "files" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-50">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">File Moderation</h2>
            <AdminFilesTable />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

