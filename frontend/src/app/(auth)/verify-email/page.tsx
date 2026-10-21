"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { HardDrive, Mail } from "lucide-react";
import { Button } from "@/components/common/Button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Suspense } from "react";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const intervalId = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [resendSeconds]);

  const resendLabel = `Resend code${
    resendSeconds > 0
      ? ` in ${Math.floor(resendSeconds / 60)}:${String(resendSeconds % 60).padStart(2, "0")}`
      : ""
  }`;

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the full 6-digit code");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/auth/verify-email", { email, otp: code });
      toast.success("Email verified! You can now sign in.");
      router.push("/login");
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Invalid or expired code";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await api.post("/auth/resend-verification", { email });
      toast.success("A new code was sent to your email.");
      setResendSeconds(60);
    } catch (error: any) {
      const responseError = error.response?.data?.error;
      const retryAfterSeconds = responseError?.details?.retryAfterSeconds;
      if (typeof retryAfterSeconds === "number") {
        setResendSeconds(retryAfterSeconds);
      }
      const message = responseError?.message || "Failed to resend code";
      toast.error(message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Verify your email</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold text-slate-700">{email || "your email"}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  className="h-12 w-11 rounded-xl border border-slate-200 bg-slate-50 text-center text-lg font-bold text-slate-900 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors"
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Verify Email
            </Button>
          </form>

          <div className="mt-5 text-center space-y-2">
            <p className="text-xs text-slate-500">
              Didn&apos;t receive a code?
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              isLoading={resendLoading}
              disabled={resendSeconds > 0}
              className="text-indigo-600 hover:text-indigo-700"
            >
              {resendLabel}
            </Button>
            <div className="pt-1">
              <Link
                href="/login"
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}

