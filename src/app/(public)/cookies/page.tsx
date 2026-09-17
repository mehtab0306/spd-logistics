import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Cookie, ShieldCheck, CheckCircle2, Building2, Calendar, ArrowLeft } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Cookie Policy | ${APP_NAME} - Super Pak Data Goods Transport Co.`,
  description: 'Cookie and Local Storage Policy for Super Pak Data Goods Transport Co. (SPD Logistics). Information regarding our minimal session tokens and technical cookies.',
};

export default function CookiesPage() {
  return (
    <div className="flex flex-col min-h-screen py-10 md:py-16">
      <div className="container max-w-4xl px-4 md:px-6 mx-auto">
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-blue-950 text-white rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-800 mb-10 relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold text-xs tracking-wide uppercase mb-4 border border-blue-500/30">
              <Cookie className="w-4 h-4 text-blue-400" />
              Technical Privacy Disclosure
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Cookie <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-white to-blue-400">Policy</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Super Pak Data Goods Transport Co. ({APP_NAME}) maintains a strict minimal-data policy. We use only strictly necessary technical cookies to keep your session authenticated and store theme preferences.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-4 mt-4 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-400" /> Last Updated: September 2026
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Strictly Necessary Cookies
            </h2>
            <p className="mb-4">
              Unlike consumer platforms, SPD Logistics does not deploy advertising tracking pixels or third-party behavioral analytics cookies. We utilize only essential technical storage tokens:
            </p>
            <div className="overflow-x-auto my-4">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                    <th className="p-3 font-semibold text-slate-900 dark:text-white">Token</th>
                    <th className="p-3 font-semibold text-slate-900 dark:text-white">Storage</th>
                    <th className="p-3 font-semibold text-slate-900 dark:text-white">Function</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs md:text-sm">
                  <tr>
                    <td className="p-3 font-mono font-bold text-primary">spd_token</td>
                    <td className="p-3">HTTP-only Cookie</td>
                    <td className="p-3">Maintains signed JWT authentication for logged-in Staff, Admin, Customer, and Driver portal sessions. Encrypted and expires upon sign-out.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-primary">theme</td>
                    <td className="p-3">Local Storage</td>
                    <td className="p-3">Remembers your user interface preference between Light Mode and Dark Mode.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-primary">sidebar_state</td>
                    <td className="p-3">Local Storage</td>
                    <td className="p-3">Saves the collapsed or expanded state of the portal navigation menu for your convenience.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs md:text-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">How to Manage Cookies</h3>
            <p className="text-slate-600 dark:text-slate-400">
              You can configure your web browser to reject or clear all cookies. However, please note that disabling cookies will prevent you from signing in to the SPD Logistics Admin, Customer, or Driver management portals.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 text-xs md:text-sm">
            <Link href="/privacy-policy" className="text-primary hover:underline font-semibold flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Full Privacy Policy
            </Link>
            <Link href="/terms" className="text-blue-500 hover:underline font-semibold">
              View Terms & Conditions &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
