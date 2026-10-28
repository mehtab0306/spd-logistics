"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getStoredBilties } from "@/lib/local-persistence";
import { BiltySheetViewer, BiltySheetTab } from "@/components/bilty/bilty-sheet-viewer";
import { LogisticsLoader } from "@/components/shared/logistics-loader";

function BiltyPrintContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const biltyNumber = searchParams.get("biltyNumber") || searchParams.get("num");
  const autoPrint = searchParams.get("autoprint") === "true";
  const requestedSheet = (searchParams.get("sheet") as BiltySheetTab) || "consignment";

  const [bilty, setBilty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let found: any = null;
    const stored = getStoredBilties();

    if (id) {
      found = stored.find((b: any) => String(b.id) === String(id));
    }
    if (!found && biltyNumber) {
      found = stored.find(
        (b: any) => String(b.biltyNumber).toLowerCase() === String(biltyNumber).toLowerCase()
      );
    }

    if (!found && stored.length > 0) {
      found = stored[0];
    }

    if (!found) {
      // Sample fallback bilty
      found = {
        id: "bilty-sample",
        biltyNumber: "SPD-78642",
        trackingId: "TRK-992144",
        date: new Date().toISOString(),
        origin: "Lahore",
        destination: "Karachi",
        warehouse: "LAHORE",
        senderName: "Al-Rahman Textiles (Pvt) Ltd",
        senderPhone: "0300 8472910",
        senderAddress: "Kot Lakhpat Industrial Area, Lahore",
        receiverName: "Karachi Silk Emporium",
        receiverPhone: "0321 9928371",
        receiverAddress: "Cloth Market, M.A. Jinnah Road, Karachi",
        packageDetails: "Textile Cotton Yarn Cones (Grade A)",
        quantity: 45,
        weight: 1250,
        vehicleNumber: "LES-9481",
        driverName: "Muhammad Aslam",
        freight: 85000,
        additionalCharges: 3500,
        discount: 0,
        totalAmount: 88500,
        paidAmount: 88500,
        remainingBalance: 0,
        paymentStatus: "PAID",
      };
    }

    setBilty(found);
    setLoading(false);

    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [id, biltyNumber, autoPrint]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <LogisticsLoader subtitle="Preparing A4 Consignment Bilty Voucher..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 print:p-0 print:max-w-none print:w-full">
      <BiltySheetViewer bilty={bilty} initialTab={requestedSheet} showBackLink={true} />
    </div>
  );
}

export default function BiltyPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
          <LogisticsLoader subtitle="Loading Bilty Print View..." />
        </div>
      }
    >
      <BiltyPrintContent />
    </Suspense>
  );
}
