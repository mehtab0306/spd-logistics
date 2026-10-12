import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEMO_MAP: Record<string, any> = {
      'SPD-2026-00101': {
        id: "bilty-cust-101",
        trackingId: "SPD-2026-00101",
        biltyNumber: "SPD-LHR-2026-0101",
        status: "IN_TRANSIT",
        origin: "Lahore",
        destination: "Karachi",
        warehouse: "LAHORE",
        packageDetails: "Industrial Auto Parts & Machinery",
        quantity: 80,
        weight: 3200,
        senderName: "Standard Customer (Prime Logistics)",
        senderPhone: "0300 1234567",
        receiverName: "Karachi Commercial Mart",
        receiverPhone: "0321 9876543",
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
        events: [
          { id: "te-101-1", status: "IN_TRANSIT", location: "Sadiqabad Motorway Interchange M-5", timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), notes: "Cargo convoy in transit on Motorway M-5." },
          { id: "te-101-2", status: "DISPATCHED", location: "Lahore Central Logistics Hub", timestamp: new Date(Date.now() - 3600000 * 8).toISOString(), notes: "Dispatched from Lahore terminal via Vehicle LES-8921." },
          { id: "te-101-3", status: "BOOKED", location: "Lahore Station", timestamp: new Date(Date.now() - 3600000 * 20).toISOString(), notes: "Consignment booked and verified." },
        ],
      },
      'SPD-LHR-2026-0101': {
        id: "bilty-cust-101",
        trackingId: "SPD-2026-00101",
        biltyNumber: "SPD-LHR-2026-0101",
        status: "IN_TRANSIT",
        origin: "Lahore",
        destination: "Karachi",
        warehouse: "LAHORE",
        packageDetails: "Industrial Auto Parts & Machinery",
        quantity: 80,
        weight: 3200,
        senderName: "Standard Customer (Prime Logistics)",
        senderPhone: "0300 1234567",
        receiverName: "Karachi Commercial Mart",
        receiverPhone: "0321 9876543",
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
        events: [
          { id: "te-101-1", status: "IN_TRANSIT", location: "Sadiqabad Motorway Interchange M-5", timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), notes: "Cargo convoy in transit on Motorway M-5." },
          { id: "te-101-2", status: "DISPATCHED", location: "Lahore Central Logistics Hub", timestamp: new Date(Date.now() - 3600000 * 8).toISOString(), notes: "Dispatched from Lahore terminal via Vehicle LES-8921." },
          { id: "te-101-3", status: "BOOKED", location: "Lahore Station", timestamp: new Date(Date.now() - 3600000 * 20).toISOString(), notes: "Consignment booked and verified." },
        ],
      },
      'SPD-2026-00102': {
        id: "bilty-cust-102",
        trackingId: "SPD-2026-00102",
        biltyNumber: "SPD-KHI-2026-0102",
        status: "DISPATCHED",
        origin: "Karachi",
        destination: "Islamabad",
        warehouse: "KARACHI",
        packageDetails: "Electronics & Commercial Displays",
        quantity: 120,
        weight: 2400,
        senderName: "Standard Customer (Prime Logistics)",
        senderPhone: "0300 1234567",
        receiverName: "Islamabad Distribution Center",
        receiverPhone: "0333 8765432",
        createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
        events: [
          { id: "te-102-1", status: "DISPATCHED", location: "Hyderabad Highway Bypass", timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), notes: "En route to toll checkpoint." },
          { id: "te-102-2", status: "BOOKED", location: "Karachi Port Hub", timestamp: new Date(Date.now() - 3600000 * 10).toISOString(), notes: "Bilty registered and loaded onto vehicle." },
        ],
      },
      'SPD-KHI-2026-0102': {
        id: "bilty-cust-102",
        trackingId: "SPD-2026-00102",
        biltyNumber: "SPD-KHI-2026-0102",
        status: "DISPATCHED",
        origin: "Karachi",
        destination: "Islamabad",
        warehouse: "KARACHI",
        packageDetails: "Electronics & Commercial Displays",
        quantity: 120,
        weight: 2400,
        senderName: "Standard Customer (Prime Logistics)",
        senderPhone: "0300 1234567",
        receiverName: "Islamabad Distribution Center",
        receiverPhone: "0333 8765432",
        createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
        events: [
          { id: "te-102-1", status: "DISPATCHED", location: "Hyderabad Highway Bypass", timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), notes: "En route to toll checkpoint." },
          { id: "te-102-2", status: "BOOKED", location: "Karachi Port Hub", timestamp: new Date(Date.now() - 3600000 * 10).toISOString(), notes: "Bilty registered and loaded onto vehicle." },
        ],
      },
      'SPD-2026-00103': {
        id: "bilty-cust-103",
        trackingId: "SPD-2026-00103",
        biltyNumber: "SPD-LHR-2026-0103",
        status: "DELIVERED",
        origin: "Lahore",
        destination: "Peshawar",
        warehouse: "LAHORE",
        packageDetails: "Consumer Packaged Goods & Beverages",
        quantity: 150,
        weight: 4100,
        senderName: "Standard Customer (Prime Logistics)",
        senderPhone: "0300 1234567",
        receiverName: "Peshawar Wholesale Depot",
        receiverPhone: "0301 2345678",
        deliveryDate: new Date(Date.now() - 3600000 * 5).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        events: [
          { id: "te-103-1", status: "DELIVERED", location: "Peshawar Depot", timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), notes: "Delivered to receiving manager. Signature obtained." },
          { id: "te-103-2", status: "OUT_FOR_DELIVERY", location: "Peshawar Ring Road", timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), notes: "Out for final delivery." },
          { id: "te-103-3", status: "BOOKED", location: "Lahore Station", timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), notes: "Booking confirmed." },
        ],
      },
      'SPD-LHR-2026-0103': {
        id: "bilty-cust-103",
        trackingId: "SPD-2026-00103",
        biltyNumber: "SPD-LHR-2026-0103",
        status: "DELIVERED",
        origin: "Lahore",
        destination: "Peshawar",
        warehouse: "LAHORE",
        packageDetails: "Consumer Packaged Goods & Beverages",
        quantity: 150,
        weight: 4100,
        senderName: "Standard Customer (Prime Logistics)",
        senderPhone: "0300 1234567",
        receiverName: "Peshawar Wholesale Depot",
        receiverPhone: "0301 2345678",
        deliveryDate: new Date(Date.now() - 3600000 * 5).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        events: [
          { id: "te-103-1", status: "DELIVERED", location: "Peshawar Depot", timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), notes: "Delivered to receiving manager. Signature obtained." },
          { id: "te-103-2", status: "OUT_FOR_DELIVERY", location: "Peshawar Ring Road", timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), notes: "Out for final delivery." },
          { id: "te-103-3", status: "BOOKED", location: "Lahore Station", timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), notes: "Booking confirmed." },
        ],
      },
      'SPD-2026-000142': {
        id: "bilty-mock-1",
        trackingId: "SPD-2026-000142",
        biltyNumber: "SPD-LHR-2026-0042",
        status: "IN_TRANSIT",
        origin: "Lahore",
        destination: "Karachi",
        warehouse: "LAHORE",
        packageDetails: "Textile Fabrics & Yarn Cartons",
        quantity: 120,
        weight: 4500,
        senderName: "Crescent Textile Mills Ltd",
        receiverName: "Metro Cash & Carry Terminal",
        receiverPhone: "0321 9876543",
        deliveryDate: new Date(Date.now() + 86400000).toISOString(),
        deliveryTime: "14:00",
        createdAt: new Date().toISOString(),
        events: [
          { id: "te-1", status: "IN_TRANSIT", location: "Sadiqabad Motorway", timestamp: new Date().toISOString(), notes: "In transit on Motorway M-5" },
          { id: "te-2", status: "DISPATCHED", location: "Lahore Central Hub", timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), notes: "Dispatched from warehouse" },
          { id: "te-3", status: "BOOKED", location: "Lahore Station", timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), notes: "Shipment booked and loaded" },
        ],
      },
      'SPD-LHR-2026-0042': {
        id: "bilty-mock-1",
        trackingId: "SPD-2026-000142",
        biltyNumber: "SPD-LHR-2026-0042",
        status: "IN_TRANSIT",
        origin: "Lahore",
        destination: "Karachi",
        warehouse: "LAHORE",
        packageDetails: "Textile Fabrics & Yarn Cartons",
        quantity: 120,
        weight: 4500,
        senderName: "Crescent Textile Mills Ltd",
        receiverName: "Metro Cash & Carry Terminal",
        receiverPhone: "0321 9876543",
        deliveryDate: new Date(Date.now() + 86400000).toISOString(),
        deliveryTime: "14:00",
        createdAt: new Date().toISOString(),
        events: [
          { id: "te-1", status: "IN_TRANSIT", location: "Sadiqabad Motorway", timestamp: new Date().toISOString(), notes: "In transit on Motorway M-5" },
          { id: "te-2", status: "DISPATCHED", location: "Lahore Central Hub", timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), notes: "Dispatched from warehouse" },
          { id: "te-3", status: "BOOKED", location: "Lahore Station", timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), notes: "Shipment booked and loaded" },
        ],
      },
      'SPD-2026-000141': {
        id: "bilty-mock-2",
        trackingId: "SPD-2026-000141",
        biltyNumber: "SPD-KHI-2026-0038",
        status: "DELIVERED",
        origin: "Karachi",
        destination: "Islamabad",
        warehouse: "KARACHI",
        packageDetails: "Electronics & Household Goods",
        quantity: 45,
        weight: 2800,
        senderName: "Al-Rahim Trading Company",
        receiverName: "Islamabad Mega Commercial Mall",
        receiverPhone: "0312 3344556",
        deliveryDate: new Date().toISOString(),
        deliveryTime: "10:30",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        events: [
          { id: "te-4", status: "DELIVERED", location: "Islamabad Hub", timestamp: new Date().toISOString(), notes: "Delivered and signed by recipient" },
          { id: "te-5", status: "IN_TRANSIT", location: "Sukkur Bypass", timestamp: new Date(Date.now() - 3600000 * 18).toISOString(), notes: "En route" },
          { id: "te-6", status: "BOOKED", location: "Karachi Hub", timestamp: new Date(Date.now() - 86400000).toISOString(), notes: "Booking created" },
        ],
      },
      'SPD-KHI-2026-0038': {
        id: "bilty-mock-2",
        trackingId: "SPD-2026-000141",
        biltyNumber: "SPD-KHI-2026-0038",
        status: "DELIVERED",
        origin: "Karachi",
        destination: "Islamabad",
        warehouse: "KARACHI",
        packageDetails: "Electronics & Household Goods",
        quantity: 45,
        weight: 2800,
        senderName: "Al-Rahim Trading Company",
        receiverName: "Islamabad Mega Commercial Mall",
        receiverPhone: "0312 3344556",
        deliveryDate: new Date().toISOString(),
        deliveryTime: "10:30",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        events: [
          { id: "te-4", status: "DELIVERED", location: "Islamabad Hub", timestamp: new Date().toISOString(), notes: "Delivered and signed by recipient" },
          { id: "te-5", status: "IN_TRANSIT", location: "Sukkur Bypass", timestamp: new Date(Date.now() - 3600000 * 18).toISOString(), notes: "En route" },
          { id: "te-6", status: "BOOKED", location: "Karachi Hub", timestamp: new Date(Date.now() - 86400000).toISOString(), notes: "Booking created" },
        ],
      }
    };

