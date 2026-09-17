/**
 * Universal Click-to-Chat WhatsApp Utility
 *
 * Requirements:
 * - Uses standard click-to-chat deep links (https://wa.me/<phone>?text=<encoded_msg>)
 * - Native WhatsApp application opens automatically when installed on Android / iPhone / Desktop
 * - Falls back to WhatsApp Web in browser on Chromebooks & Desktop
 * - Messages are ONLY pre-filled into the composer; NEVER sent automatically
 * - The user must manually press Send inside WhatsApp
 * - No WhatsApp Business API, Meta tokens, webhooks, or backend automation
 */

/**
 * Normalizes a phone number to standard international WhatsApp format without '+' or leading zeros.
 * Standard Pakistan format: 923001234567
 */
export function formatWhatsAppNumber(phone?: string | null): string | null {
  if (!phone) return null;

  // Strip all non-numeric characters
  let clean = phone.replace(/[^0-9]/g, '');
  if (!clean) return null;

  // Handle international prefixes
  if (clean.startsWith('0092')) {
    clean = clean.slice(2);
  } else if (clean.startsWith('0')) {
    clean = '92' + clean.slice(1);
  } else if (clean.length === 10 && clean.startsWith('3')) {
    clean = '92' + clean;
  }

  return clean;
}

function formatStatusLabel(status?: string | null): string {
  if (!status) return 'In Transit';
  const statusMap: Record<string, string> = {
    BOOKED: 'Booked',
    PICKED_UP: 'Picked Up',
    IN_TRANSIT: 'In Transit',
    ARRIVED_AT_DESTINATION: 'Arrived at Destination',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    ON_HOLD: 'On Hold',
  };
  const upper = status.toUpperCase();
  if (statusMap[upper]) {
    return statusMap[upper];
  }
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Generates a universal click-to-chat WhatsApp URL.
 * If phone is omitted, opens WhatsApp composer to select any recipient.
 */
export function buildWhatsAppUrl(phone?: string | null, message?: string): string {
  const cleanNumber = formatWhatsAppNumber(phone);
  const encodedText = message ? encodeURIComponent(message) : '';

  if (!cleanNumber) {
    return encodedText ? `https://wa.me/?text=${encodedText}` : 'https://wa.me/';
  }

  return `https://wa.me/${cleanNumber}${encodedText ? `?text=${encodedText}` : ''}`;
}

/**
 * Pre-filled professional message for Shipment / Bilty Tracking
 */
export function getBiltyTrackingWhatsAppMessage({
  biltyNumber,
  trackingId,
  status,
  origin,
  destination,
}: {
  biltyNumber?: string | null;
  trackingId?: string | null;
  status?: string | null;
  origin?: string | null;
  destination?: string | null;
}): string {
  const formattedStatus = formatStatusLabel(status);
  let msg = `Assalamualaikum, this is SPD Logistics. Regarding Bilty No. ${biltyNumber || 'N/A'}, Tracking ID ${trackingId || 'N/A'}, the current shipment status is ${formattedStatus}.`;
  if (origin && destination) {
    msg += ` Route: ${origin} to ${destination}.`;
  }
  msg += ` Please contact us if you need any further information.`;
  return msg;
}

/**
 * Pre-filled message for Driver contacting Customer (Driver → Customer)
 */
export function getDriverToCustomerWhatsAppMessage({
  customerName,
  driverName,
  biltyNumber,
  trackingId,
  status,
}: {
  customerName?: string | null;
  driverName?: string | null;
  biltyNumber?: string | null;
  trackingId?: string | null;
  status?: string | null;
}): string {
  const formattedStatus = formatStatusLabel(status);
  const driverPart = driverName ? ` (${driverName})` : '';
  return `Assalamualaikum ${customerName || 'Customer'}, this is your SPD Logistics driver${driverPart}. Regarding Bilty No. ${biltyNumber || 'N/A'}, Tracking ID ${trackingId || 'N/A'}, the current shipment status is ${formattedStatus}. Please let me know your delivery instructions or exact drop-off address.`;
}

/**
 * Pre-filled message for Customer contacting Driver (Customer → Driver)
 */
export function getCustomerToDriverWhatsAppMessage({
  driverName,
  customerName,
  biltyNumber,
  trackingId,
}: {
  driverName?: string | null;
  customerName?: string | null;
  biltyNumber?: string | null;
  trackingId?: string | null;
}): string {
  const custPart = customerName ? ` (${customerName})` : '';
  return `Assalamualaikum ${driverName || 'Driver Sahab'}, this is your customer${custPart}. Regarding Bilty No. ${biltyNumber || 'N/A'}, Tracking ID ${trackingId || 'N/A'}, please share your current transit update and estimated delivery time.`;
}

/**
 * Pre-filled message for Admin contacting Customer
 */
export function getAdminToCustomerWhatsAppMessage({
  customerName,
  companyName,
}: {
  customerName?: string | null;
  companyName?: string | null;
}): string {
  const namePart = companyName ? `${customerName} (${companyName})` : (customerName || 'Valued Customer');
  return `Assalamualaikum ${namePart}, this is SPD Logistics Central Support. How can we assist you today?`;
}

/**
 * Pre-filled message for Admin contacting Driver
 */
export function getAdminToDriverWhatsAppMessage({
  driverName,
  vehicleNumber,
}: {
  driverName?: string | null;
  vehicleNumber?: string | null;
}): string {
  const vehPart = vehicleNumber ? ` (Vehicle: ${vehicleNumber})` : '';
  return `Assalamualaikum ${driverName || 'Driver Sahab'}${vehPart}, this is SPD Logistics Central Dispatch. Please report your route transit status and current vehicle location.`;
}
