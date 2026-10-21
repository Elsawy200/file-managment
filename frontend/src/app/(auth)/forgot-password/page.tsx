"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HardDrive } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data } = await api.post("/auth/forgot-password", { email: normalizedEmail });
      toast.success(data.message);
      router.push(`/reset-password?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not request a password reset");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/50 px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
            <HardDrive className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Forgot password?</h1>
          <p className="mt-1 text-sm text-slate-500">We’ll email you a code to reset it.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Send reset code
            </Button>
          </form>
          <p className="mt-5 text-center text-xs text-slate-500">
            Remembered it? <Link href="/login" className="font-semibold text-indigo-600">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
