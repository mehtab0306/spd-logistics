"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function UnifiedLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const showError = (msg: string) => {
    setError(msg);
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const inputEmail = email.trim().toLowerCase();
    const inputPassword = password.trim();

    try {
      const rawUsers = localStorage.getItem("spd_users");
      const usersList = rawUsers ? JSON.parse(rawUsers) : [];
      const storedAdminPass = localStorage.getItem("spd_admin_password");
      const storedActiveUserRaw =
        localStorage.getItem("spd_active_user") || localStorage.getItem("spd_user");
      const storedActiveUser = storedActiveUserRaw ? JSON.parse(storedActiveUserRaw) : null;

      // 1. Look up user by email strictly in spd_users (or active session)
      let matchedUser = usersList.find(
        (u: any) =>
          u.email?.toLowerCase() === inputEmail ||
          u.username?.toLowerCase() === inputEmail
      );

      if (!matchedUser && storedActiveUser) {
        if (
          storedActiveUser.email?.toLowerCase() === inputEmail ||
          storedActiveUser.username?.toLowerCase() === inputEmail
        ) {
          matchedUser = storedActiveUser;
        }
      }

      // Initial fresh bootstrap fallback only if 0 custom passwords exist
      if (!matchedUser) {
        if ((inputEmail === "admin@gmail.com" || inputEmail === "admin") && !storedAdminPass) {
          matchedUser = {
            id: "admin_root",
            name: "System Admin",
            email: "admin@gmail.com",
            password: "admin",
            role: "SUPER_ADMIN",
          };
        } else {
          return showError("User not found!");
        }
      }

      // 2. Strict password validation — old password is completely invalidated
      const activePassword = matchedUser.password || storedAdminPass || "admin";
      if (activePassword !== inputPassword) {
        return showError("Incorrect password! Old password is no longer valid.");
      }

      // 3. Clear any lingering cached fallback password credentials
      sessionStorage.removeItem("spd_legacy_pwd");

      // 4. Set session
      const userSession = {
        id: matchedUser.id || "admin_root",
        name: matchedUser.fullName || matchedUser.name || "System Admin",
        email: matchedUser.email || inputEmail,
        role: matchedUser.role || "SUPER_ADMIN",
        token: "spd-admin-session-token",
        redirectUrl: "/admin",
      };

      localStorage.setItem("spd_user", JSON.stringify(userSession));
      localStorage.setItem("spd_admin_auth", JSON.stringify(userSession));
      sessionStorage.setItem("spd_auth_token", userSession.token);
      document.cookie = `spd-auth-token=${userSession.token}; path=/; max-age=604800; SameSite=Lax`;

      // 5. Background sync
      try {
        fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: inputEmail,
            email: inputEmail,
            password: inputPassword,
            role: "ADMIN",
          }),
        }).catch(() => {});
      } catch {}

      setSuccess(true);
      setTimeout(() => {
        window.location.replace("/admin");
      }, 400);
    } catch (err: any) {
      showError(err.message || "Authentication failed.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-spd-red via-red-600 to-amber-500" />
        <CardHeader className="space-y-3 text-center pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-center">
            <Link href="/" title="Homepage" className="inline-block transition-transform hover:scale-105">
              <img
                src="/images/spd-logo.png"
                alt="SPD Logistics"
                className="w-20 h-20 object-contain rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white shadow-md p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/spd-logo.jpg";
                }}
              />
            </Link>
          </div>
          <div>
            <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <ShieldCheck className="w-6 h-6 text-spd-red" />
              <span>Operations Portal Login</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sign in with your verified operational credentials
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-2 border border-red-200 dark:border-red-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Verified! Opening Operations Hub...</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Email Address or Username
              </Label>
              <div className="relative">
                <Input
                  required
                  type="text"
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl h-11 text-xs pl-10"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your active password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl h-11 text-xs pl-10 pr-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || success}
              className="w-full h-11 bg-spd-red hover:bg-red-700 text-white font-bold rounded-xl shadow-md gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authenticated</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 pt-2 pb-5 border-t border-slate-100 dark:border-slate-800 text-xs text-center text-slate-500">
          <div className="flex items-center justify-center gap-3 font-semibold text-spd-blue dark:text-blue-400">
            <Link href="/admin-login" className="hover:underline">
              Admin Portal
            </Link>
            <span>&bull;</span>
            <Link href="/customer-login" className="hover:underline">
              Customer Portal
            </Link>
            <span>&bull;</span>
            <Link href="/driver-login" className="hover:underline">
              Driver Portal
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
