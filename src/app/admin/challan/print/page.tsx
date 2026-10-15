"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PrintableChallan } from "@/components/challan/printable-challan";
import { getStoredChallans, getStoredBilties } from "@/lib/local-persistence";
import { Loader2 } from "lucide-react";

function ChallanPrintContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const challanNumber = searchParams.get("challanNumber") || searchParams.get("num");
  const autoPrint = searchParams.get("autoprint") === "true";

  const [challan, setChallan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let found: any = null;
    const stored = getStoredChallans();

    if (id) {
      found = stored.find(
        (c: any) =>
          String(c.id).toLowerCase() === String(id).toLowerCase() ||
          String(c.challanNumber || "").toLowerCase() === String(id).toLowerCase()
      );
    }
    if (!found && challanNumber) {
      found = stored.find(
        (c: any) =>
          String(c.challanNumber || "").toLowerCase() === String(challanNumber).toLowerCase() ||
          String(c.id).toLowerCase() === String(challanNumber).toLowerCase()
      );
    }

    if (!found && stored.length > 0) {
      found = stored[0];
    }

    if (!found) {
      const allBilties = getStoredBilties();
      found = {
        id: "chl-sample-1",
        challanNumber: challanNumber || "CHL-2026-9041",
        dispatchDate: new Date().toISOString(),
        origin: "Lahore",
        destination: "Karachi",
        truckNumber: "TLR-7721",
        driverName: "Muhammad Hanif",
        driverPhone: "0301 7788992",
        brokerName: "Haji Qasim Goods Transport Agency",
        status: "IN_TRANSIT",
        consignments: allBilties.slice(0, 4),
        truckFreight: 180000,
        advancePaidToDriver: 110000,
        driverBalancePayable: 70000,
        totalBiltyFreight: 215000,
      };
    }

    setChallan(found);
    setLoading(false);

    if (autoPrint) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [id, challanNumber, autoPrint]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
        <p className="text-xs font-semibold text-slate-500">Preparing A4 Trip Dispatch Manifest...</p>
      </div>
    );
  }

  return <PrintableChallan challan={challan} isFullPage={true} />;
}

export default function ChallanPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
          <p className="text-xs font-semibold text-slate-500">Loading Challan Manifest Print View...</p>
        </div>
      }
    >
      <ChallanPrintContent />
    </Suspense>
  );
}
