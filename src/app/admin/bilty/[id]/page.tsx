"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredBilties } from "@/lib/local-persistence";
import { BiltySheetViewer } from "@/components/bilty/bilty-sheet-viewer";
import { LogisticsLoader } from "@/components/shared/logistics-loader";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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
            String(b.manualBiltyNumber || "").toUpperCase() === target ||
            String(b.trackingId || "").toUpperCase() === target)
      );
    };

    const loadBilty = async () => {
      try {
        let matchedRecord: any = null;

        // 1. Find local rich record first (contains full breakdown, items, CBM, photos)
        let localRichRecord: any = null;
        if (typeof window !== "undefined") {
          try {
            const selected = localStorage.getItem("spd_selected_bilty");
            if (selected) {
              const parsed = JSON.parse(selected);
              if (
                parsed &&
                (String(parsed.id || "").toUpperCase() === biltyId.toUpperCase() ||
                  String(parsed.biltyNumber || "").toUpperCase() === biltyId.toUpperCase() ||
                  String(parsed.manualBiltyNumber || "").toUpperCase() === biltyId.toUpperCase() ||
                  String(parsed.trackingId || "").toUpperCase() === biltyId.toUpperCase())
              ) {
                localRichRecord = parsed;
              }
            }
          } catch {}

          if (!localRichRecord) {
            try {
              const lastCreated = sessionStorage.getItem("last_created_bilty");
              if (lastCreated) {
                const parsed = JSON.parse(lastCreated);
                if (
                  parsed &&
                  (String(parsed.id || "").toUpperCase() === biltyId.toUpperCase() ||
                    String(parsed.biltyNumber || "").toUpperCase() === biltyId.toUpperCase() ||
                    String(parsed.manualBiltyNumber || "").toUpperCase() === biltyId.toUpperCase() ||
                    String(parsed.trackingId || "").toUpperCase() === biltyId.toUpperCase())
                ) {
                  localRichRecord = parsed;
                }
              }
            } catch {}
          }

          if (!localRichRecord) {
            const stored = getStoredBilties();
            localRichRecord = findMatchInList(stored);
          }

          if (!localRichRecord) {
            try {
              const raw1 = JSON.parse(localStorage.getItem("spd_bilties") || "[]");
              const raw2 = JSON.parse(localStorage.getItem("spd_local_bilties") || "[]");
              localRichRecord = findMatchInList([...(Array.isArray(raw1) ? raw1 : []), ...(Array.isArray(raw2) ? raw2 : [])]);
            } catch {}
          }
        }

        // 2. Check Supabase database directly for real-time cross-device updates
        if (isSupabaseConfigured) {
          try {
            const { data: sbRow } = await supabase
              .from("bilties")
              .select("*")
              .or(`bilty_number.eq.${biltyId},id.eq.${biltyId}`)
              .maybeSingle();

            if (sbRow) {
              matchedRecord = {
                ...localRichRecord,
                id: sbRow.id || sbRow.bilty_number || localRichRecord?.id,
                biltyNumber: sbRow.bilty_number || sbRow.id || localRichRecord?.biltyNumber,
                manualBiltyNumber: sbRow.manual_bilty_number || localRichRecord?.manualBiltyNumber || sbRow.bilty_number || sbRow.id,
                trackingId: sbRow.bilty_number || localRichRecord?.trackingId || sbRow.id,
                bookingDate: sbRow.booking_date || sbRow.created_at || localRichRecord?.bookingDate || new Date().toISOString(),
                senderName: sbRow.sender_name || localRichRecord?.senderName || "Walk-in Shipper",
                senderPhone: sbRow.sender_phone || localRichRecord?.senderPhone || "",
                receiverName: sbRow.receiver_name || localRichRecord?.receiverName || "Consignee",
                receiverPhone: sbRow.receiver_phone || localRichRecord?.receiverPhone || "",
                origin: sbRow.origin_station || sbRow.origin || localRichRecord?.origin || "Lahore",
                destination: sbRow.destination_station || sbRow.destination || localRichRecord?.destination || "Karachi",
                totalFreight: Number(sbRow.freight_amount ?? sbRow.total_freight ?? localRichRecord?.totalFreight ?? 0),
                totalAmount: Number(sbRow.freight_amount ?? sbRow.total_freight ?? localRichRecord?.totalAmount ?? 0),
                freightAmount: Number(sbRow.freight_amount ?? sbRow.total_freight ?? localRichRecord?.freightAmount ?? 0),
                paidAmount: Number(sbRow.advance_paid ?? localRichRecord?.paidAmount ?? 0),
                remainingBalance: Number(sbRow.remaining_balance ?? localRichRecord?.remainingBalance ?? 0),
                paymentMode: sbRow.payment_mode || localRichRecord?.paymentMode || "TO-PAY",
                status: sbRow.status || localRichRecord?.status || "Booked",
                shipmentStatus: (sbRow.status || localRichRecord?.shipmentStatus || "BOOKED").toUpperCase(),
                vehicleNumber: sbRow.vehicle_number || localRichRecord?.vehicleNumber || "Pending",
                driverName: sbRow.driver_name || localRichRecord?.driverName || "Pending",
                additionalChargesBreakdown: localRichRecord?.additionalChargesBreakdown || {
                  godownStorage: sbRow.storage_charges || 0,
                  labour: sbRow.labour_charges || 0,
                  pickupLocal: 0,
                  deliveryLocal: 0,
                  lifterCrane: 0,
                  other: sbRow.other_charges || 0,
                },
                items: (localRichRecord?.items && localRichRecord.items.length > 0) ? localRichRecord.items : (sbRow.item_description ? [{ detail: sbRow.item_description, packages: sbRow.packages_count || 1, weight: sbRow.weight || 0, rate: sbRow.freight_amount || 0 }] : []),
                photos: localRichRecord?.photos || [],
                cargoPhoto: localRichRecord?.cargoPhoto || null,
                biltyPhoto: localRichRecord?.biltyPhoto || null,
                weightSlipPhoto: localRichRecord?.weightSlipPhoto || null,
                cpm: localRichRecord?.cpm || null,
              };
            }
          } catch (sbErr) {
            console.warn("Direct Supabase bilty lookup notice:", sbErr);
          }
        }

        if (!matchedRecord && localRichRecord) {
          matchedRecord = localRichRecord;
        }

        if (matchedRecord && isMounted) {
          setBilty(matchedRecord);
          setLoading(false);
        }

        // 3. Fetch fresh record from API in background or fallback
        try {
          const res = await fetch(`/api/admin/bilty/${encodeURIComponent(biltyId)}`);
          if (res.ok) {
            const data = await res.json();
            const record = data.data || data.consignment || data;
            if (record && record.biltyNumber && isMounted) {
              matchedRecord = {
                ...matchedRecord,
                ...record,
                additionalChargesBreakdown: record.additionalChargesBreakdown || matchedRecord?.additionalChargesBreakdown,
                items: (record.items && record.items.length > 0) ? record.items : (matchedRecord?.items || []),
                cpm: record.cpm !== undefined && record.cpm !== null ? record.cpm : matchedRecord?.cpm,
                photos: record.photos || matchedRecord?.photos,
              };
              setBilty(matchedRecord);
            }
          } else {
            // Also try query param fallback
            const resParam = await fetch(`/api/admin/bilty?id=${encodeURIComponent(biltyId)}`);
            if (resParam.ok) {
              const dataParam = await resParam.json();
              const recordParam = dataParam.data || dataParam.consignment || dataParam;
              if (recordParam && recordParam.biltyNumber && isMounted) {
                matchedRecord = {
                  ...matchedRecord,
                  ...recordParam,
                  additionalChargesBreakdown: recordParam.additionalChargesBreakdown || matchedRecord?.additionalChargesBreakdown,
                  items: (recordParam.items && recordParam.items.length > 0) ? recordParam.items : (matchedRecord?.items || []),
                  cpm: recordParam.cpm !== undefined && recordParam.cpm !== null ? recordParam.cpm : matchedRecord?.cpm,
                  photos: recordParam.photos || matchedRecord?.photos,
                };
                setBilty(matchedRecord);
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <LogisticsLoader subtitle="Loading Transport Sheets..." />
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
