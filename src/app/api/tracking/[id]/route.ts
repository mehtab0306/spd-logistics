import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCentralCollection } from '@/lib/server-store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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

    // Query Supabase bilties table for live production consignments
    if (isSupabaseConfigured) {
      try {
        const { data: sbBilties, error: sbErr } = await supabase
          .from('bilties')
          .select('*')
          .or(`bilty_number.eq.${trackingQuery},bilty_number.eq.${cleanUpper},manual_bilty_number.eq.${trackingQuery},id.eq.${trackingQuery}`)
          .limit(1);

        const sbMatch = sbBilties && sbBilties.length > 0 ? sbBilties[0] : null;
        if (sbMatch && sbMatch.status !== 'DELETED') {
          const events = [
            {
              id: `evt-1-${sbMatch.id}`,
              status: sbMatch.status || 'Booked',
              location: sbMatch.origin_station || sbMatch.origin || 'Karachi Hub',
              timestamp: sbMatch.created_at || new Date().toISOString(),
              description: `Consignment booked and scheduled for dispatch from ${sbMatch.origin_station || sbMatch.origin || 'Origin'}.`,
            },
          ];
          if (sbMatch.status === 'In Transit' || sbMatch.status === 'IN_TRANSIT') {
            events.unshift({
              id: `evt-2-${sbMatch.id}`,
              status: 'In Transit',
              location: 'En Route',
              timestamp: sbMatch.dispatch_date || sbMatch.created_at || new Date().toISOString(),
              description: `Consignment loaded on vehicle ${sbMatch.vehicle_number || ''} en route to ${sbMatch.destination_station || sbMatch.destination || 'Destination'}.`,
            });
          } else if (sbMatch.status === 'Delivered' || sbMatch.status === 'DELIVERED') {
            events.unshift({
              id: `evt-3-${sbMatch.id}`,
              status: 'Delivered',
              location: sbMatch.destination_station || sbMatch.destination || 'Destination',
              timestamp: sbMatch.delivery_date || new Date().toISOString(),
              description: `Consignment successfully delivered to ${sbMatch.receiver_name || 'Consignee'}.`,
            });
          }

          return NextResponse.json({
            id: sbMatch.id,
            trackingId: sbMatch.bilty_number || sbMatch.id,
            biltyNumber: sbMatch.bilty_number || sbMatch.id,
            manualBiltyNumber: sbMatch.manual_bilty_number || null,
            status: sbMatch.status || 'BOOKED',
            origin: sbMatch.origin_station || sbMatch.origin || 'Karachi',
            destination: sbMatch.destination_station || sbMatch.destination || 'Lahore',
            warehouse: sbMatch.origin_station || 'Karachi Hub',
            packageDetails: sbMatch.item_description || sbMatch.cargo_details || 'General Commercial Merchandise',
            quantity: Number(sbMatch.packages_count) || 1,
            weight: Number(sbMatch.weight) || 0,
            senderName: sbMatch.sender_name || 'Shipper',
            receiverName: sbMatch.receiver_name || 'Consignee',
            receiverPhone: sbMatch.receiver_phone || '',
            vehicleNumber: sbMatch.vehicle_number || null,
            driverName: sbMatch.driver_name || null,
            deliveryDate: sbMatch.delivery_date || null,
            deliveryTime: null,
            createdAt: sbMatch.created_at,
            events,
          });
        }
      } catch (sbErr) {
        console.warn('Supabase tracking query error:', sbErr);
      }
    }

    return NextResponse.json({ message: 'Consignment not found for tracking query' }, { status: 404 });
  } catch (error) {
    console.warn('Tracking query error:', error);
    return NextResponse.json({ message: 'Tracking lookup unavailable' }, { status: 500 });
  }
}
