import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createSystemNotification } from '@/lib/notifications';
import { sendEventEmail } from '@/lib/mailer';

// Generate unique sequential Bilty number
async function generateBiltyNumber(warehouse: string = 'LHR'): Promise<string> {
  const prefixSetting = await prisma.setting.findUnique({ where: { key: 'biltyPrefix' } });
  const rawPrefix = prefixSetting?.value?.trim() || 'SPD';
  const cleanPrefix = rawPrefix.endsWith('-') ? rawPrefix : `${rawPrefix}-`;

  const code = warehouse.toUpperCase().includes('KARACHI') || warehouse === 'KHI' ? 'KHI' : 'LHR';
  const count = await prisma.consignment.count();
  const year = new Date().getFullYear();
  const seq = String(count + 1).padStart(4, '0');
  const candidate = `${cleanPrefix}${code}-${year}-${seq}`;
  
  // Verify uniqueness
  const exists = await prisma.consignment.findUnique({ where: { biltyNumber: candidate } });
  if (exists) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${cleanPrefix}${code}-${year}-${randomSuffix}`;
  }
  return candidate;
}

// Generate unique sequential Tracking ID (e.g. SPD-2026-000125)
async function generateTrackingId(): Promise<string> {
  const prefixSetting = await prisma.setting.findUnique({ where: { key: 'trackingPrefix' } });
  const rawPrefix = prefixSetting?.value?.trim() || 'SPD';
  const cleanPrefix = rawPrefix.endsWith('-') ? rawPrefix : `${rawPrefix}-`;

  const year = new Date().getFullYear();
  const count = await prisma.consignment.count();
  const seq = String(count + 1).padStart(6, '0');
  let candidate = `${cleanPrefix}${year}-${seq}`;

  const exists = await prisma.consignment.findUnique({ where: { trackingId: candidate } });
  if (exists) {
    const timestamp = Date.now().toString().slice(-6);
    candidate = `${cleanPrefix}${year}-${timestamp}`;
  }
  return candidate;
}

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const warehouse = searchParams.get('warehouse') || '';
    const customerId = searchParams.get('customerId') || '';
    const driverId = searchParams.get('driverId') || '';

    const where: any = {};
    if (status) {
      if (status === 'DELETED') {
        where.shipmentStatus = 'DELETED';
      } else {
        where.shipmentStatus = status;
      }
    } else {
      where.shipmentStatus = { not: 'DELETED' };
    }

    if (warehouse) where.warehouse = warehouse;
    if (customerId) {
      where.OR = [
        { customerId },
        { senderId: customerId },
        { receiverId: customerId },
      ];
    }
    if (driverId) where.driverId = driverId;

    if (search) {
      const searchOr = [
        { biltyNumber: { contains: search } },
        { trackingId: { contains: search } },
        { senderName: { contains: search } },
        { receiverName: { contains: search } },
        { origin: { contains: search } },
        { destination: { contains: search } },
        { vehicleNumber: { contains: search } },
        { driverName: { contains: search } },
      ];
      where.AND = [
        { shipmentStatus: status ? status : { not: 'DELETED' } },
        { OR: searchOr },
      ];
      delete where.shipmentStatus;
      if (where.OR) {
        const custOr = where.OR;
        delete where.OR;
        where.AND.push({ OR: custOr });
      }
    }

    const consignments = await prisma.consignment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, companyName: true, phone: true } },
        sender: { select: { id: true, name: true, companyName: true, phone: true } },
        receiver: { select: { id: true, name: true, companyName: true, phone: true } },
        vehicle: true,
        driver: true,
        trackingEvents: {
          orderBy: { timestamp: 'desc' },
        },
        payments: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ success: true, data: consignments });
  } catch (error: any) {
    console.error('Error fetching consignments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch consignments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      customerId,
      senderId,
      senderName,
      senderPhone,
      senderAddress,
      receiverId,
      receiverName,
      receiverPhone,
      receiverAddress,
      origin = 'Lahore',
      destination = 'Karachi',
      warehouse = 'LAHORE',
      vehicleId,
      vehicleNumber,
      driverId,
      driverName,
      driverPhone,
      packageDetails,
      quantity = 1,
      weight,
      cpm,
      freight = 0,
      additionalCharges = 0,
      discount = 0,
      paidAmount = 0,
      notes,
    } = body;

    // Field Validations
    if (!senderName && !customerId) {
      return NextResponse.json({ success: false, error: 'Sender name or Customer selection is required' }, { status: 400 });
    }
    if (!receiverName || !String(receiverName).trim()) {
      return NextResponse.json({ success: false, error: 'Receiver name is required' }, { status: 400 });
    }
    if (!receiverPhone || !String(receiverPhone).trim()) {
      return NextResponse.json({ success: false, error: 'Receiver phone number is required' }, { status: 400 });
    }
    if (!origin || !String(origin).trim() || !destination || !String(destination).trim()) {
      return NextResponse.json({ success: false, error: 'Origin and Destination stations are required' }, { status: 400 });
    }

    const freightNum = parseFloat(freight) || 0;
    const addlNum = parseFloat(additionalCharges) || 0;
    const discNum = parseFloat(discount) || 0;
    const paidNum = parseFloat(paidAmount) || 0;

    if (freightNum < 0) {
      return NextResponse.json({ success: false, error: 'Freight amount cannot be negative' }, { status: 400 });
    }

    const totalAmount = Math.max(0, freightNum + addlNum - discNum);
    const remainingBalance = Math.max(0, totalAmount - paidNum);
    const paymentStatus = remainingBalance <= 0 ? 'PAID' : paidNum > 0 ? 'PARTIAL' : 'PENDING';

    // Validate unique Bilty Number
    let biltyNumber = body.biltyNumber ? String(body.biltyNumber).trim() : '';
    if (biltyNumber) {
      const exists = await prisma.consignment.findUnique({ where: { biltyNumber } });
      if (exists) {
        return NextResponse.json({ success: false, error: `Bilty Number "${biltyNumber}" is already in use. Please enter a unique Bilty Number.` }, { status: 400 });
      }
    } else {
      biltyNumber = await generateBiltyNumber(warehouse);
    }

    // Validate unique Tracking ID
    let trackingId = body.trackingId ? String(body.trackingId).trim() : '';
    if (trackingId) {
      const exists = await prisma.consignment.findUnique({ where: { trackingId } });
      if (exists) {
        return NextResponse.json({ success: false, error: `Tracking ID "${trackingId}" is already in use. Please choose another.` }, { status: 400 });
      }
    } else {
      trackingId = await generateTrackingId();
    }

    // 1. Resolve & Auto-Link Vehicle
    let resolvedVehicleId = vehicleId || null;
    let resolvedVehicleNumber = vehicleNumber ? String(vehicleNumber).trim() : null;

    if (resolvedVehicleId && !resolvedVehicleNumber) {
      const v = await prisma.vehicle.findUnique({ where: { id: resolvedVehicleId } });
      if (v) resolvedVehicleNumber = v.vehicleNumber;
    } else if (resolvedVehicleNumber) {
      let matchedVehicle = await prisma.vehicle.findFirst({
        where: {
          OR: [
            { vehicleNumber: { equals: resolvedVehicleNumber } },
            { vehicleNumber: { equals: resolvedVehicleNumber.toUpperCase() } },
          ],
        },
      });

      if (!matchedVehicle) {
        matchedVehicle = await prisma.vehicle.create({
          data: {
            vehicleNumber: resolvedVehicleNumber,
            vehicleType: 'Heavy Truck',
            status: 'ASSIGNED',
            ownerName: 'SPD Logistics Fleet',
            currentLocation: `${origin} Terminal`,
            route: `${origin} - ${destination}`,
            notes: `Auto-registered from Bilty #${biltyNumber}`,
          },
        });
      }
      resolvedVehicleId = matchedVehicle.id;
      resolvedVehicleNumber = matchedVehicle.vehicleNumber;
    }

    // 2. Resolve & Auto-Link Sender
    let resolvedSenderId = senderId || null;
    let resolvedSenderName = senderName ? String(senderName).trim() : null;
    let resolvedSenderPhone = senderPhone ? String(senderPhone).trim() : null;

    if (!resolvedSenderId && (resolvedSenderName || resolvedSenderPhone)) {
      const matchedSender = await prisma.customer.findFirst({
        where: {
          status: { not: 'DELETED' },
          OR: [
            ...(resolvedSenderPhone ? [{ phone: resolvedSenderPhone }] : []),
            ...(resolvedSenderName ? [
              { name: { equals: resolvedSenderName } },
              { companyName: { equals: resolvedSenderName } },
            ] : []),
          ],
        },
      });
      if (matchedSender) {
        resolvedSenderId = matchedSender.id;
        if (!resolvedSenderName) resolvedSenderName = matchedSender.name;
        if (!resolvedSenderPhone) resolvedSenderPhone = matchedSender.phone;
      }
    } else if (resolvedSenderId) {
      const cust = await prisma.customer.findUnique({ where: { id: resolvedSenderId } });
      if (cust) {
        if (!resolvedSenderName) resolvedSenderName = cust.name;
        if (!resolvedSenderPhone) resolvedSenderPhone = cust.phone;
      }
    }

    // 3. Resolve & Auto-Link Receiver
    let resolvedReceiverId = receiverId || null;
    let resolvedReceiverName = receiverName ? String(receiverName).trim() : null;
    let resolvedReceiverPhone = receiverPhone ? String(receiverPhone).trim() : null;

    if (!resolvedReceiverId && (resolvedReceiverName || resolvedReceiverPhone)) {
      const matchedReceiver = await prisma.customer.findFirst({
        where: {
          status: { not: 'DELETED' },
          OR: [
            ...(resolvedReceiverPhone ? [{ phone: resolvedReceiverPhone }] : []),
            ...(resolvedReceiverName ? [
              { name: { equals: resolvedReceiverName } },
              { companyName: { equals: resolvedReceiverName } },
            ] : []),
          ],
        },
      });
      if (matchedReceiver) {
        resolvedReceiverId = matchedReceiver.id;
        if (!resolvedReceiverName) resolvedReceiverName = matchedReceiver.name;
        if (!resolvedReceiverPhone) resolvedReceiverPhone = matchedReceiver.phone;
      }
    } else if (resolvedReceiverId) {
      const cust = await prisma.customer.findUnique({ where: { id: resolvedReceiverId } });
      if (cust) {
        if (!resolvedReceiverName) resolvedReceiverName = cust.name;
        if (!resolvedReceiverPhone) resolvedReceiverPhone = cust.phone;
      }
    }

    // 4. Resolve & Auto-Link Driver
    let resolvedDriverId = driverId || null;
    let resolvedDriverName = driverName ? String(driverName).trim() : null;
    const cleanDriverPhone = driverPhone ? String(driverPhone).trim() : null;

    if (!resolvedDriverId && (resolvedDriverName || cleanDriverPhone)) {
      const matchedDriver = await prisma.driver.findFirst({
        where: {
          status: { not: 'INACTIVE' },
          OR: [
            ...(cleanDriverPhone ? [{ phone: cleanDriverPhone }, { contact: cleanDriverPhone }] : []),
            ...(resolvedDriverName ? [{ name: { equals: resolvedDriverName } }] : []),
          ],
        },
      });
      if (matchedDriver) {
        resolvedDriverId = matchedDriver.id;
        if (!resolvedDriverName) resolvedDriverName = matchedDriver.name;
      }
    } else if (resolvedDriverId) {
      const d = await prisma.driver.findUnique({ where: { id: resolvedDriverId } });
      if (d && !resolvedDriverName) resolvedDriverName = d.name;
    }

    // 5. Connect Customer / Dealer
    const resolvedCustomerId = customerId || resolvedSenderId || resolvedReceiverId || null;

    const consignment = await prisma.$transaction(async (tx) => {
      const item = await tx.consignment.create({
        data: {
          biltyNumber,
          trackingId,
          customerId: resolvedCustomerId,
          senderId: resolvedSenderId,
          senderName: resolvedSenderName || 'Walk-in Shipper',
          senderPhone: resolvedSenderPhone || null,
          senderAddress: senderAddress || null,
          receiverId: resolvedReceiverId,
          receiverName: resolvedReceiverName || 'Consignee',
          receiverPhone: resolvedReceiverPhone || null,
          receiverAddress: receiverAddress || null,
          origin,
          destination,
          warehouse,
          vehicleId: resolvedVehicleId,
          vehicleNumber: resolvedVehicleNumber,
          driverId: resolvedDriverId,
          driverName: resolvedDriverName,
          packageDetails: packageDetails || 'General Merchandise Goods',
          quantity: parseInt(quantity) || 1,
          weight: weight ? parseFloat(weight) : null,
          cpm: cpm ? parseFloat(cpm) : null,
          freight: freightNum,
          additionalCharges: addlNum,
          discount: discNum,
          totalAmount,
          paidAmount: paidNum,
          remainingBalance,
          paymentStatus,
          shipmentStatus: body.shipmentStatus || 'BOOKED',
          notes: notes || null,
          date: body.date ? new Date(body.date) : new Date(),
        },
        include: {
          customer: true,
          sender: true,
          receiver: true,
          vehicle: true,
          driver: true,
          trackingEvents: true,
        },
      });

      // Create initial tracking event
      await tx.trackingEvent.create({
        data: {
          consignmentId: item.id,
          status: body.shipmentStatus || 'BOOKED',
          location: `${origin} Dispatch Hub (${warehouse})`,
          description: `Consignment Bilty #${biltyNumber} created and booked for transit to ${destination}.`,
          timestamp: new Date(),
        },
      });

      // Update customer ledger if linked customer has an account
      const targetCustId = resolvedCustomerId || resolvedSenderId;
      if (targetCustId) {
        const customerAccount = await tx.account.findFirst({
          where: { customerId: targetCustId },
        });
        if (customerAccount) {
          await tx.accountTransaction.create({
            data: {
              accountId: customerAccount.id,
              voucherNumber: biltyNumber,
              description: `Bilty #${biltyNumber} — ${origin} to ${destination}`,
              debit: totalAmount,
              credit: paidNum,
              balance: totalAmount - paidNum,
              paymentMethod: paidNum > 0 ? 'CASH/DIRECT' : undefined,
            },
          });
        }
      }

      // If vehicle assigned, update status and route
      if (resolvedVehicleId) {
        await tx.vehicle.update({
          where: { id: resolvedVehicleId },
          data: {
            status: 'ASSIGNED',
            currentLocation: `${origin} Hub`,
            route: `${origin} - ${destination}`,
            driverId: resolvedDriverId || undefined,
          },
        });
      }

      // If driver assigned, update status and assigned vehicle
      if (resolvedDriverId) {
        await tx.driver.update({
          where: { id: resolvedDriverId },
          data: {
            status: 'ASSIGNED',
            assignedVehicleId: resolvedVehicleId || undefined,
            vehicleNumber: resolvedVehicleNumber || undefined,
          },
        });
      }

      return item;
    });

    // 1. Generate real persistent Notification in SQLite
    createSystemNotification({
      type: 'BILTY',
      title: `New Bilty Created: #${consignment.biltyNumber}`,
      message: `${consignment.origin} to ${consignment.destination} | Shipper: ${consignment.senderName} | Consignee: ${consignment.receiverName} | Total: PKR ${(consignment.totalAmount || 0).toLocaleString()}`,
      link: '/admin/bilty',
    }).catch((err) => console.warn('[Notification Error]', err));

    // 2. Dispatch real Email to Admin (superpakdatawale@gmail.com)
    sendEventEmail({
      eventType: 'BILTY_CREATED',
      subject: `[SPD Bilty Alert] New Bilty #${consignment.biltyNumber} (${consignment.origin} → ${consignment.destination})`,
      title: `Consignment Bilty #${consignment.biltyNumber} Booked`,
      summary: `A new bilty consignment has been created and registered in the system.`,
      consignmentData: {
        customerName: consignment.senderName || 'Valued Shipper',
        biltyNumber: consignment.biltyNumber,
        trackingId: consignment.trackingId,
        bookingDate: consignment.createdAt ? new Date(consignment.createdAt).toLocaleDateString('en-PK') : new Date().toLocaleDateString('en-PK'),
        sender: consignment.senderName || 'Valued Shipper',
        receiver: consignment.receiverName || 'Consignee',
        senderPhone: consignment.senderPhone || undefined,
        receiverPhone: consignment.receiverPhone || undefined,
        origin: consignment.origin,
        destination: consignment.destination,
        packages: consignment.quantity,
        packageDetails: consignment.packageDetails || 'General Cargo',
        weight: consignment.weight ? `${consignment.weight} kg` : undefined,
        totalAmount: consignment.totalAmount,
        paidAmount: consignment.paidAmount,
        remainingBalance: consignment.remainingBalance,
        shipmentStatus: consignment.shipmentStatus,
        notes: consignment.notes || consignment.deliveryNotes || undefined,
      },
      fields: {
        'Bilty Number': consignment.biltyNumber,
        'Tracking ID': consignment.trackingId,
        'Route': `${consignment.origin} → ${consignment.destination}`,
        'Sender / Shipper': `${consignment.senderName} (${consignment.senderPhone || 'N/A'})`,
        'Receiver / Consignee': `${consignment.receiverName} (${consignment.receiverPhone || 'N/A'})`,
        'Packages': `${consignment.quantity} pkg (${consignment.packageDetails || 'General Cargo'})`,
        'Total Freight': `PKR ${(consignment.totalAmount || 0).toLocaleString()}`,
        'Paid Advance': `PKR ${(consignment.paidAmount || 0).toLocaleString()}`,
        'Remaining Balance': `PKR ${(consignment.remainingBalance || 0).toLocaleString()}`,
        'Assigned Vehicle': consignment.vehicleNumber || 'Pending',
        'Assigned Driver': consignment.driverName || 'Pending',
      },
      link: '/admin/bilty',
    }).catch((err) => console.warn('[Email Alert Error]', err));

    return NextResponse.json({ success: true, data: consignment });
  } catch (error: any) {
    console.error('Error creating consignment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create consignment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, shipmentStatus, location, statusNote, paidAmount, ...rest } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Consignment ID is required' }, { status: 400 });
    }

    const current = await prisma.consignment.findUnique({
      where: { id },
      include: { trackingEvents: true },
    });

    if (!current) {
      return NextResponse.json({ success: false, error: 'Consignment not found' }, { status: 404 });
    }

    const updateData: any = {};

    // 1. Bilty Number & Tracking ID validation if changed
    if (rest.biltyNumber && String(rest.biltyNumber).trim() !== current.biltyNumber) {
      const cleanBilty = String(rest.biltyNumber).trim();
      const exists = await prisma.consignment.findUnique({ where: { biltyNumber: cleanBilty } });
      if (exists && exists.id !== id) {
        return NextResponse.json({ success: false, error: `Bilty Number "${cleanBilty}" is already in use by another bilty.` }, { status: 400 });
      }
      updateData.biltyNumber = cleanBilty;
    }

    if (rest.trackingId && String(rest.trackingId).trim() !== current.trackingId) {
      const cleanTrk = String(rest.trackingId).trim();
      const exists = await prisma.consignment.findUnique({ where: { trackingId: cleanTrk } });
      if (exists && exists.id !== id) {
        return NextResponse.json({ success: false, error: `Tracking ID "${cleanTrk}" is already in use by another bilty.` }, { status: 400 });
      }
      updateData.trackingId = cleanTrk;
    }

    // 2. Customer relationship
    if (rest.customerId !== undefined) {
      updateData.customerId = rest.customerId ? String(rest.customerId).trim() : null;
    }

    // 3. Sender & Receiver details
    if (rest.senderName !== undefined) updateData.senderName = rest.senderName ? String(rest.senderName).trim() : null;
    if (rest.senderPhone !== undefined) updateData.senderPhone = rest.senderPhone ? String(rest.senderPhone).trim() : null;
    if (rest.senderAddress !== undefined) updateData.senderAddress = rest.senderAddress ? String(rest.senderAddress).trim() : null;
    if (rest.receiverName !== undefined) updateData.receiverName = rest.receiverName ? String(rest.receiverName).trim() : null;
    if (rest.receiverPhone !== undefined) updateData.receiverPhone = rest.receiverPhone ? String(rest.receiverPhone).trim() : null;
    if (rest.receiverAddress !== undefined) updateData.receiverAddress = rest.receiverAddress ? String(rest.receiverAddress).trim() : null;

    // 4. Origin, Destination, Hub, Dates
    if (rest.origin !== undefined) updateData.origin = String(rest.origin).trim();
    if (rest.destination !== undefined) updateData.destination = String(rest.destination).trim();
    if (rest.warehouse !== undefined) updateData.warehouse = String(rest.warehouse).trim();
    if (rest.date !== undefined) updateData.date = new Date(rest.date);
    if (rest.notes !== undefined) updateData.notes = rest.notes ? String(rest.notes).trim() : null;

    // 5. Cargo details
    if (rest.packageDetails !== undefined) updateData.packageDetails = rest.packageDetails ? String(rest.packageDetails).trim() : null;
    if (rest.quantity !== undefined) updateData.quantity = parseInt(rest.quantity) || 1;
    if (rest.weight !== undefined) updateData.weight = rest.weight ? parseFloat(rest.weight) : null;
    if (rest.cpm !== undefined) updateData.cpm = rest.cpm ? parseFloat(rest.cpm) : null;

    // 6. Driver Re-assignment
    let oldDriverId = current.driverId;
    let newDriverId = oldDriverId;
    if (rest.driverId !== undefined) {
      newDriverId = rest.driverId ? String(rest.driverId).trim() : null;
      updateData.driverId = newDriverId;
      if (newDriverId) {
        const d = await prisma.driver.findUnique({ where: { id: newDriverId } });
        updateData.driverName = d ? d.name : (rest.driverName || null);
      } else {
        updateData.driverName = null;
      }
    } else if (rest.driverName !== undefined) {
      updateData.driverName = rest.driverName ? String(rest.driverName).trim() : null;
    }

    // 7. Vehicle Re-assignment
    let oldVehicleId = current.vehicleId;
    let newVehicleId = oldVehicleId;
    if (rest.vehicleId !== undefined) {
      newVehicleId = rest.vehicleId ? String(rest.vehicleId).trim() : null;
      updateData.vehicleId = newVehicleId;
      if (newVehicleId) {
        const v = await prisma.vehicle.findUnique({ where: { id: newVehicleId } });
        updateData.vehicleNumber = v ? v.vehicleNumber : (rest.vehicleNumber || null);
      } else {
        updateData.vehicleNumber = null;
      }
    } else if (rest.vehicleNumber !== undefined) {
      updateData.vehicleNumber = rest.vehicleNumber ? String(rest.vehicleNumber).trim() : null;
    }

    // 8. Financial Recalculations
    const freightNum = rest.freight !== undefined ? (parseFloat(rest.freight) || 0) : current.freight;
    const addlNum = rest.additionalCharges !== undefined ? (parseFloat(rest.additionalCharges) || 0) : current.additionalCharges;
    const discNum = rest.discount !== undefined ? (parseFloat(rest.discount) || 0) : current.discount;
    const paidNum = paidAmount !== undefined ? (parseFloat(paidAmount) || 0) : (rest.paidAmount !== undefined ? (parseFloat(rest.paidAmount) || 0) : current.paidAmount);

    const totalAmount = Math.max(0, freightNum + addlNum - discNum);
    const remainingBalance = Math.max(0, totalAmount - paidNum);
    const paymentStatus = remainingBalance <= 0 ? 'PAID' : paidNum > 0 ? 'PARTIAL' : 'PENDING';

    updateData.freight = freightNum;
    updateData.additionalCharges = addlNum;
    updateData.discount = discNum;
    updateData.totalAmount = totalAmount;
    updateData.paidAmount = paidNum;
    updateData.remainingBalance = remainingBalance;
    updateData.paymentStatus = paymentStatus;

    // 9. Shipment Status & Tracking Events
    const targetStatus = shipmentStatus || rest.shipmentStatus;
    const statusChanged = targetStatus && targetStatus !== current.shipmentStatus;
    if (targetStatus) updateData.shipmentStatus = targetStatus;

    // Delivery confirmation fields
    if (targetStatus === 'DELIVERED') {
      updateData.deliveryDate = rest.deliveryDate ? new Date(rest.deliveryDate) : (current.deliveryDate || new Date());
      updateData.deliveryTime = rest.deliveryTime || current.deliveryTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      updateData.receivedBy = rest.receivedBy || current.receivedBy || updateData.receiverName || current.receiverName;
      updateData.receiverConfirmation = true;
      if (rest.deliveryNotes) updateData.deliveryNotes = rest.deliveryNotes;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Add tracking event if status changed or note provided
      if (statusChanged || statusNote) {
        await tx.trackingEvent.create({
          data: {
            consignmentId: id,
            status: targetStatus || current.shipmentStatus,
            location: location || `${updateData.destination || current.destination} Terminal`,
            description: statusNote || `Shipment status updated to ${(targetStatus || current.shipmentStatus).replace(/_/g, ' ')}.`,
            timestamp: new Date(),
          },
        });
      }

      // Execute update
      const res = await tx.consignment.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          sender: true,
          receiver: true,
          driver: true,
          vehicle: true,
          trackingEvents: { orderBy: { timestamp: 'desc' } },
        },
      });

      // Handle old driver status if driver was changed or unassigned
      if (oldDriverId && oldDriverId !== newDriverId) {
        const otherActiveDriverConsignments = await tx.consignment.count({
          where: {
            driverId: oldDriverId,
            id: { not: id },
            shipmentStatus: { notIn: ['DELIVERED', 'CANCELLED'] },
          },
        });
        if (otherActiveDriverConsignments === 0) {
          await tx.driver.update({
            where: { id: oldDriverId },
            data: { status: 'AVAILABLE' },
          });
        }
      }

      // Handle new driver status
      if (newDriverId) {
        if (targetStatus === 'DELIVERED' || targetStatus === 'CANCELLED') {
          const otherActive = await tx.consignment.count({
            where: {
              driverId: newDriverId,
              id: { not: id },
              shipmentStatus: { notIn: ['DELIVERED', 'CANCELLED'] },
            },
          });
          if (otherActive === 0) {
            await tx.driver.update({
              where: { id: newDriverId },
              data: { status: 'AVAILABLE' },
            });
          }
        } else {
          await tx.driver.update({
            where: { id: newDriverId },
            data: { status: 'ASSIGNED' },
          });
        }
      }

      // Handle old vehicle status if vehicle was changed or unassigned
      if (oldVehicleId && oldVehicleId !== newVehicleId) {
        const otherActiveVehicleConsignments = await tx.consignment.count({
          where: {
            vehicleId: oldVehicleId,
            id: { not: id },
            shipmentStatus: { notIn: ['DELIVERED', 'CANCELLED'] },
          },
        });
        if (otherActiveVehicleConsignments === 0) {
          await tx.vehicle.update({
            where: { id: oldVehicleId },
            data: { status: 'AVAILABLE' },
          });
        }
      }

      // Handle new vehicle status
      if (newVehicleId) {
        if (targetStatus === 'DELIVERED' || targetStatus === 'CANCELLED') {
          const otherActiveVeh = await tx.consignment.count({
            where: {
              vehicleId: newVehicleId,
              id: { not: id },
              shipmentStatus: { notIn: ['DELIVERED', 'CANCELLED'] },
            },
          });
          if (otherActiveVeh === 0) {
            await tx.vehicle.update({
              where: { id: newVehicleId },
              data: { status: 'AVAILABLE' },
            });
          }
        } else {
          await tx.vehicle.update({
            where: { id: newVehicleId },
            data: { status: 'ASSIGNED' },
          });
        }
      }

      return res;
    });

    // 1. Notification for delivery or status change
    if (statusChanged) {
      const isDelivered = updated.shipmentStatus === 'DELIVERED';
      createSystemNotification({
        type: 'BILTY',
        title: isDelivered ? `Bilty Delivered: #${updated.biltyNumber}` : `Bilty #${updated.biltyNumber} Status Updated`,
        message: isDelivered
          ? `Consignment #${updated.biltyNumber} was delivered to ${updated.receivedBy || updated.receiverName} in ${updated.destination}.`
          : `Status changed to ${updated.shipmentStatus.replace(/_/g, ' ')} (${location || updated.destination}).`,
        link: '/admin/bilty',
      }).catch((err) => console.warn('[Notification Error]', err));

      // 2. Email alert if delivered
      if (isDelivered) {
        sendEventEmail({
          eventType: 'BILTY_DELIVERED',
          subject: `[SPD Delivery Confirmed] Bilty #${updated.biltyNumber} Delivered to ${updated.receiverName}`,
          title: `Bilty #${updated.biltyNumber} Successfully Delivered`,
          summary: `Shipment has been successfully delivered and confirmed at destination.`,
          consignmentData: {
            customerName: updated.receiverName || 'Valued Consignee',
            biltyNumber: updated.biltyNumber,
            trackingId: updated.trackingId,
            bookingDate: updated.createdAt ? new Date(updated.createdAt).toLocaleDateString('en-PK') : new Date().toLocaleDateString('en-PK'),
            sender: updated.senderName || 'Valued Shipper',
            receiver: updated.receiverName || 'Valued Consignee',
            senderPhone: updated.senderPhone || undefined,
            receiverPhone: updated.receiverPhone || undefined,
            origin: updated.origin,
            destination: updated.destination,
            packages: updated.quantity,
            packageDetails: updated.packageDetails || 'General Cargo',
            weight: updated.weight ? `${updated.weight} kg` : undefined,
            totalAmount: updated.totalAmount,
            paidAmount: updated.paidAmount,
            remainingBalance: updated.remainingBalance,
            shipmentStatus: 'DELIVERED',
            notes: updated.deliveryNotes || 'Delivered and confirmed at destination terminal',
          },
          fields: {
            'Bilty Number': updated.biltyNumber,
            'Tracking ID': updated.trackingId,
            'Delivered At': `${updated.destination} Terminal`,
            'Received By': updated.receivedBy || updated.receiverName || 'Consignee',
            'Delivery Date': updated.deliveryDate ? new Date(updated.deliveryDate).toLocaleDateString('en-PK') : new Date().toLocaleDateString('en-PK'),
            'Delivery Time': updated.deliveryTime || new Date().toLocaleTimeString('en-PK'),
            'Total Freight': `PKR ${(updated.totalAmount || 0).toLocaleString()}`,
            'Remaining Balance': `PKR ${(updated.remainingBalance || 0).toLocaleString()}`,
            'Delivery Notes': updated.deliveryNotes || 'Delivery confirmed by dispatch',
          },
          link: '/admin/bilty',
        }).catch((err) => console.warn('[Email Alert Error]', err));
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating consignment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update consignment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (e) {
        // no json body
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bilty ID is required for deletion' },
        { status: 400 }
      );
    }

    const consignment = await prisma.consignment.findUnique({
      where: { id },
      include: { driver: true, vehicle: true },
    });

    if (!consignment) {
      return NextResponse.json(
        { success: false, error: 'Bilty consignment not found' },
        { status: 404 }
      );
    }

    if (consignment.shipmentStatus === 'DELETED') {
      return NextResponse.json({
        success: true,
        message: 'Consignment is already marked as deleted',
      });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Mark status as DELETED (preserving accounting and foreign-key history)
      await tx.consignment.update({
        where: { id },
        data: { shipmentStatus: 'DELETED' },
      });

      // 2. Release assigned driver if they have no other active consignments
      if (consignment.driverId) {
        const otherActiveDriverShipments = await tx.consignment.count({
          where: {
            driverId: consignment.driverId,
            id: { not: id },
            shipmentStatus: { notIn: ['DELIVERED', 'CANCELLED', 'DELETED'] },
          },
        });
        if (otherActiveDriverShipments === 0) {
          await tx.driver.update({
            where: { id: consignment.driverId },
            data: { status: 'AVAILABLE' },
          });
        }
      }

      // 3. Release assigned vehicle if it has no other active consignments
      if (consignment.vehicleId) {
        const otherActiveVehicleShipments = await tx.consignment.count({
          where: {
            vehicleId: consignment.vehicleId,
            id: { not: id },
            shipmentStatus: { notIn: ['DELIVERED', 'CANCELLED', 'DELETED'] },
          },
        });
        if (otherActiveVehicleShipments === 0) {
          await tx.vehicle.update({
            where: { id: consignment.vehicleId },
            data: { status: 'AVAILABLE' },
          });
        }
      }

      // 4. Log audit action
      try {
        await tx.auditLog.create({
          data: {
            userId: session.userId,
            action: 'DELETE',
            module: 'BILTY',
            details: `Admin deleted Bilty ${consignment.biltyNumber} (Tracking: ${consignment.trackingId})`,
          },
        });
      } catch (auditErr) {
        console.error('Failed to create audit log for bilty deletion:', auditErr);
      }
    });

    return NextResponse.json({
      success: true,
      message: `Bilty ${consignment.biltyNumber} has been safely deleted.`,
    });
  } catch (error: any) {
    console.error('Error deleting consignment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete consignment' },
      { status: 500 }
    );
  }
}

