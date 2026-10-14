import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, getAuthCookie } from '@/lib/auth';
import { getCentralCollection, saveCentralRecord, deleteCentralRecord } from '@/lib/server-store';

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

    deleteCentralRecord('bilties', id);

    return NextResponse.json({ success: true, message: 'Bilty marked as deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
