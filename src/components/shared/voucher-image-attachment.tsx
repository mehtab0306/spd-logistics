"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, X, Eye, FileText, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface VoucherImageAttachmentProps {
  image?: string;
  value?: string;
  onChange: (base64Url: string) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function VoucherImageAttachment({
  image,
  value,
  onChange,
  label = "Attach Receipt / Voucher Image",
  description = "Slip, bank receipt, fuel voucher or cheque proof",
  disabled = false,
}: VoucherImageAttachmentProps) {
  const currentImage = value || image || "";
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-spd-blue" />
          <span>{label}</span>
        </label>
        {currentImage && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            Receipt Attached
          </span>
        )}
      </div>

      {currentImage ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 h-28 flex items-center justify-center">
          <img
            src={currentImage}
            alt="Payment Receipt Voucher"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setLightboxOpen(true)}
              className="h-7 px-2.5 rounded-lg text-xs font-bold bg-white text-slate-900 gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Proof</span>
            </Button>
            {!disabled && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleRemove}
                className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-spd-blue dark:hover:border-spd-blue rounded-xl p-3 flex items-center justify-center gap-3 transition-all bg-white dark:bg-slate-800/60 hover:bg-spd-blue/5 cursor-pointer text-left"
        >
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 shrink-0">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Upload Payment Slip / Voucher
            </span>
            <span className="text-[10px] text-muted-foreground block truncate">
              {description}
            </span>
          </div>
        </button>
      )}

      <input
        type="file"
        ref={inputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {/* Lightbox Preview */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-2xl p-4 bg-slate-950 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-white">
              Voucher / Payment Proof Preview
            </DialogTitle>
          </DialogHeader>
          <div className="relative mt-2 max-h-[75vh] flex items-center justify-center overflow-auto rounded-lg bg-black">
            {currentImage && (
              <img
                src={currentImage}
                alt="Receipt Voucher"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
