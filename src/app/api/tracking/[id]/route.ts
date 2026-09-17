import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trackingQuery = params.id;

    if (!trackingQuery) {
      return NextResponse.json(
        { message: 'Tracking ID or Bilty Number is required' },
        { status: 400 }
      );
    }

    const consignment = await prisma.consignment.findFirst({
      where: {
        OR: [
          { trackingId: trackingQuery },
          { biltyNumber: trackingQuery },
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

    if (!consignment || consignment.shipmentStatus === 'DELETED') {
      return NextResponse.json(
        { message: 'Consignment not found' },
        { status: 404 }
      );
    }

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
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
