"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, UserCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';

type AuthStatus = 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';

export default function CustomerLoginPage() {
  const [status, setStatus] = useState<AuthStatus>('IDLE');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'LOADING') return;

    setStatus('LOADING');
    setError('');

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Timeout fallback: strictly prevent infinite spinner
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 12000);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          role: 'CUSTOMER',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Authentication failed. Please check your credentials.');
      }

      // Success transition
      setStatus('SUCCESS');

      if (data.data?.token) {
        try {
          // Double-layer session guarantee: ensure cookie is actively set in document
          document.cookie = `spd-auth-token=${data.data.token}; path=/; max-age=604800; SameSite=Lax`;
          localStorage.setItem('spd_user', JSON.stringify(data.data));
          sessionStorage.setItem('spd_auth_token', data.data.token);
        } catch (storageErr) {
          console.warn('Storage unavailable:', storageErr);
        }
      }

      const targetUrl = data.data?.redirectUrl || '/customer/dashboard';
      setTimeout(() => {
        window.location.replace(targetUrl);
      }, 350);
    } catch (err: any) {
      clearTimeout(timeoutId);
      setStatus('ERROR');
      if (err.name === 'AbortError') {
        setError('Authentication service is unavailable. Please check the server configuration.');
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-black">
      <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        {/* Top Accent Gradient Line */}
        <div className="h-2 bg-gradient-to-r from-spd-blue via-indigo-500 to-sky-500" />

        <CardHeader className="space-y-3 text-center pb-5 border-b border-slate-100 dark:border-slate-800">
          {/* Round SPD Official Logo */}
          <div className="flex justify-center">
            <Link href="/" title="Back to Homepage" className="inline-block transition-transform duration-200 hover:scale-105">
              <img
                src="/images/spd-logo.png"
                alt="SPD Logistics"
                className="w-20 h-20 object-contain rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white shadow-md p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/spd-logo.jpg';
                }}
              />
            </Link>
          </div>

          <div>
            <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <UserCheck className="w-6 h-6 text-spd-blue" />
              <span>Customer Portal</span>
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sign in to manage your shipments, bilties, and account balance
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl flex items-start justify-between gap-2 border border-red-200 dark:border-red-800 animate-fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setError(''); setStatus('IDLE'); }}
                  className="underline hover:text-red-700 font-bold shrink-0 text-[11px]"
                >
                  Try Again
                </button>
              </div>
            )}

            {status === 'SUCCESS' && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Authentication successful! Opening Customer Dashboard...</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Email or Registered Phone
              </Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="customer@example.com or 03001234567"
                className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus-visible:ring-spd-blue"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 pr-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus-visible:ring-spd-blue"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" name="remember" />
                <label
                  htmlFor="remember"
                  className="text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Remember session (7 days)
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-spd-blue hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-all gap-2 text-base"
              disabled={status === 'LOADING' || status === 'SUCCESS'}
            >
              {status === 'LOADING' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authenticating credentials...</span>
                </>
              ) : status === 'SUCCESS' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 animate-bounce" />
                  <span>Opening Customer Dashboard...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-3 pb-6 border-t border-slate-100 dark:border-slate-800 text-xs text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-center gap-4 pt-1 font-semibold text-spd-blue dark:text-blue-400">
            <Link href="/admin-login" className="hover:underline">
              Admin Portal
            </Link>
            <span>&bull;</span>
            <Link href="/driver-login" className="hover:underline">
              Driver Portal
            </Link>
            <span>&bull;</span>
            <Link href="/" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
