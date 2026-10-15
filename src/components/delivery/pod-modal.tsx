"use client";

import React, { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle2, Printer, X, Camera, Upload, ExternalLink, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PodModalProps {
  item: any;
  onClose: () => void;
  onSavePod?: (updatedItem: any) => void;
}

export function PodModal({ item, onClose, onSavePod }: PodModalProps) {
  const [receivedBy, setReceivedBy] = useState(item?.receivedBy || item?.receiverName || "");
  const [receiverCnic, setReceiverCnic] = useState(item?.receiverCnic || "");
  const [deliveryDate, setDeliveryDate] = useState(
    item?.deliveredDate
      ? item.deliveredDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [podPhoto, setPodPhoto] = useState<string>(item?.podPhoto || item?.podImage || "");
  const [podNotes, setPodNotes] = useState(item?.deliveryNotes || item?.notes || "");
  const [isSaved, setIsSaved] = useState(false);

  if (!item) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPodPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const updated = {
      ...item,
      receivedBy,
      receiverCnic,
      deliveredDate: deliveryDate,
      podPhoto,
      podImage: podPhoto,
      deliveryNotes: podNotes,
      hasPod: true,
      shipmentStatus: "DELIVERED",
    };

    if (onSavePod) {
      onSavePod(updated);
    }
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-black max-w-2xl w-full rounded-2xl shadow-2xl p-6 space-y-4 my-8 print:p-0 print:m-0 print:shadow-none print:w-full print:max-w-none">
        {/* On-screen Header */}
        <div className="flex items-center justify-between border-b pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <span className="font-bold text-sm text-slate-800 block">
                Proof of Delivery (POD) &amp; Consignee Verification
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Bilty #{item.biltyNumber}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 h-8 px-3"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print POD</span>
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

        {/* Printable POD Voucher Sheet */}
        <div id="pod-print-area" className="border-2 border-black rounded-lg p-5 space-y-4 font-sans text-xs bg-white">
          {/* Header */}
          <div className="border-b-2 border-black pb-2 text-center space-y-1">
            <h1 className="text-lg font-black uppercase text-red-600">
              SUPER PAK DATA GOODS TRANSPORT CO. (SPD LOGISTICS)
            </h1>
            <p className="text-[11px] font-black text-black uppercase tracking-wider">
              OFFICIAL PROOF OF DELIVERY (P.O.D.) RECEIPT
            </p>
            <p className="text-[10px] text-slate-600">
              Goods Handover Acknowledgement &bull; Delivery Terminal: {item.destination || "Destination Hub"}
            </p>
          </div>

          {/* Consignment Details */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-300 p-3 rounded text-xs">
            <div>
              <p><span className="text-slate-500 font-bold">Bilty Number:</span> <span className="font-mono font-black text-red-700">{item.biltyNumber || "N/A"}</span></p>
              <p><span className="text-slate-500 font-bold">Booking Date:</span> <span className="font-semibold text-black">{formatDate(item.date || item.createdAt)}</span></p>
              <p><span className="text-slate-500 font-bold">Shipper Name:</span> <span className="font-medium text-black">{item.senderName || "Shipper"}</span></p>
              <p><span className="text-slate-500 font-bold">Route:</span> <span className="font-semibold text-black">{item.origin} &rarr; {item.destination}</span></p>
            </div>
            <div>
              <p><span className="text-slate-500 font-bold">Packages Count:</span> <span className="font-bold text-black">{item.quantity || 1} Pkgs</span></p>
              <p><span className="text-slate-500 font-bold">Gross Weight:</span> <span className="font-bold text-black">{item.weight || 0} KG</span></p>
              <p><span className="text-slate-500 font-bold">Cargo Detail:</span> <span className="text-black">{item.packageDetails || "Merchandise Goods"}</span></p>
              <p><span className="text-slate-500 font-bold">Total Freight:</span> <span className="font-mono font-bold text-black">{formatCurrency(item.totalAmount || item.freight || 0)}</span></p>
            </div>
          </div>

          {/* Form Fields (Screen Input & Print Display) */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase text-slate-600">
                  Received By (Full Name) *
                </Label>
                <Input
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder=""
                  className="rounded-xl h-9 text-xs font-semibold print:border-none print:p-0 print:font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase text-slate-600">
                  Receiver CNIC / Identification #
                </Label>
                <Input
                  value={receiverCnic}
                  onChange={(e) => setReceiverCnic(e.target.value)}
                  placeholder=""
                  className="rounded-xl h-9 text-xs font-mono print:border-none print:p-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase text-slate-600">
                  Delivery / Handover Date
                </Label>
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="rounded-xl h-9 text-xs print:border-none print:p-0"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase text-slate-600">
                  Delivery Handover Notes
                </Label>
                <Input
                  value={podNotes}
                  onChange={(e) => setPodNotes(e.target.value)}
                  placeholder=""
                  className="rounded-xl h-9 text-xs print:border-none print:p-0"
                />
              </div>
            </div>

            {/* Attached Physical POD Image / Stamp Preview */}
            {podPhoto && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Scanned Physical Delivery Voucher / Signature Slip:
                </span>
                <div className="max-h-48 rounded-lg overflow-hidden border border-slate-300 bg-slate-50 flex items-center justify-center p-1">
                  <img
                    src={podPhoto}
                    alt="Proof of Delivery Slip"
                    className="max-h-44 object-contain"
                  />
                </div>
              </div>
            )}

            {/* Photo Attachment Picker (Hidden in print) */}
            <div className="print:hidden border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {podPhoto ? "POD Slip Attached" : "Attach Signed Delivery Slip / POD Stamp Photo"}
                </span>
              </div>
              <label className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1 shadow-xs">
                <Upload className="w-3 h-3 text-emerald-600" />
                <span>{podPhoto ? "Change File" : "Upload File"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Acknowledgement Text */}
          <div className="p-2 border border-black rounded bg-slate-50 text-[10px] leading-tight">
            <span className="font-black uppercase text-black">Consignee Acceptance Declaration: </span>
            I / We hereby confirm receipt of the above consignment in sound and good condition without any external damage, leakage, or shortages.
          </div>

          {/* Signatures Block */}
          <div className="grid grid-cols-3 gap-4 text-center text-xs pt-4 border-t border-black">
            <div>
              <div className="border-t border-black pt-1 font-bold uppercase text-[9px] text-black">
                Delivery Driver
              </div>
              <div className="text-[8px] text-slate-500 mt-0.5">Handed Over Goods</div>
            </div>
            <div>
              <div className="border-t border-black pt-1 font-bold uppercase text-[9px] text-black">
                Warehouse Delivery Officer
              </div>
              <div className="text-[8px] text-slate-500 mt-0.5">SPD Logistics Stamp</div>
            </div>
            <div>
              <div className="border-t border-black pt-1 font-bold uppercase text-[9px] text-black">
                Consignee Signature &amp; Stamp
              </div>
              <div className="text-[8px] text-slate-500 mt-0.5">Received in Full</div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden in print) */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t print:hidden">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Close
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Save POD Record</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
