import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/mailer";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// In-memory sliding window rate limiter (max 5 submissions per 10 minutes per IP)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || record.expiresAt < now) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (record.count >= 5) {
    return false;
  }
  record.count += 1;
  return true;
}

// Security: escape HTML entities to prevent HTML injection in email clients
function escapeHtml(str: string = ""): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Security: strip carriage returns and newlines to prevent email header injection
function sanitizeHeader(str: string = ""): string {
  return String(str).replace(/[\r\n\t]+/g, " ").trim();
}

// Normalize Pakistani and international phone numbers to international digits-only format
function normalizePhoneNumber(phoneStr: string = ""): string {
  const digits = phoneStr.replace(/\D/g, "");
  if (!digits || digits.length < 10) return "";
  if (digits.startsWith("0")) {
    return "92" + digits.slice(1);
  }
  if (digits.startsWith("92")) {
    return digits;
  }
  return "92" + digits;
}

// Generate unique, collision-resistant inquiry reference ID
function generateReferenceId(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `SPD-INQ-${datePart}-${randomPart}`;
}

interface EmailRenderData {
  refId: string;
  inquiryType: "CUSTOMER" | "BROKER";
  fullName: string;
  companyName?: string;
  phone: string;
  normalizedPhone: string;
  email: string;
  originCity?: string;
  destinationCity?: string;
  cargoDescription?: string;
  estimatedWeight?: string;
  vehicleType?: string;
  vehicleRegNo?: string;
  operatingCity?: string;
  preferredRoutes?: string;
  expectedTerms?: string;
  message: string;
  submittedAt: string;
}