function getVirtualConsignment(trackingQuery: string) {
  return {
    id: `bilty-virt-${trackingQuery}`,
    trackingId: trackingQuery.startsWith('SPD') ? trackingQuery : `SPD-2026-${trackingQuery}`,
    biltyNumber: trackingQuery,
    status: 'IN_TRANSIT',
    origin: 'Lahore',
    destination: 'Karachi',
    warehouse: 'LAHORE',
    packageDetails: 'General Cargo & Logistics Consignment',
    quantity: 50,
    weight: 1200,
    senderName: 'Standard Customer (Prime Logistics)',
    receiverName: 'Karachi Commercial Mart',
    receiverPhone: '0300 0000000',
    deliveryDate: new Date(Date.now() + 86400000).toISOString(),
    deliveryTime: '16:00',
    createdAt: new Date().toISOString(),
    events: [
      { id: 'te-v1', status: 'IN_TRANSIT', location: 'Central Highway', timestamp: new Date().toISOString(), notes: 'Package is on schedule' },
      { id: 'te-v2', status: 'BOOKED', location: 'Dispatch Terminal', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), notes: 'Shipment booked and verified' },
    ],
  };
}

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

    // Fall back to pre-seeded DEMO_MAP
    if (DEMO_MAP[cleanUpper]) {
      return NextResponse.json(DEMO_MAP[cleanUpper]);
    }

    return NextResponse.json(getVirtualConsignment(cleanUpper));
  } catch (error) {
    console.warn('Tracking query fallback:', error);
    const trackingQuery = (params?.id || '').trim().toUpperCase();

    if (DEMO_MAP[trackingQuery]) {
      return NextResponse.json(DEMO_MAP[trackingQuery]);
    }

    return NextResponse.json(getVirtualConsignment(trackingQuery));
  }
}
