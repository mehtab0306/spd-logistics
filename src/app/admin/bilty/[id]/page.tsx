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
  const rawId = (params?.id as string) || "";
  const biltyId = decodeURIComponent(rawId).trim();

  const [bilty, setBilty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!biltyId) return;

    let isMounted = true;

    const findMatchInList = (list: any[]) => {
      const target = biltyId.toUpperCase();
      return list.find(
        (b: any) =>
          b &&
          (String(b.id || "").toUpperCase() === target ||
            String(b.biltyNumber || "").toUpperCase() === target ||
            String(b.trackingId || "").toUpperCase() === target)
      );
    };

    const loadBilty = async () => {
      try {
        let matchedRecord: any = null;

        // 1. Check spd_selected_bilty & sessionStorage for instant load
        if (typeof window !== "undefined") {
          try {
            const selected = localStorage.getItem("spd_selected_bilty");
            if (selected) {
              const parsed = JSON.parse(selected);
              if (
                parsed &&
                (String(parsed.id || "").toUpperCase() === biltyId.toUpperCase() ||
                  String(parsed.biltyNumber || "").toUpperCase() === biltyId.toUpperCase() ||
                  String(parsed.trackingId || "").toUpperCase() === biltyId.toUpperCase())
              ) {
                matchedRecord = parsed;
              }
            }
          } catch {}

          if (!matchedRecord) {
            try {
              const lastCreated = sessionStorage.getItem("last_created_bilty");
              if (lastCreated) {
                const parsed = JSON.parse(lastCreated);
                if (
                  parsed &&
                  (String(parsed.id || "").toUpperCase() === biltyId.toUpperCase() ||
                    String(parsed.biltyNumber || "").toUpperCase() === biltyId.toUpperCase() ||
                    String(parsed.trackingId || "").toUpperCase() === biltyId.toUpperCase())
                ) {
                  matchedRecord = parsed;
                }
              }
            } catch {}
          }
        }

        // 2. Check local storage
        if (!matchedRecord) {
          const stored = getStoredBilties();
          matchedRecord = findMatchInList(stored);
        }

        // 3. Fallback check raw localStorage keys directly
        if (!matchedRecord && typeof window !== "undefined") {
          try {
            const raw1 = JSON.parse(localStorage.getItem("spd_bilties") || "[]");
            const raw2 = JSON.parse(localStorage.getItem("spd_local_bilties") || "[]");
            matchedRecord = findMatchInList([...(Array.isArray(raw1) ? raw1 : []), ...(Array.isArray(raw2) ? raw2 : [])]);
          } catch {}
        }

        if (matchedRecord && isMounted) {
          setBilty(matchedRecord);
          setLoading(false);
        }

        // 4. Fetch fresh record from API in background or fallback
        try {
          const res = await fetch(`/api/admin/bilty/${encodeURIComponent(biltyId)}`);
          if (res.ok) {
            const data = await res.json();
            const record = data.data || data.consignment || data;
            if (record && record.biltyNumber && isMounted) {
              matchedRecord = record;
              setBilty(record);
            }
          } else {
            // Also try query param fallback
            const resParam = await fetch(`/api/admin/bilty?id=${encodeURIComponent(biltyId)}`);
            if (resParam.ok) {
              const dataParam = await resParam.json();
              const recordParam = dataParam.data || dataParam.consignment || dataParam;
              if (recordParam && recordParam.biltyNumber && isMounted) {
                matchedRecord = recordParam;
                setBilty(recordParam);
              }
            }
          }
        } catch (apiErr) {
          console.warn("API bilty load notice:", apiErr);
        }

        if (!matchedRecord && isMounted) {
          // Final retry from local storage
          const finalCheck = findMatchInList(getStoredBilties());
          if (finalCheck) {
            setBilty(finalCheck);
          } else {
            setError(`Bilty record #${biltyId} could not be located in local records or central database.`);
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
