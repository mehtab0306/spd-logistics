"use client";

import React, { useState, useRef } from "react";
import { X, Eye, UploadCloud, Image as ImageIcon, Camera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface BiltyAttachments {
  cargoPhoto?: string;
  biltyPhoto?: string;
  weightSlipPhoto?: string;
}

interface TripleImageAttachmentProps {
  attachments: BiltyAttachments;
  onChange: (updated: BiltyAttachments) => void;
  disabled?: boolean;
}

const SLOTS: (keyof BiltyAttachments)[] = ["cargoPhoto", "biltyPhoto", "weightSlipPhoto"];

export function TripleImageAttachment({
  attachments,
  onChange,
  disabled = false,
}: TripleImageAttachmentProps) {
  const [activePreview, setActivePreview] = useState<{ url: string; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract non-empty images in order
  const activeImages: { slot: keyof BiltyAttachments; url: string; label: string }[] = [];
  if (attachments.cargoPhoto) {
    activeImages.push({ slot: "cargoPhoto", url: attachments.cargoPhoto, label: "Image 1" });
  }
  if (attachments.biltyPhoto) {
    activeImages.push({ slot: "biltyPhoto", url: attachments.biltyPhoto, label: "Image 2" });
  }
  if (attachments.weightSlipPhoto) {
    activeImages.push({ slot: "weightSlipPhoto", url: attachments.weightSlipPhoto, label: "Image 3" });
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        // Find first empty slot
        const emptySlot = SLOTS.find((s) => !attachments[s]);
        if (emptySlot) {
          onChange({
            ...attachments,
            [emptySlot]: base64,
          });
        } else if (activeImages.length < 3) {
          // Fallback if re-packing
          const currentUrls = activeImages.map((i) => i.url);
          currentUrls.push(base64);
          onChange({
            cargoPhoto: currentUrls[0] || "",
            biltyPhoto: currentUrls[1] || "",
            weightSlipPhoto: currentUrls[2] || "",
          });
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemove = (slot: keyof BiltyAttachments, e: React.MouseEvent) => {
    e.stopPropagation();
    // Re-pack remaining images to maintain clean order
    const remaining = activeImages.filter((i) => i.slot !== slot).map((i) => i.url);
    onChange({
      cargoPhoto: remaining[0] || "",
      biltyPhoto: remaining[1] || "",
      weightSlipPhoto: remaining[2] || "",
    });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-spd-red" />
            <span>Attachments & Photos (Up to 3 images)</span>
          </label>
          <p className="text-[11px] text-slate-400">
            Attach cargo photos, physical bilty copies, or weight receipts ({activeImages.length}/3 attached)
          </p>
        </div>
        {activeImages.length > 0 && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            {activeImages.length} {activeImages.length === 1 ? "Image" : "Images"} Saved
          </span>
        )}
      </div>

      {/* Upload & Thumbnails Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Render Compact Thumbnails */}
        {activeImages.map((img, idx) => (
          <div
            key={img.slot}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group bg-black/5 shrink-0 shadow-xs cursor-pointer"
            onClick={() => setActivePreview({ url: img.url, title: `Attachment ${idx + 1}` })}
          >
            <img
              src={img.url}
              alt={`Attachment ${idx + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />

            {/* Quick ✕ Delete Button */}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => handleRemove(img.slot, e)}
                className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md transition-all opacity-90 group-hover:opacity-100"
                title="Remove photo"
              >
                <X className="w-3 h-3 stroke-[3]" />
              </button>
            )}

            {/* Hover View Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-white flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md">
                <Eye className="w-3 h-3" />
                <span>View</span>
              </span>
            </div>

            {/* Bottom Counter Tag */}
            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.2 rounded font-bold">
              #{idx + 1}
            </div>
          </div>
        ))}

        {/* Sleek "+ Upload Image" Button */}
        {activeImages.length < 3 && !disabled && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-spd-blue dark:hover:border-spd-blue flex flex-col items-center justify-center gap-1 transition-all bg-slate-50/70 dark:bg-slate-800/40 hover:bg-spd-blue/5 text-slate-500 hover:text-spd-blue cursor-pointer shrink-0"
          >
            <div className="p-1.5 rounded-full bg-white dark:bg-slate-700 shadow-2xs">
              <UploadCloud className="w-4 h-4 text-spd-blue" />
            </div>
            <span className="text-[11px] font-bold">+ Upload Image</span>
            <span className="text-[9px] text-slate-400 font-medium">
              ({3 - activeImages.length} remaining)
            </span>
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      {/* Lightbox Modal */}
      <Dialog open={!!activePreview} onOpenChange={(open) => !open && setActivePreview(null)}>
        <DialogContent className="max-w-3xl p-4 bg-slate-950 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-white flex items-center justify-between">
              <span>{activePreview?.title || "Document / Attachment Preview"}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="relative mt-2 max-h-[80vh] flex items-center justify-center overflow-auto rounded-lg bg-black">
            {activePreview?.url && (
              <img
                src={activePreview.url}
                alt="Document Preview"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
