"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Package, Calendar, MapPin, Loader2, MessageSquare } from 'lucide-react';
import { formatDateTime, formatDate, cn } from '@/lib/utils';
import { SHIPMENT_STATUS_LABELS } from '@/lib/constants';
import { buildWhatsAppUrl, getBiltyTrackingWhatsAppMessage } from '@/lib/whatsapp';

function TrackingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [query, setQuery] = useState(searchParams.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    
    // Update URL without reload
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('id', query);
    router.push(`/tracking?${newParams.toString()}`);

    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(query)}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('No shipment found with this tracking ID or Bilty Number.');
        }
        throw new Error('An error occurred while tracking the shipment.');
      }
      
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to track shipment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      handleSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container max-w-4xl px-4 py-12 md:py-20 mx-auto">
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter">Track Your Shipment</h1>
        <p className="text-muted-foreground text-lg">Enter your tracking ID or bilty number below</p>
      </div>

      <Card className="shadow-md border-border mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tracking ID or Bilty Number"
                className="pl-10 h-12 text-lg"
                required
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90 text-white" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              Track
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-center border border-red-200 dark:border-red-800">
          <p className="font-medium text-lg">{error}</p>
          <p className="text-sm mt-1 opacity-80">Please verify the number and try again.</p>
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Main Shipment Details Card */}
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/60 border-b border-border p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Consignment
                    </span>
                    {result.biltyNumber && (
                      <span className="text-xs font-mono font-bold text-slate-500">
                        Bilty #{result.biltyNumber}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-2xl font-black flex items-center gap-2">
                    <Package className="w-6 h-6 text-spd-blue" />
                    Tracking: <span className="font-mono text-spd-blue">{result.trackingId}</span>
                  </CardTitle>
                  <CardDescription className="text-sm mt-1 text-slate-500">
                    Route: <strong className="text-foreground">{result.origin}</strong> &rarr; <strong className="text-foreground">{result.destination}</strong>
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={cn("text-xs font-bold px-3.5 py-1.5 rounded-xl uppercase tracking-wider", 
                    result.status === 'DELIVERED' ? "bg-emerald-600 hover:bg-emerald-700 text-white" :
                    result.status === 'CANCELLED' ? "bg-red-600 hover:bg-red-700 text-white" :
                    result.status === 'ON_HOLD' ? "bg-amber-600 hover:bg-amber-700 text-white" :
                    "bg-spd-blue hover:bg-spd-blueHover text-white"
                  )}>
                    {SHIPMENT_STATUS_LABELS[result.status as keyof typeof SHIPMENT_STATUS_LABELS] || result.status?.replace(/_/g, " ")}
                  </Badge>

                  {/* WhatsApp Share Button */}
                  <a
                    href={buildWhatsAppUrl(
                      null,
                      getBiltyTrackingWhatsAppMessage({
                        biltyNumber: result.biltyNumber,
                        trackingId: result.trackingId,
                        status: result.status,
                        origin: result.origin,
                        destination: result.destination,
                      })
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Share on WhatsApp</span>
                  </a>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* 6-Stage Visual Shipment Progress Timeline */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Shipment Progress Timeline
                </h3>

                {(() => {
                  const stages = [
                    { key: "BOOKED", label: "Booked" },
                    { key: "PICKED_UP", label: "Picked Up" },
                    { key: "IN_TRANSIT", label: "In Transit" },
                    { key: "ARRIVED_AT_DESTINATION", label: "Arrived at Destination" },
                    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
                    { key: "DELIVERED", label: "Delivered" },
                  ];

                  const statusOrder: Record<string, number> = {
                    BOOKED: 0,
                    PICKED_UP: 1,
                    IN_TRANSIT: 2,
                    ARRIVED_AT_DESTINATION: 3,
                    OUT_FOR_DELIVERY: 4,
                    DELIVERED: 5,
                  };

                  const currentIndex = statusOrder[result.status] !== undefined ? statusOrder[result.status] : 1;
                  const isDelivered = result.status === "DELIVERED";

                  return (
                    <div className="w-full">
                      {/* Desktop Timeline */}
                      <div className="hidden md:grid grid-cols-6 gap-2 relative">
                        <div className="absolute top-4 left-6 right-6 h-1 bg-slate-200 dark:bg-slate-800 -z-0" />
                        <div
                          className="absolute top-4 left-6 h-1 bg-emerald-500 transition-all duration-500 -z-0"
                          style={{
                            width: `${Math.min(100, (currentIndex / (stages.length - 1)) * 100)}%`,
                          }}
                        />

                        {stages.map((stage, idx) => {
                          const isDone = idx <= currentIndex;
                          const isCurrent = idx === currentIndex;

                          return (
                            <div key={stage.key} className="flex flex-col items-center text-center z-10 space-y-2">
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors border-2",
                                  isDone
                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                                    : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400",
                                  isCurrent && !isDelivered && "ring-4 ring-emerald-500/20"
                                )}
                              >
                                {isDone ? "✓" : idx + 1}
                              </div>
                              <span
                                className={cn(
                                  "text-xs font-bold leading-tight",
                                  isDone ? "text-slate-900 dark:text-white" : "text-slate-400"
                                )}
                              >
                                {stage.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mobile Timeline */}
                      <div className="md:hidden space-y-2">
                        {stages.map((stage, idx) => {
                          const isDone = idx <= currentIndex;
                          const isCurrent = idx === currentIndex;

                          return (
                            <div key={stage.key} className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                                  isDone
                                    ? "bg-emerald-500 text-white"
                                    : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                                )}
                              >
                                {isDone ? "✓" : idx + 1}
                              </div>
                              <span
                                className={cn(
                                  "text-xs font-semibold",
                                  isDone ? "text-slate-900 dark:text-white" : "text-slate-400"
                                )}
                              >
                                {stage.label}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-spd-blue">
                                  Current
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Shipment Details Grid */}
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Origin Terminal</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{result.origin}</p>
                  {result.senderName && <p className="text-slate-500 text-[11px]">From: {result.senderName}</p>}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Destination Drop</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{result.destination}</p>
                  {result.receiverName && <p className="text-slate-500 text-[11px]">To: {result.receiverName}</p>}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Cargo Information</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{result.packageDetails || "Cargo Consignment"}</p>
                  <p className="text-slate-500 text-[11px]">{result.quantity ? `${result.quantity} items` : ""} {result.weight ? `• ${result.weight} KG` : ""}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Booking / Delivery</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{formatDate(result.createdAt)}</p>
                  {result.deliveryDate && (
                    <p className="text-emerald-600 font-semibold text-[11px]">
                      Delivered: {formatDate(result.deliveryDate)} ({result.deliveryTime || "Done"})
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chronological Tracking History Card */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-spd-blue" />
                Transit Checkpoint Events
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {result.events && result.events.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6 my-2">
                  {result.events.map((event: any, index: number) => (
                    <div key={event.id || index} className="relative">
                      <div className={cn(
                        "absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900",
                        index === 0 ? "bg-spd-blue ring-2 ring-blue-500/20" : "bg-slate-400"
                      )} />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-bold text-xs text-slate-900 dark:text-white">
                            {SHIPMENT_STATUS_LABELS[event.status as keyof typeof SHIPMENT_STATUS_LABELS] || event.status?.replace(/_/g, " ")}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {formatDateTime(event.timestamp || event.createdAt)}
                          </p>
                        </div>
                        {event.location && (
                          <p className="text-emerald-600 font-semibold flex items-center gap-1 text-xs">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.location}
                          </p>
                        )}
                        {event.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300">{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-xs">No tracking events recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!result && !error && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">Enter your tracking details above to see the current status of your shipment.</p>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-black">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <TrackingContent />
      </Suspense>
    </div>
  );
}
