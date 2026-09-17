import React from "react";
import prisma from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Package, Search } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TrackingPage() {
  const consignments = await prisma.consignment.findMany({
    where: { shipmentStatus: { not: "DELETED" } },
    take: 5,
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Shipment Tracking" 
        description="Track bilty and consignment statuses in real-time." 
      />
      
      <div className="max-w-2xl mx-auto py-8">
        <Link href="/tracking" className="flex items-center gap-2 px-4 py-3 border rounded-lg bg-card text-muted-foreground hover:bg-accent transition-colors">
          <Search className="h-4 w-4" />
          <span>Search by Tracking ID or Bilty Number...</span>
        </Link>
      </div>

      {consignments.length === 0 ? (
        <EmptyState 
          icon={Package} 
          title="No active shipments" 
          description="Recent tracked shipments will appear here" 
        />
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Recent Shipments</h3>
          <div className="grid gap-4">
            {consignments.map((c) => (
              <div key={c.id} className="p-4 border rounded-lg bg-card">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{c.trackingId}</h4>
                    <p className="text-sm text-muted-foreground">{c.origin} to {c.destination}</p>
                  </div>
                  <div>
                    <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                      {c.shipmentStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
