"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredBilties } from "@/lib/local-persistence";
import { BiltySheetViewer } from "@/components/bilty/bilty-sheet-viewer";

export default function BiltyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const biltyId = params?.id as string;

  const [bilty, setBilty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!biltyId) return;

    let isMounted = true;

    const loadBilty = async () => {
      try {
        // 1. Try local storage first for instant load
        const stored = getStoredBilties();
        let found = stored.find(
          (b: any) =>
            String(b.id) === String(biltyId) ||
            String(b.biltyNumber).toLowerCase() === String(biltyId).toLowerCase()
        );

        if (found && isMounted) {
          setBilty(found);
          setLoading(false);
        }

        // 2. Fetch fresh from API
        try {
          const res = await fetch(`/api/admin/bilty/${biltyId}`);
          if (res.ok) {
            const data = await res.json();
            const record = data.data || data.consignment || data;
            if (record && record.biltyNumber && isMounted) {
              setBilty(record);
            }
          }
        } catch (apiErr) {
          console.warn("API load fallback:", apiErr);
        }

        if (!found && isMounted && !bilty) {
          // If still not found after check
          const recheck = getStoredBilties().find(
            (b: any) =>
              String(b.id) === String(biltyId) ||
              String(b.biltyNumber).toLowerCase() === String(biltyId).toLowerCase()
          );
          if (recheck) {
            setBilty(recheck);
          } else {
            setError(`Bilty record #${biltyId} could not be located.`);
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load consignment");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadBilty();

    return () => {
      isMounted = false;
    };
  }, [biltyId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
        <p className="text-xs font-semibold text-slate-500">Loading 4-Sheet Transport Dossier...</p>
      </div>
    );
  }

  if (error || !bilty) {
    return (
      <div className="max-w-xl mx-auto p-6 mt-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Consignment Not Found</h2>
        <p className="text-xs text-slate-500">{error || "The requested Bilty does not exist or has been deleted."}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/bilty")}
          className="rounded-xl text-xs font-bold gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Bilties</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-20">
      <BiltySheetViewer bilty={bilty} initialTab="consignment" />
    </div>
  );
}
