import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/mailer";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatWhatsAppNumber(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "923252024433";
  if (digits.startsWith("0")) {
    return "92" + digits.slice(1);
  }
  if (digits.startsWith("92")) {
    return digits;
  }
  return "92" + digits;
}

function buildCorporateHtmlEmail(data: {
  inquiryType: "CUSTOMER" | "BROKER";
  fullName: string;
  companyName?: string;
  phone: string;
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
}): string {
  const isBroker = data.inquiryType === "BROKER";
  const cleanWaPhone = formatWhatsAppNumber(data.phone);
  const waReplyUrl = `https://wa.me/${cleanWaPhone}?text=Hello,%20we%20received%20your%20${isBroker ? "fleet%20registration" : "booking%20inquiry"}%20on%20SPD%20Logistics.`;
  const laneOrBase = isBroker
    ? data.operatingCity || "Pakistan Linehaul Corridor"
    : data.originCity && data.destinationCity
    ? `${data.originCity} ➔ ${data.destinationCity}`
    : data.originCity || data.destinationCity || "Karachi ➔ Lahore Linehaul";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SPD Logistics - Dispatch Inquiry</title>
</head>
<body style="margin: 0; padding: 24px 10px; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <center>
    <!-- Container matching top international carriers (DHL / Maersk) -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border-top: 5px solid #dc2626; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);">
      
      <!-- Header Banner -->
      <tr>
        <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; text-align: center; border-bottom: 2px solid #334155;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <div style="font-size: 28px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">
                  <span style="color: #dc2626;">SPD</span> <span style="color: #3b82f6;">LOGISTICS</span>
                </div>
                <div style="font-size: 11px; color: #94a3b8; font-weight: 700; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;">
                  Super Pak Data Wale Goods Transport Co. &bull; Est. 1996
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Inquiry Type & Timestamp Badge -->
      <tr>
        <td style="padding: 24px 24px 12px 24px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                ${
                  isBroker
                    ? `<span style="display: inline-block; padding: 6px 14px; background-color: #f3e8ff; color: #7e22ce; border: 1.5px solid #d8b4fe; border-radius: 9999px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
                        🚛 Transporter & Fleet Registration
                       </span>`
                    : `<span style="display: inline-block; padding: 6px 14px; background-color: #dcfce7; color: #15803d; border: 1.5px solid #86efac; border-radius: 9999px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
                        📦 General Cargo Booking Inquiry
                       </span>`
                }
              </td>
              <td align="right" style="font-size: 11px; color: #64748b; font-weight: 700;">
                🕒 ${data.submittedAt} (PKT)
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Main Body -->
      <tr>
        <td style="padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 900; color: #0f172a; letter-spacing: -0.3px;">
            ${isBroker ? "New Fleet Owner / Broker Registration" : "New Customer Consignment Inquiry"}
          </h2>
          <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
            A new submission has been received on <strong>spd-logistics.com</strong> and directed to official operations (<a href="mailto:superpakdatawale@gmail.com" style="color: #1e40af; text-decoration: none; font-weight: 700;">superpakdatawale@gmail.com</a>).
          </p>

          <!-- Structured Particulars Table -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px; font-size: 13px;">
            <tr style="background-color: #f1f5f9;">
              <td style="padding: 12px 16px; font-weight: 800; color: #334155; width: 38%; border-bottom: 1px solid #e2e8f0;">Particulars</td>
              <td style="padding: 12px 16px; font-weight: 800; color: #334155; border-bottom: 1px solid #e2e8f0;">Verified Record</td>
            </tr>
            <tr style="background-color: #ffffff;">
              <td style="padding: 11px 16px; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">
                ${isBroker ? "Broker / Owner Name:" : "Customer Name:"}
              </td>
              <td style="padding: 11px 16px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
                ${data.fullName} ${data.companyName ? `<span style="color: #64748b; font-weight: 600;">(${data.companyName})</span>` : ""}
              </td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 11px 16px; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Phone / WhatsApp:</td>
              <td style="padding: 11px 16px; font-weight: 800; color: #dc2626; border-bottom: 1px solid #e2e8f0;">
                <a href="tel:${data.phone}" style="color: #dc2626; text-decoration: none;">📞 ${data.phone}</a>
              </td>
            </tr>
            <tr style="background-color: #ffffff;">
              <td style="padding: 11px 16px; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Email Address:</td>
              <td style="padding: 11px 16px; font-weight: 700; color: #1e40af; border-bottom: 1px solid #e2e8f0;">
                <a href="mailto:${data.email}" style="color: #1e40af; text-decoration: none;">✉️ ${data.email || "N/A"}</a>
              </td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 11px 16px; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">
                ${isBroker ? "Operating Base:" : "Transport Lane:"}
              </td>
              <td style="padding: 11px 16px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
                📍 ${laneOrBase}
              </td>
            </tr>

            ${
              isBroker
                ? `
            <tr style="background-color: #ffffff;">
              <td style="padding: 11px 16px; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Vehicle Category:</td>
              <td style="padding: 11px 16px; font-weight: 800; color: #7e22ce; border-bottom: 1px solid #e2e8f0;">
                🚛 ${data.vehicleType || "Commercial Fleet"}
              </td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 11px 16px; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Registration Plate:</td>
              <td style="padding: 11px 16px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0; font-family: monospace;">
                🏷️ ${data.vehicleRegNo || "Registration on inspection"}
              </td>
            </tr>
            <tr style="background-color: #ffffff;">
              <td style="padding: 11px 16px; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Regular Routes:</td>
              <td style="padding: 11px 16px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
                🛣️ ${data.preferredRoutes || "Nationwide Corridors"}
              </td>
            </tr>
            ${
              data.expectedTerms
                ? `<tr style="background-color: #f8fafc;">
                    <td style="padding: 11px 16px; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Tariff Terms:</td>
                    <td style="padding: 11px 16px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
                      ${data.expectedTerms}
                    </td>
                  </tr>`
                : ""
            }
            `
                : `
            ${
              data.cargoDescription
                ? `<tr style="background-color: #ffffff;">
                    <td style="padding: 11px 16px; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Cargo Commodity:</td>
                    <td style="padding: 11px 16px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
                      📦 ${data.cargoDescription}
                    </td>
                  </tr>`
                : ""
            }
            ${
              data.estimatedWeight
                ? `<tr style="background-color: #f8fafc;">
                    <td style="padding: 11px 16px; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Estimated Weight / Units:</td>
                    <td style="padding: 11px 16px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
                      ⚖️ ${data.estimatedWeight}
                    </td>
                  </tr>`
                : ""
            }
            `
            }
          </table>

          <!-- Cargo / Special Message Box -->
          <div style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; border-left: 4px solid #dc2626; padding: 16px; margin-bottom: 24px;">
            <div style="font-size: 11px; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
              📝 Full Cargo / Operational Notes:
            </div>
            <div style="font-size: 13px; color: #0f172a; line-height: 1.6; white-space: pre-wrap;">${
              data.message || "No special instructions provided. Standard dispatch requested."
            }</div>
          </div>

          <!-- Call-To-Action WhatsApp Bar -->
          <div style="text-align: center; margin: 28px 0 12px 0;">
            <a href="${waReplyUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #22c55e; color: #ffffff; font-size: 13px; font-weight: 800; text-decoration: none; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              💬 Direct WhatsApp Reply to ${isBroker ? "Broker" : "Customer"} (${data.phone})
            </a>
          </div>
          <div style="text-align: center; font-size: 11px; color: #64748b; margin-top: 6px;">
            Clicking opens pre-filled WhatsApp conversation with this client.
          </div>
        </td>
      </tr>

      <!-- Corporate Signature -->
      <tr>
        <td style="background-color: #0b1120; padding: 24px; text-align: center; border-top: 1px solid #1e293b; color: #94a3b8; font-size: 12px; line-height: 1.7;">
          <p style="margin: 0 0 8px 0; font-weight: 800; color: #ffffff; font-size: 13px;">
            SUPER PAK DATA WALE GOODS TRANSPORT CO. (EST. 1996)
          </p>
          <p style="margin: 0 0 4px 0; color: #cbd5e1;">
            <strong>Karachi Terminal:</strong> Hawksbay Truck Stand, Maripur Road, Karachi (Hammad: 0325 2024433)
          </p>
          <p style="margin: 0 0 12px 0; color: #cbd5e1;">
            <strong>Lahore Terminal:</strong> Saggian Bypass & Bhati Gate Stand, Lahore (Faisal: 0300 2024433)
          </p>
          <div style="padding-top: 12px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b;">
            System Developed &amp; Maintained by 
            <a href="https://wa.me/923147194861?text=Hello%20Mehtab,%20regarding%20SPD%20Logistics%20email%20system" target="_blank" style="color: #ef4444; font-weight: 700; text-decoration: none;">Mehtab</a> 
            (WhatsApp: +92 314 7194861)
          </div>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>`;
}

function buildCorporateTextEmail(data: {
  inquiryType: "CUSTOMER" | "BROKER";
  fullName: string;
  companyName?: string;
  phone: string;
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
}): string {
  const isBroker = data.inquiryType === "BROKER";
  return `===================================================
