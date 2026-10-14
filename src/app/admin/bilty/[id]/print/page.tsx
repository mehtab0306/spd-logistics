"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredBilties } from "@/lib/local-persistence";
import { BiltyConsignmentNote } from "@/components/bilty/bilty-consignment-note";

export default function BiltyConsignmentPrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawId = (params?.id as string) || "";
  const biltyId = decodeURIComponent(rawId).trim();
  const autoPrint = searchParams.get("autoprint") === "true";

  const [bilty, setBilty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const target = biltyId.toUpperCase();
    let found = getStoredBilties().find(
      (b: any) =>
        b &&
        (String(b.id || "").toUpperCase() === target ||
          String(b.biltyNumber || "").toUpperCase() === target ||
          String(b.trackingId || "").toUpperCase() === target)
    );

    if (found) {
      setBilty(found);
      setLoading(false);
    }

    fetch(`/api/admin/bilty/${encodeURIComponent(biltyId)}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        const record = data?.data || data?.consignment || data;
        if (record && record.biltyNumber) {
          setBilty(record);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));

    if (autoPrint) {
      const timer = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timer);
    }
  }, [biltyId, autoPrint]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
        <p className="text-xs font-semibold text-slate-500">Preparing Consignment Note Voucher...</p>
      </div>
    );
  }

  if (!bilty) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Bilty #{biltyId} not found.{" "}
        <Button variant="link" size="sm" onClick={() => router.push("/admin/bilty")}>
          Back to Bilties
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 print:p-0 print:max-w-none print:w-full">
      <div className="flex items-center justify-between border-b pb-4 mb-4 print:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/bilty/${biltyId}`)}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dossier</span>
          </Button>
          <span className="text-xs text-slate-400">|</span>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Consignment Note #{bilty.biltyNumber}
          </p>
        </div>

        <Button
          onClick={() => window.print()}
          className="bg-spd-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl gap-2 shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Consignment Note</span>
        </Button>
      </div>

      <BiltyConsignmentNote bilty={bilty} />
    </div>
  );
}
