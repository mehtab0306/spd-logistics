"use client";

import React from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Printer, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintableGatePassProps {
  item: any;
  onClose: () => void;
}

export function PrintableGatePass({ item, onClose }: PrintableGatePassProps) {
  if (!item) return null;

  const gatePassNo = `GP-${item.biltyNumber || item.challanNumber || Date.now().toString().slice(-6)}`;
  const currentDate = new Date().toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const currentTime = new Date().toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-black max-w-3xl w-full rounded-2xl shadow-2xl p-6 sm:p-8 space-y-4 my-8 print:p-0 print:m-0 print:shadow-none print:w-full print:max-w-none">
        {/* On-screen Controls (Hidden in print) */}
        <div className="flex items-center justify-between border-b pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-sm text-slate-800">
              Delivery Gate Pass & Cargo Release Voucher
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 h-8 px-4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Gate Pass</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs h-8"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Printable Gate Pass Voucher */}
        <div id="gate-pass-print-area" className="border-2 border-black rounded-lg p-5 space-y-4 font-sans text-xs bg-white">
          {/* Header */}
          <div className="border-b-2 border-black pb-3 text-center space-y-1">
            <h1 className="text-xl font-black uppercase text-red-600 tracking-tight">
              SUPER PAK DATA GOODS TRANSPORT CO. (SPD LOGISTICS)
            </h1>
            <p className="text-[11px] font-bold text-black uppercase tracking-wider">
              DELIVERY GATE PASS &amp; OUTWARD CARGO RELEASE
            </p>
            <p className="text-[10px] text-slate-600">
              Nationwide Terminal Logistics &bull; Hawksbay Karachi &bull; Bhati Gate Lahore &bull; Ph: 042-111-773-773
            </p>
          </div>

          {/* Gate Pass Meta Row */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-300 p-2.5 rounded text-[11px]">
            <div>
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Gate Pass #</span>
              <span className="font-mono font-black text-black">{gatePassNo}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Release Date &amp; Time</span>
              <span className="font-bold text-black">{currentDate} • {currentTime}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Terminal Station</span>
              <span className="font-bold text-black">{item.destination || item.warehouse || "Destination Terminal"}</span>
            </div>
          </div>

          {/* Consignment & Vehicle Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="border border-black p-2.5 rounded space-y-1 bg-white">
              <span className="font-black uppercase text-[10px] text-red-700 block border-b border-slate-200 pb-0.5">
                Consignment Particulars
              </span>
              <p><span className="text-slate-500 font-bold">Bilty Number:</span> <span className="font-mono font-bold text-black">{item.biltyNumber || "N/A"}</span></p>
              <p><span className="text-slate-500 font-bold">Origin &rarr; Destination:</span> <span className="font-semibold text-black">{item.origin || "Origin"} &rarr; {item.destination || "Destination"}</span></p>
              <p><span className="text-slate-500 font-bold">Shipper:</span> <span className="text-black font-medium">{item.senderName || "Valued Shipper"}</span></p>
              <p><span className="text-slate-500 font-bold">Package Count:</span> <span className="font-bold text-black">{item.quantity || 1} Pkgs</span> ({item.packageDetails || "Commercial Merchandise"})</p>
              <p><span className="text-slate-500 font-bold">Gross Weight:</span> <span className="font-bold text-black">{item.weight || 0} KG</span></p>
            </div>

            <div className="border border-black p-2.5 rounded space-y-1 bg-white">
              <span className="font-black uppercase text-[10px] text-blue-900 block border-b border-slate-200 pb-0.5">
                Consignee &amp; Delivery Destination
              </span>
              <p><span className="text-slate-500 font-bold">Receiver / Consignee:</span> <span className="font-bold text-black">{item.receiverName || "Consignee Handover"}</span></p>
              <p><span className="text-slate-500 font-bold">Contact Phone:</span> <span className="font-mono text-black font-semibold">{item.receiverPhone || "N/A"}</span></p>
              <p><span className="text-slate-500 font-bold">Delivery Address:</span> <span className="text-black">{item.deliveryAddress || item.receiverAddress || "Local Warehouse Pick-up"}</span></p>
              <p><span className="text-slate-500 font-bold">Vehicle / Delivery Loader:</span> <span className="font-mono font-bold text-black">{item.truckNumber || item.vehicleNumber || "Local Delivery Rickshaw / Suzuki"}</span></p>
              <p><span className="text-slate-500 font-bold">Delivery Driver:</span> <span className="text-black">{item.driverName || "Station Delivery Staff"}</span></p>
            </div>
          </div>

          {/* Freight Clearance Verification */}
          <div className="border border-black p-2.5 rounded bg-slate-50 flex items-center justify-between text-xs">
            <div>
              <span className="font-black uppercase text-[10px] text-slate-700 block">Freight Accounting Status:</span>
              <span className="font-bold text-black">
                Total Freight: {formatCurrency(item.totalAmount || item.freight || 0)} &bull; Balance Due:{" "}
                <span className={(item.remainingBalance || 0) <= 0 ? "text-emerald-700" : "text-red-700"}>
                  {(item.remainingBalance || 0) <= 0 ? "CLEARED & PAID IN FULL" : formatCurrency(item.remainingBalance)}
                </span>
              </span>
            </div>
            <div className="border-2 border-emerald-700 text-emerald-800 px-3 py-1 rounded font-black text-xs uppercase tracking-wider bg-emerald-50">
              OUTWARD RELEASE APPROVED
            </div>
          </div>

          {/* Legal Instruction */}
          <p className="text-[9px] text-slate-600 leading-tight italic border-t border-slate-300 pt-2">
            Notice: This gate pass authorizes the removal of above-specified cargo from the terminal premises. Security guards must inspect physical packages against the quantity specified before lifting barriers.
          </p>

          {/* 4-Signature Blocks */}
          <div className="grid grid-cols-4 gap-4 text-center text-xs pt-4 border-t border-black">
            <div>
              <div className="border-t border-black pt-1 font-bold uppercase text-[9px] text-black">
                Warehouse In-Charge
              </div>
              <div className="text-[8px] text-slate-500 mt-0.5">Checked &amp; Released</div>
            </div>
            <div>
              <div className="border-t border-black pt-1 font-bold uppercase text-[9px] text-black">
                Delivery Driver / Loader
              </div>
              <div className="text-[8px] text-slate-500 mt-0.5">Received Cargo</div>
            </div>
            <div>
              <div className="border-t border-black pt-1 font-bold uppercase text-[9px] text-black">
                Terminal Security
              </div>
              <div className="text-[8px] text-slate-500 mt-0.5">Gate Barrier Stamp</div>
            </div>
            <div>
              <div className="border-t border-black pt-1 font-bold uppercase text-[9px] text-black">
                Consignee Signature
              </div>
              <div className="text-[8px] text-slate-500 mt-0.5">Final Handover Ack</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