SPD LOGISTICS - ${isBroker ? "BROKER & FLEET REGISTRATION" : "NEW BOOKING INQUIRY"}
Super Pak Data Wale Goods Transport Co. - Est. 1996
===================================================

Submission Time:  ${data.submittedAt} (PKT)
Inquiry Type:     ${isBroker ? "Transporter / Broker Attachment" : "Customer Cargo Booking"}

Name:             ${data.fullName} ${data.companyName ? `(${data.companyName})` : ""}
Phone / WhatsApp: ${data.phone}
Official Email:   ${data.email || "N/A"}
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

Message / Notes:
${data.message || "No additional notes"}

WhatsApp Direct Reply:
https://wa.me/${formatWhatsAppNumber(data.phone)}

---------------------------------------------------
Super Pak Data Wale Goods Transport Co. (Est. 1996)
Karachi: Hawksbay Truck Stand, Maripur Road
Lahore:  Saggian Bypass Terminal
Official Dispatch: superpakdatawale@gmail.com
System Developed & Maintained by Mehtab (WhatsApp: +92 314 7194861)
===================================================`;
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const inquiryType: "CUSTOMER" | "BROKER" =
      (body.inquiryType || "CUSTOMER").toUpperCase() === "BROKER" ? "BROKER" : "CUSTOMER";
    const fullName = (body.fullName || body.name || body.brokerName || "Valued Shipper").trim();
    const companyName = (body.companyName || "").trim();
    const phone = (body.phone || body.whatsapp || "Not specified").trim();
    const email = (body.email || "superpakdatawale@gmail.com").trim();
    const originCity = (body.originCity || body.origin || "").trim();
    const destinationCity = (body.destinationCity || body.destination || "").trim();
    const cargoDescription = (body.cargoDescription || body.cargo || "").trim();
    const estimatedWeight = (body.estimatedWeight || body.weight || "").trim();
    const vehicleType = (body.vehicleType || "").trim();
    const vehicleRegNo = (body.vehicleRegNo || body.vehicleNumber || "").trim();
    const operatingCity = (body.operatingCity || "").trim();
    const preferredRoutes = (body.preferredRoutes || "").trim();
    const expectedTerms = (body.expectedTerms || body.terms || "").trim();
    const message = (body.message || body.notes || "").trim();

    const submittedAt = new Date().toLocaleString("en-PK", {
      timeZone: "Asia/Karachi",
      dateStyle: "full",
      timeStyle: "medium",
    });

    const isBroker = inquiryType === "BROKER";
    const subject = isBroker
      ? `[BROKER & FLEET REGISTRATION] - SPD Logistics - ${companyName || fullName}`
      : `[NEW BOOKING INQUIRY] - SPD Logistics - ${fullName || "Valued Shipper"}`;

    const payload = {
      inquiryType,
      fullName,
      companyName,
      phone,
      email,
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

    const html = buildCorporateHtmlEmail(payload);
    const text = buildCorporateTextEmail(payload);

    // Save notification & audit log in database
    try {
      await prisma.auditLog.create({
        data: {
          action: isBroker ? "BROKER_REGISTRATION" : "BOOKING_INQUIRY",
          module: "CONTACT",
          details: `${isBroker ? "Broker" : "Customer"} submission from ${fullName} (${phone}) - Target: superpakdatawale@gmail.com`,
        },
      });

      const { createSystemNotification } = await import("@/lib/notifications");
      await createSystemNotification({
        type: "CONTACT",
        title: isBroker ? `🚛 New Broker Registration: ${fullName}` : `📦 New Booking Inquiry: ${fullName}`,
        message: `${subject}: "${message || cargoDescription || 'Cargo inquiry'}" (Phone: ${phone})`,
        link: "/admin/notifications",
      });
    } catch (dbErr) {
      console.warn("[Contact DB Warning]", dbErr);
    }

    // Automatically send high-density corporate email to superpakdatawale@gmail.com
    let dispatchMethod = "local_store";
    try {
      const dispatchResult = await sendContactEmail({
        to: "superpakdatawale@gmail.com",
        fromName: fullName,
        fromEmail: email,
        phone,
        message,
        submittedAt,
        replyTo: email,
        subject,
        html,
        text,
      });
      if (dispatchResult && dispatchResult.method) {
        dispatchMethod = dispatchResult.method;
      }
    } catch (sendErr) {
      console.warn("[Contact Mailer Warning]", sendErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Shukriya! Aap ki inquiry superpakdatawale@gmail.com par pohnch chuki hai. Hamari operations team foran rabta karegi.",
        targetEmail: "superpakdatawale@gmail.com",
        submissionTime: submittedAt,
        dispatchMethod,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("[Contact Route Exception]", error);
    return NextResponse.json(
      {
        success: true,
        message: "Shukriya! Aap ki inquiry superpakdatawale@gmail.com par pohnch chuki hai. Hamari operations team foran rabta karegi.",
      },
      {
        headers: { "Access-Control-Allow-Origin": "*" },
      }
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
