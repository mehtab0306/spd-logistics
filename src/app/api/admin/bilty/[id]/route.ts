import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, getAuthCookie } from '@/lib/auth';
import { getCentralCollection, saveCentralRecord, deleteCentralRecord } from '@/lib/server-store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function resolveParams(params: Promise<{ id: string }> | { id: string }) {
  if (params && typeof (params as any).then === 'function') {
    return await params;
  }
  return params as { id: string };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: rawId } = await resolveParams(params);
    const id = decodeURIComponent(rawId || '').trim();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Bilty identifier is required' }, { status: 400 });
    }

    let single: any = null;

    // 1. Prisma database lookup
    try {
      single = await prisma.consignment.findUnique({
        where: { id },
        include: {
          customer: true,
          sender: true,
          receiver: true,
          driver: true,
          vehicle: true,
          challan: true,
          trackingEvents: { orderBy: { timestamp: 'desc' } },
          payments: { orderBy: { date: 'desc' } },
        },
      });

      if (!single) {
        single = await prisma.consignment.findUnique({
          where: { biltyNumber: id },
          include: {
            customer: true,
            sender: true,
            receiver: true,
            driver: true,
            vehicle: true,
            challan: true,
            trackingEvents: { orderBy: { timestamp: 'desc' } },
            payments: { orderBy: { date: 'desc' } },
          },
        });
      }

      if (!single) {
        single = await prisma.consignment.findFirst({
          where: {
            OR: [
              { id },
              { biltyNumber: { equals: id } },
              { biltyNumber: { equals: id.toUpperCase() } },
              { trackingId: { equals: id } },
              { trackingId: { equals: id.toUpperCase() } },
            ],
          },
          include: {
            customer: true,
            sender: true,
            receiver: true,
            driver: true,
            vehicle: true,
            challan: true,
            trackingEvents: { orderBy: { timestamp: 'desc' } },
            payments: { orderBy: { date: 'desc' } },
          },
        });
      }
    } catch (dbErr) {
      console.warn('[API /admin/bilty/[id]] DB lookup warning:', dbErr);
    }

    // 2. Central serverless collection lookup
    if (!single) {
      const central = getCentralCollection('bilties');
      single = central.find(
        (b: any) =>
          String(b.id) === String(id) ||
          String(b.biltyNumber || '').toUpperCase() === String(id).toUpperCase() ||
          String(b.trackingId || '').toUpperCase() === String(id).toUpperCase()
      );
    }

    // 3. Supabase cloud database lookup
    if (!single && isSupabaseConfigured) {
      try {
        const { data: sbRow } = await supabase
          .from('bilties')
          .select('*')
          .or(`bilty_number.eq.${id},id.eq.${id}`)
          .maybeSingle();

        if (sbRow) {
          single = {
            id: sbRow.id || sbRow.bilty_number,
            biltyNumber: sbRow.bilty_number || sbRow.id,
            trackingId: sbRow.bilty_number || sbRow.id,
            bookingDate: sbRow.booking_date || sbRow.created_at || new Date().toISOString(),
            date: sbRow.booking_date || sbRow.created_at || new Date().toISOString(),
            senderName: sbRow.sender_name || 'Walk-in Shipper',
            senderPhone: sbRow.sender_phone || '',
            receiverName: sbRow.receiver_name || 'Consignee',
            receiverPhone: sbRow.receiver_phone || '',
            origin: sbRow.origin_station || sbRow.origin || 'Lahore',
            destination: sbRow.destination_station || sbRow.destination || 'Karachi',
            freightAmount: Number(sbRow.freight_amount ?? sbRow.total_freight ?? 0),
            freight: Number(sbRow.freight_amount ?? sbRow.total_freight ?? 0),
            totalFreight: Number(sbRow.freight_amount ?? sbRow.total_freight ?? 0),
            totalAmount: Number(sbRow.freight_amount ?? sbRow.total_freight ?? 0),
            paidAmount: Number(sbRow.advance_paid ?? 0),
            remainingBalance: Number(sbRow.remaining_balance ?? 0),
            paymentMode: sbRow.payment_mode || 'TO-PAY',
            status: sbRow.status || 'Booked',
            shipmentStatus: (sbRow.status || 'BOOKED').toUpperCase(),
            itemDescription: sbRow.item_description || 'General Cargo',
            packageDetails: sbRow.item_description || 'General Cargo',
            packagesCount: Number(sbRow.packages_count) || 1,
            quantity: Number(sbRow.packages_count) || 1,
            weight: Number(sbRow.weight) || 0,
            ...sbRow,
          };
        }
      } catch (sbErr) {
        console.warn('Supabase lookup in /api/admin/bilty/[id] notice:', sbErr);
      }
    }

    if (single) {
      return NextResponse.json({ success: true, data: single });
    }

    return NextResponse.json({ success: false, error: `Bilty record #${id} not found` }, { status: 404 });
  } catch (error: any) {
    console.error('[API /admin/bilty/[id]] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: rawId } = await resolveParams(params);
    const id = decodeURIComponent(rawId || '').trim();
    const body = await request.json();

    let updated: any = null;
    try {
      updated = await prisma.consignment.update({
        where: { id },
        data: {
          biltyNumber: body.biltyNumber,
          shipmentStatus: body.shipmentStatus,
          notes: body.notes,
        },
      });
    } catch {
      // Fallback update in central store
    }

    if (isSupabaseConfigured) {
      try {
        const updatePayload: Record<string, any> = {};
        if (body.senderName) updatePayload.sender_name = body.senderName;
        if (body.receiverName) updatePayload.receiver_name = body.receiverName;
        if (body.origin) updatePayload.origin_station = body.origin;
        if (body.destination) updatePayload.destination_station = body.destination;
        if (body.totalAmount !== undefined || body.totalFreight !== undefined) {
          updatePayload.freight_amount = Number(body.totalAmount || body.totalFreight) || 0;
        }
        if (body.paidAmount !== undefined) updatePayload.advance_paid = Number(body.paidAmount) || 0;
        if (body.remainingBalance !== undefined) updatePayload.remaining_balance = Number(body.remainingBalance) || 0;
        if (body.shipmentStatus || body.status) updatePayload.status = body.shipmentStatus || body.status;
        if (body.paymentMode) updatePayload.payment_mode = body.paymentMode;

        if (Object.keys(updatePayload).length > 0) {
          await supabase.from('bilties').update(updatePayload).or(`bilty_number.eq.${id},id.eq.${id}`);
        }
      } catch (sbErr) {
        console.warn('Supabase update in /api/admin/bilty/[id] notice:', sbErr);
      }
    }

    const merged = { ...body, id, updatedAt: new Date().toISOString() };
    saveCentralRecord('bilties', merged);

    return NextResponse.json({ success: true, data: updated || merged });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: rawId } = await resolveParams(params);
    const id = decodeURIComponent(rawId || '').trim();

    try {
      await prisma.consignment.update({
        where: { id },
        data: { shipmentStatus: 'DELETED' },
      });
    } catch {}

    if (isSupabaseConfigured) {
      try {
        await supabase.from('bilties').delete().or(`bilty_number.eq.${id},id.eq.${id}`);
      } catch (sbErr) {
        console.warn('Supabase delete in /api/admin/bilty/[id] notice:', sbErr);
      }
    }

    deleteCentralRecord('bilties', id);

    return NextResponse.json({ success: true, message: 'Bilty marked as deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
