import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCentralCollection } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

const DEMO_MAP: Record<string, any> = {};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trackingQuery = (params?.id || '').trim();

    if (!trackingQuery) {
      return NextResponse.json(
        { message: 'Tracking ID or Bilty Number is required' },
        { status: 400 }
      );
    }

    const cleanUpper = trackingQuery.toUpperCase();

    const consignment = await prisma.consignment.findFirst({
      where: {
        OR: [
          { trackingId: trackingQuery },
          { biltyNumber: trackingQuery },
          { trackingId: cleanUpper },
          { biltyNumber: cleanUpper },
        ],
      },
      include: {
        trackingEvents: {
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });

    if (consignment && consignment.shipmentStatus !== 'DELETED') {
      // Return sanitized public tracking info
      return NextResponse.json({
        id: consignment.id,
        trackingId: consignment.trackingId,
        biltyNumber: consignment.biltyNumber,
        status: consignment.shipmentStatus,
        origin: consignment.origin,
        destination: consignment.destination,
        warehouse: consignment.warehouse,
        packageDetails: consignment.packageDetails,
        quantity: consignment.quantity,
        weight: consignment.weight,
        senderName: consignment.senderName,
        receiverName: consignment.receiverName,
        receiverPhone: consignment.receiverPhone,
        deliveryDate: consignment.deliveryDate,
        deliveryTime: consignment.deliveryTime,
        createdAt: consignment.createdAt,
        events: consignment.trackingEvents,
      });
    }

    // Check central store collection
    const centralBilties = (getCentralCollection('bilties') || []) as any[];
    const centralMatch = centralBilties.find(
      (b) =>
        b.trackingId === trackingQuery ||
        b.biltyNumber === trackingQuery ||
        b.trackingId === cleanUpper ||
        b.biltyNumber === cleanUpper
    );
    if (centralMatch && centralMatch.shipmentStatus !== 'DELETED') {
      return NextResponse.json({
        id: centralMatch.id,
        trackingId: centralMatch.trackingId,
        biltyNumber: centralMatch.biltyNumber,
        status: centralMatch.shipmentStatus,
        origin: centralMatch.origin,
        destination: centralMatch.destination,
        warehouse: centralMatch.warehouse,
        packageDetails: centralMatch.packageDetails,
        quantity: centralMatch.quantity,
        weight: centralMatch.weight,
        senderName: centralMatch.senderName,
        receiverName: centralMatch.receiverName,
        receiverPhone: centralMatch.receiverPhone,
        deliveryDate: centralMatch.deliveryDate,
        deliveryTime: centralMatch.deliveryTime,
        createdAt: centralMatch.createdAt,
        events: centralMatch.trackingEvents || [],
      });
    }

    return NextResponse.json({ message: 'Consignment not found for tracking query' }, { status: 404 });
  } catch (error) {
    console.warn('Tracking query error:', error);
    return NextResponse.json({ message: 'Tracking lookup unavailable' }, { status: 500 });
  }
}