function buildCorporateHtmlEmail(data: EmailRenderData): string {
  const isBroker = data.inquiryType === "BROKER";
  const badgeBg = isBroker ? "#f3e8ff" : "#dcfce7";
  const badgeColor = isBroker ? "#7e22ce" : "#15803d";
  const badgeBorder = isBroker ? "#d8b4fe" : "#86efac";
  const badgeLabel = isBroker ? "TRANSPORTER / BROKER REGISTRATION" : "CUSTOMER BOOKING";

  const waPrefillMessage = encodeURIComponent(
    "Assalam-o-Alaikum! We have received your inquiry regarding SPD Logistics. Thank you for contacting us. Our team will assist you shortly."
  );
  const waUrl = data.normalizedPhone ? `https://wa.me/${data.normalizedPhone}?text=${waPrefillMessage}` : "";

  // Table rows with alternating background and conditional rendering (omit empty values)
  const rows: { label: string; value: string; isLink?: boolean; href?: string; highlight?: boolean }[] = [];

  rows.push({ label: "Reference ID", value: data.refId, highlight: true });

  if (isBroker) {
    rows.push({ label: "Broker / Owner Name", value: data.fullName });
    if (data.companyName) {
      rows.push({ label: "Company / Fleet Name", value: data.companyName });
    }
  } else {
    rows.push({ label: "Customer Full Name", value: data.fullName });
  }

  rows.push({
    label: "WhatsApp / Phone",
    value: data.phone,
    isLink: true,
    href: `tel:${data.normalizedPhone || data.phone}`,
    highlight: true,
  });

  if (data.email && data.email !== "superpakdatawale@gmail.com") {
    rows.push({ label: "Email Address", value: data.email, isLink: true, href: `mailto:${data.email}` });
  }

  if (isBroker) {
    if (data.operatingCity) rows.push({ label: "Operating Base City", value: data.operatingCity });
    if (data.vehicleType) rows.push({ label: "Vehicle Category", value: data.vehicleType });
    if (data.vehicleRegNo) rows.push({ label: "Registration Plate", value: data.vehicleRegNo });
    if (data.preferredRoutes) rows.push({ label: "Preferred Routes", value: data.preferredRoutes });
    if (data.expectedTerms) rows.push({ label: "Tariff Expectations / Terms", value: data.expectedTerms });
  } else {
    if (data.originCity) rows.push({ label: "Origin City", value: data.originCity });
    if (data.destinationCity) rows.push({ label: "Destination City", value: data.destinationCity });
    if (data.originCity && data.destinationCity) {
      rows.push({ label: "Transport Lane", value: `${data.originCity} ➔ ${data.destinationCity}`, highlight: true });
    }
    if (data.cargoDescription) rows.push({ label: "Cargo Description", value: data.cargoDescription });
    if (data.estimatedWeight) rows.push({ label: "Estimated Weight", value: data.estimatedWeight });
  }

  const tableRowsHtml = rows
    .map((r, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      const valContent = r.isLink && r.href
        ? `<a href="${escapeHtml(r.href)}" style="color: ${r.highlight ? "#dc2626" : "#1e40af"}; text-decoration: none; font-weight: 700;">${escapeHtml(r.value)}</a>`
        : `<span style="color: ${r.highlight ? "#0f172a" : "#334155"}; font-weight: ${r.highlight ? "800" : "600"};">${escapeHtml(r.value)}</span>`;

      return `
        <tr style="background-color: ${bg};">
          <td style="padding: 11px 16px; width: 40%; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; border-bottom: 1px solid #e2e8f0;">
            ${escapeHtml(r.label)}
          </td>
          <td style="padding: 11px 16px; font-size: 13px; border-bottom: 1px solid #e2e8f0;">
            ${valContent}
          </td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.inquiryType)} - SPD Logistics</title>
</head>
<body style="margin: 0; padding: 24px 10px; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <center style="width: 100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border-top: 5px solid #dc2626; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
      
      <!-- Header Banner -->
      <tr>
        <td style="background-color: #ffffff; padding: 26px 24px 20px 24px; text-align: center;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <div style="font-size: 26px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 2px;">
                  <span style="color: #dc2626;">SPD</span> <span style="color: #1e40af;">LOGISTICS</span>
                </div>
                <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
                  Super Pak Data Wale Goods Transport Co.
                </div>
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                  Professional Cargo &amp; Transportation Services &bull; Est. 1996
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Brand Divider Line (Red & Blue) -->
      <tr>
        <td style="padding: 0; line-height: 4px; font-size: 1px; height: 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="50%" style="background-color: #dc2626; height: 4px; line-height: 4px; font-size: 1px;">&nbsp;</td>
              <td width="50%" style="background-color: #1e40af; height: 4px; line-height: 4px; font-size: 1px;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Inquiry Identification Bar -->
      <tr>
        <td style="padding: 16px 24px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="left">
                <span style="display: inline-block; padding: 5px 12px; background-color: ${badgeBg}; color: ${badgeColor}; border: 1.5px solid ${badgeBorder}; border-radius: 9999px; font-size: 10px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">
                  ${badgeLabel}
                </span>
              </td>
              <td align="right" style="font-size: 11px; color: #64748b; font-weight: 700;">
                🕒 ${escapeHtml(data.submittedAt)}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Content Area -->
      <tr>
        <td style="padding: 24px;">
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
            <tr>
              <td>
                <h3 style="margin: 0 0 6px 0; font-size: 17px; font-weight: 900; color: #0f172a;">
                  ${isBroker ? "Fleet Owner / Transporter Registration" : "New Consignment Booking Inquiry"}
                </h3>
                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                  A verified inquiry has been received via the SPD Logistics web portal for <strong style="color: #1e40af;">superpakdatawale@gmail.com</strong>.
                </p>
              </td>
            </tr>
          </table>

          <!-- Structured Inquiry Table -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 22px;">
            ${tableRowsHtml}
          </table>

          <!-- Message Box -->
          <div style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; border-left: 4px solid #dc2626; padding: 14px 16px; margin-bottom: 24px;">
            <div style="font-size: 11px; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
              📝 ${isBroker ? "Additional Fleet Notes & Tariff Requirements:" : "Customer Consignment & Handling Message:"}
            </div>
            <div style="font-size: 13px; color: #0f172a; line-height: 1.6; white-space: pre-wrap; word-break: break-word;">${
              escapeHtml(data.message) || "No additional instructions provided. Standard logistics dispatch requested."
            }</div>
          </div>

          <!-- WhatsApp Action Button (Omitted if phone invalid) -->
          ${
            waUrl
              ? `
          <div style="text-align: center; margin: 24px 0 10px 0;">
            <a href="${escapeHtml(waUrl)}" target="_blank" style="display: inline-block; padding: 13px 28px; background-color: #22c55e; color: #ffffff; font-size: 13px; font-weight: 800; text-decoration: none; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              💬 REPLY TO ${isBroker ? "BROKER" : "CUSTOMER"} ON WHATSAPP
            </a>
            <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
              Opens verified conversation with ${escapeHtml(data.phone)}
            </div>
          </div>`
              : ""
          }

        </td>
      </tr>

      <!-- Corporate Footer -->
      <tr>
        <td style="background-color: #0b1120; padding: 22px 24px; text-align: center; border-top: 1px solid #1e293b; color: #94a3b8; font-size: 11px; line-height: 1.6;">
          <p style="margin: 0 0 4px 0; font-weight: 800; color: #ffffff; font-size: 12px; letter-spacing: 0.5px;">
            SPD LOGISTICS &bull; SUPER PAK DATA WALE GOODS TRANSPORT CO.
          </p>
          <p style="margin: 0 0 3px 0; color: #cbd5e1;">
            <strong>Karachi Freight Operations:</strong> Hawksbay Truck Stand, Maripur Road, Karachi (Hammad: 0325 2024433)
          </p>
          <p style="margin: 0 0 8px 0; color: #cbd5e1;">
            <strong>Lahore Freight Operations:</strong> Saggian Bypass &amp; Bhati Gate Stand, Lahore (Faisal: 0300 2024433)
          </p>
          <div style="padding-top: 10px; border-top: 1px solid #1e293b; font-size: 10px; color: #64748b;">
            Technical Support: Mehtab &bull; WhatsApp +92 314 7194861
            <br>
            <span style="font-style: italic; color: #475569;">Automated inquiry notification from SPD Logistics website.</span>
          </div>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>`;
}

function buildCorporateTextEmail(data: EmailRenderData): string {
  const isBroker = data.inquiryType === "BROKER";
  const waPrefillMessage = encodeURIComponent(
    "Assalam-o-Alaikum! We have received your inquiry regarding SPD Logistics. Thank you for contacting us. Our team will assist you shortly."
  );
  const waUrl = data.normalizedPhone ? `https://wa.me/${data.normalizedPhone}?text=${waPrefillMessage}` : "";

  return `===================================================
SPD LOGISTICS - ${isBroker ? "TRANSPORTER / BROKER REGISTRATION" : "CUSTOMER BOOKING INQUIRY"}
Super Pak Data Wale Goods Transport Co. - Est. 1996
===================================================

Reference ID:     ${data.refId}
Submission Time:  ${data.submittedAt} (PKT)
Inquiry Type:     ${isBroker ? "Transporter & Broker Registration" : "Customer Cargo Booking"}

Name:             ${data.fullName} ${data.companyName ? `(${data.companyName})` : ""}
Phone / WhatsApp: ${data.phone}
Email:            ${data.email || "N/A"}
${
  isBroker
    ? `Operating Base:   ${data.operatingCity || "Pakistan"}
Vehicle Category: ${data.vehicleType || "Commercial Fleet"}
Registration No:  ${data.vehicleRegNo || "N/A"}
Preferred Routes: ${data.preferredRoutes || "All Pakistan"}
Expected Terms:   ${data.expectedTerms || "Standard"}`
    : `Transport Lane:   ${data.originCity || "Karachi"} -> ${data.destinationCity || "Lahore"}
Cargo Commodity:  ${data.cargoDescription || "General Freight"}
Estimated Weight: ${data.estimatedWeight || "Full Truckload"}`
}

Message / Special Requirements:
${data.message || "No additional instructions provided."}

${waUrl ? `Direct WhatsApp Reply:\n${waUrl}\n` : ""}
---------------------------------------------------
Super Pak Data Wale Goods Transport Co. (Est. 1996)
Karachi: Hawksbay Truck Stand, Maripur Road (Hammad: 0325 2024433)
Lahore:  Saggian Bypass Stand (Faisal: 0300 2024433)
Official Dispatch: superpakdatawale@gmail.com
Technical Support: Mehtab (WhatsApp: +92 314 7194861)
Automated inquiry notification from SPD Logistics website.
===================================================`;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "127.0.0.1";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          delivered: false,
          message: "Bohat ziyada inquiries submit ho chuki hain. Baraye meherbani 10 minute baad dobara koshish karein.",
        },
        { status: 429 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, delivered: false, message: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    // 2. Honeypot Spam Protection
    if (body._hp_website || body._hp_company) {
      console.warn("[Contact Honeypot] Bot spam attempt detected.");
      return NextResponse.json(
        { success: false, delivered: false, message: "Spam submission rejected." },
        { status: 400 }
      );
    }

    // 3. Extract and Sanitize Inputs with Maximum Length Constraints
    const inquiryType: "CUSTOMER" | "BROKER" =
      (body.inquiryType || "CUSTOMER").toUpperCase() === "BROKER" ? "BROKER" : "CUSTOMER";
    const isBroker = inquiryType === "BROKER";

    const fullName = sanitizeHeader(String(body.fullName || body.name || body.brokerName || "").slice(0, 100));
    const companyName = sanitizeHeader(String(body.companyName || "").slice(0, 100));
    const phone = sanitizeHeader(String(body.phone || body.whatsapp || "").slice(0, 30));
    const email = sanitizeHeader(String(body.email || "").slice(0, 100));
    const originCity = sanitizeHeader(String(body.originCity || body.origin || "").slice(0, 100));
    const destinationCity = sanitizeHeader(String(body.destinationCity || body.destination || "").slice(0, 100));
    const cargoDescription = sanitizeHeader(String(body.cargoDescription || body.cargo || "").slice(0, 200));
    const estimatedWeight = sanitizeHeader(String(body.estimatedWeight || body.weight || "").slice(0, 50));
    const vehicleType = sanitizeHeader(String(body.vehicleType || "").slice(0, 100));
    const vehicleRegNo = sanitizeHeader(String(body.vehicleRegNo || body.vehicleNumber || "").slice(0, 40));
    const operatingCity = sanitizeHeader(String(body.operatingCity || "").slice(0, 100));
    const preferredRoutes = sanitizeHeader(String(body.preferredRoutes || "").slice(0, 200));
    const expectedTerms = sanitizeHeader(String(body.expectedTerms || body.terms || "").slice(0, 200));
    const message = String(body.message || body.notes || "").slice(0, 3000).trim();

    // 4. Server-Side Mandatory Field Validation
    if (!fullName) {
      return NextResponse.json(
        { success: false, delivered: false, message: "Baraye meherbani apna naam darj karein." },
        { status: 422 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      return NextResponse.json(
        { success: false, delivered: false, message: "Durust Pakistani WhatsApp / Mobile number darj karein (e.g. 0325 2024433)." },
        { status: 422 }
      );
    }

    if (!isBroker && (!originCity || !destinationCity)) {
      return NextResponse.json(
        { success: false, delivered: false, message: "Origin aur Destination shehar darj karna zaroori hai." },
        { status: 422 }
      );
    }

    if (isBroker && !operatingCity) {
      return NextResponse.json(
        { success: false, delivered: false, message: "Operating Base City darj karna zaroori hai." },
        { status: 422 }
      );
    }

    const refId = generateReferenceId();

    const submittedAt = new Date().toLocaleString("en-PK", {
      timeZone: "Asia/Karachi",
      dateStyle: "full",
      timeStyle: "medium",
    });

    // 5. Professional Subject Lines (Section 4 Specification)
    const subject = isBroker
      ? sanitizeHeader(`[FLEET REGISTRATION] SPD Logistics | ${fullName} | ${vehicleType || "Commercial Fleet"}`)
      : sanitizeHeader(`[NEW CUSTOMER INQUIRY] SPD Logistics | ${fullName} | ${originCity || "Origin"} → ${destinationCity || "Destination"}`);

    const renderData: EmailRenderData = {
      refId,
      inquiryType,
      fullName,
      companyName,
      phone,
      normalizedPhone,
      email: email || "superpakdatawale@gmail.com",
      originCity,
      destinationCity,
      cargoDescription,
      estimatedWeight,
      vehicleType,
      vehicleRegNo,
      operatingCity,
      preferredRoutes,
      expectedTerms,
      message,
      submittedAt,
    };

    const html = buildCorporateHtmlEmail(renderData);
    const text = buildCorporateTextEmail(renderData);

    // 6. Record Audit and Notification in DB (Safe / non-blocking)
    try {
      await prisma.auditLog.create({
        data: {
          action: isBroker ? "BROKER_REGISTRATION" : "BOOKING_INQUIRY",
          module: "CONTACT",
          details: `Inquiry ${refId} from ${fullName} (${phone}) - Target: superpakdatawale@gmail.com`,
        },
      });

      const { createSystemNotification } = await import("@/lib/notifications");
      await createSystemNotification({
        type: "CONTACT",
        title: isBroker ? `🚛 Broker: ${fullName} (${refId})` : `📦 Cargo Inquiry: ${fullName} (${refId})`,
        message: `${subject}: "${message || cargoDescription || 'Cargo inquiry'}" (Phone: ${phone})`,
        link: "/admin/notifications",
      });
    } catch (dbErr) {
      console.warn("[Contact DB Warning]", dbErr);
    }

    // 7. Transmit Email via Nodemailer to superpakdatawale@gmail.com
    const dispatchResult = await sendContactEmail({
      to: "superpakdatawale@gmail.com",
      fromName: fullName,
      fromEmail: email || "superpakdatawale@gmail.com",
      phone,
      message,
      submittedAt,
      replyTo: email || undefined,
      subject,
      html,
      text,
    });

    // 8. Honest Response Check: Do not claim success if email provider failed or is unconfigured
    if (!dispatchResult.success) {
      console.error(
        `[Contact API] Dispatch failed for ${refId} (${dispatchResult.method}): ${dispatchResult.message}`
      );

      const isUnconfigured = dispatchResult.method === "SMTP_UNCONFIGURED";

      return NextResponse.json(
        {
          success: false,
          delivered: false,
          refId,
          method: dispatchResult.method,
          message: "Maazrat, aap ki inquiry abhi send nahi ho saki. Aap dobara koshish karein ya WhatsApp ke zariye rabta karein.",
          setupNotice: isUnconfigured
            ? "Server Gmail credentials (SMTP_USER / SMTP_PASS) are not yet configured in environment."
            : undefined,
        },
        { status: isUnconfigured ? 503 : 502 }
      );
    }

    // 9. Verified Successful Delivery
    return NextResponse.json({
      success: true,
      delivered: true,
      refId,
      message: "Shukriya! Aap ki inquiry SPD Logistics ko bhej di gayi hai. Hamari team jald aap se rabta karegi.",
      recipient: "superpakdatawale@gmail.com",
      submittedAt,
    });
  } catch (error: any) {
    console.error("[Contact API Exception]", error);
    return NextResponse.json(
      {
        success: false,
        delivered: false,
        message: "Maazrat, aap ki inquiry abhi send nahi ho saki. Aap dobara koshish karein ya WhatsApp ke zariye rabta karein.",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
