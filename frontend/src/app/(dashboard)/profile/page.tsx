"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/common/Button";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { SingleResponse, User } from "@/types";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const updates: { name?: string; email?: string; password?: string } = {};
      if (name !== user.name) updates.name = name;
      if (email !== user.email) updates.email = email;
      if (password) updates.password = password;
      if (Object.keys(updates).length === 0) {
        toast.info("There are no changes to save.");
        return;
      }
      const { data } = await api.patch<SingleResponse<User> & { user: User }>("/auth/profile", updates);
      const updatedUser = data.user;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setPassword("");
      toast.success(data.message || "Profile updated successfully");
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-bold text-slate-900">Profile settings</h1>
      <p className="mt-1 text-sm text-slate-500">Update your name, email address, or password.</p>
      <form onSubmit={save} className="mt-6 space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-50">
        <label className="block text-sm font-medium text-slate-700">Name
          <input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
        </label>
        <label className="block text-sm font-medium text-slate-700">Email
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
        </label>
        <label className="block text-sm font-medium text-slate-700">New password <span className="font-normal text-slate-400">(optional)</span>
          <input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
        </label>
        <div className="flex justify-end"><Button type="submit" variant="primary" isLoading={isSaving}>Save changes</Button></div>
      </form>
    </div>
  );
}
