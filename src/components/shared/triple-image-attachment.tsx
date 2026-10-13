"use client";

import React, { useState, useRef } from "react";
import { Camera, X, Eye, UploadCloud, Image as ImageIcon, Scale, FileText, Package } from "lucide-react";
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

export function TripleImageAttachment({
  attachments,
  onChange,
  disabled = false,
}: TripleImageAttachmentProps) {
  const [activePreview, setActivePreview] = useState<{ url: string; title: string } | null>(null);

  const cargoInputRef = useRef<HTMLInputElement>(null);
  const biltyInputRef = useRef<HTMLInputElement>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: keyof BiltyAttachments
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    // Convert file to Base64 data URL for client persistence
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        onChange({
          ...attachments,
          [slot]: base64,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemove = (slot: keyof BiltyAttachments, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({
      ...attachments,
      [slot]: "",
    });
  };

  const slots = [
    {
      key: "cargoPhoto" as keyof BiltyAttachments,
      title: "Goods / Cargo Photo",
      description: "Photo of cargo items, cartons or loaded goods",
      icon: Package,
      ref: cargoInputRef,
      image: attachments.cargoPhoto,
    },
    {
      key: "biltyPhoto" as keyof BiltyAttachments,
      title: "Physical Bilty Copy",
      description: "Paper consignment / physical bilty stamp copy",
      icon: FileText,
      ref: biltyInputRef,
      image: attachments.biltyPhoto,
    },
    {
      key: "weightSlipPhoto" as keyof BiltyAttachments,
      title: "Weight Slip / Loading Proof",
      description: "Weighbridge scale ticket or loading slip proof",
      icon: Scale,
      ref: weightInputRef,
      image: attachments.weightSlipPhoto,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {slots.map((slot) => {
          const IconComponent = slot.icon;
          const hasImage = Boolean(slot.image);

          return (
            <div
              key={slot.key}
              className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 bg-slate-50/70 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 rounded-lg bg-spd-red/10 text-spd-red">
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {slot.title}
                  </span>
                </div>
                {hasImage && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Attached
                  </span>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground mb-3 leading-tight line-clamp-1">
                {slot.description}
              </p>

              {/* Upload or Preview Box */}
              <div className="mt-auto">
                {hasImage ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 aspect-[4/3] flex items-center justify-center">
                    <img
                      src={slot.image}
                      alt={slot.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Hover Actions Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setActivePreview({ url: slot.image!, title: slot.title })
                        }
                        className="h-8 px-2.5 rounded-lg text-xs font-bold bg-white/90 hover:bg-white text-slate-900 shadow-md gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Button>
                      {!disabled && (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={(e) => handleRemove(slot.key, e)}
                          className="h-8 px-2.5 rounded-lg text-xs font-bold shadow-md gap-1"
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
                    onClick={() => slot.ref.current?.click()}
                    className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-spd-red dark:hover:border-spd-red rounded-xl aspect-[4/3] flex flex-col items-center justify-center p-3 text-center transition-all bg-white dark:bg-slate-800/60 hover:bg-spd-red/5 group cursor-pointer"
                  >
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 group-hover:text-spd-red group-hover:bg-spd-red/10 transition-colors mb-2">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-spd-red transition-colors">
                      Upload Image
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      JPG, PNG, WebP
                    </span>
                  </button>
                )}

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={slot.ref}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, slot.key)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-size Image Lightbox Modal */}
      <Dialog
        open={Boolean(activePreview)}
        onOpenChange={(open) => !open && setActivePreview(null)}
      >
        <DialogContent className="max-w-3xl p-4 bg-slate-950 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center justify-between text-white">
              <span>{activePreview?.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="relative mt-2 max-h-[80vh] flex items-center justify-center overflow-auto rounded-lg bg-black">
            {activePreview?.url && (
              <img
                src={activePreview.url}
                alt={activePreview.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
