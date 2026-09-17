/**
 * SPD Logistics — Premium Corporate HTML Email Template Generator
 * Super Pak Data Goods Transport Co. Est. 1996
 * Dispatch Target: superpakdatawale@gmail.com
 */

export const SPD_COMPANY_INFO = {
  name: "Super Pak Data Goods Transport Co.",
  shortName: "SPD Logistics",
  est: "1996",
  email: "superpakdatawale@gmail.com",
  website: "https://spdlogistics.com",
  logoUrl: "https://spdlogistics.com/images/spd-logo.jpg",
  mdName: "Hammad Faisal Bhatti (MD)",
  mdPhone: "0325 2024433",
  ceoName: "Faisal Hussain Bhatti (Founder / CEO)",
  ceoPhone: "0300 2024433",
  karachiHub: "Plot No 9, Gate 1, Street 4 Truck Stand, Hawksbay Rd, Karachi",
  lahoreHub: "Central Punjab Freight Terminal, Badami Bagh / Lahore",
  whatsappUrl: "https://wa.me/923252024433",
};

export interface ContactEmailPayload {
  name: string;
  phone: string;
  email: string;
  subject?: string;
  message: string;
  submittedAt?: string;
}

export interface CustomerReplyEmailOptions {
  customerName: string;
  customerEmail: string;
  subject: string;
  replyMessage: string;
  originalMessage?: string;
  agentName?: string;
}

export interface BiltyEmailOptions {
  customerName: string;
  biltyNumber: string;
  trackingId: string;
  bookingDate?: string;
  sender: string;
  receiver: string;
  senderPhone?: string;
  receiverPhone?: string;
  origin: string;
  destination: string;
  weight?: string | number;
  packages?: string | number;
  packageDetails?: string;
  totalAmount?: number;
  paidAmount?: number;
  remainingBalance?: number;
  shipmentStatus?: string;
  notes?: string;
}

export interface TrackingEmailOptions {
  customerName?: string;
  biltyNumber: string;
  trackingId: string;
  currentStatus: string;
  statusDate?: string;
  origin?: string;
  destination?: string;
  notes?: string;
}

export function generateConsistentEmailFooterHtml(): string {
  const currentYear = new Date().getFullYear();
  return `
    <!-- SPD LOGISTICS CONSISTENT EMAIL FOOTER -->
    <tr>
      <td style="background-color: #070B14; padding: 36px 32px 28px 32px; color: #94A3B8; text-align: center; border-top: 2px solid #1E293B;">
        
        <!-- Official Logo & Branding -->
        <div style="display: inline-block; padding: 8px 18px; background: rgba(255,255,255,0.06); border-radius: 14px; border: 1.5px solid rgba(255,255,255,0.12); margin-bottom: 14px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
            <tr>
              <td style="background: #DC2626; color: #FFFFFF; font-size: 16px; font-weight: 900; padding: 4px 10px; border-radius: 6px; letter-spacing: 1.5px;">
                SPD
              </td>
              <td style="padding-left: 10px; font-size: 16px; font-weight: 900; color: #FFFFFF; letter-spacing: 1px;">
                LOGISTICS
              </td>
            </tr>
          </table>
        </div>

        <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 900; color: #FFFFFF; letter-spacing: 0.5px;">
          ${SPD_COMPANY_INFO.shortName}
        </p>
        <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 800; color: #93C5FD; text-transform: uppercase; letter-spacing: 1px;">
          ${SPD_COMPANY_INFO.name} Est. ${SPD_COMPANY_INFO.est}
        </p>
        <p style="margin: 0 0 16px 0; font-size: 12px; color: #CBD5E1; font-weight: 700;">
          Karachi Hub &bull; Lahore Hub &bull; Nationwide Pakistan Line-Haul
        </p>

        <!-- Official Directory & Hub Details -->
        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px 16px; margin-bottom: 18px; text-align: left; font-size: 12px; line-height: 1.7; color: #CBD5E1;">
          <p style="margin: 0 0 4px 0;">&bull; <strong>${SPD_COMPANY_INFO.mdName}:</strong> <a href="tel:${SPD_COMPANY_INFO.mdPhone.replace(/\s+/g, '')}" style="color: #F87171; font-weight: 700; text-decoration: none;">${SPD_COMPANY_INFO.mdPhone}</a></p>
          <p style="margin: 0 0 4px 0;">&bull; <strong>${SPD_COMPANY_INFO.ceoName}:</strong> <a href="tel:${SPD_COMPANY_INFO.ceoPhone.replace(/\s+/g, '')}" style="color: #60A5FA; font-weight: 700; text-decoration: none;">${SPD_COMPANY_INFO.ceoPhone}</a></p>
          <p style="margin: 0 0 4px 0;">&bull; <strong>Official Dispatch:</strong> <a href="mailto:${SPD_COMPANY_INFO.email}" style="color: #93C5FD; font-weight: 700; text-decoration: none;">${SPD_COMPANY_INFO.email}</a></p>
          <p style="margin: 0 0 4px 0;">&bull; <strong>Karachi Hub:</strong> ${SPD_COMPANY_INFO.karachiHub}</p>
          <p style="margin: 0;">&bull; <strong>Lahore Hub:</strong> ${SPD_COMPANY_INFO.lahoreHub}</p>
        </div>

        <!-- Action Links in Footer -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 16px auto;">
          <tr>
            <td style="padding: 4px 6px;">
              <a href="${SPD_COMPANY_INFO.website}" target="_blank" style="display: inline-block; padding: 8px 14px; background-color: #1E40AF; color: #FFFFFF; font-size: 11px; font-weight: 800; border-radius: 8px; text-decoration: none;">
                &#127760; Website
              </a>
            </td>
            <td style="padding: 4px 6px;">
              <a href="${SPD_COMPANY_INFO.website}/contact" target="_blank" style="display: inline-block; padding: 8px 14px; background-color: #DC2626; color: #FFFFFF; font-size: 11px; font-weight: 800; border-radius: 8px; text-decoration: none;">
                &#9993; Contact Us
              </a>
            </td>
            <td style="padding: 4px 6px;">
              <a href="${SPD_COMPANY_INFO.whatsappUrl}" target="_blank" style="display: inline-block; padding: 8px 14px; background-color: #25D366; color: #FFFFFF; font-size: 11px; font-weight: 800; border-radius: 8px; text-decoration: none;">
                &#128172; WhatsApp
              </a>
            </td>
          </tr>
        </table>

        <!-- Copyright & Automated Notice -->
        <p style="margin: 0; font-size: 11px; color: #64748B; line-height: 1.5;">
          &copy; 1996&ndash;${currentYear} ${SPD_COMPANY_INFO.name} All Rights Reserved.<br />
          Official Corporate Logistics Notification &bull; Verified Dispatch System
        </p>

      </td>
    </tr>
  `;
}

export function generateConsistentEmailFooterText(): string {
  const currentYear = new Date().getFullYear();
  return `---------------------------------------------------
${SPD_COMPANY_INFO.shortName} - ${SPD_COMPANY_INFO.name} Est. ${SPD_COMPANY_INFO.est}
Karachi Hub | Lahore Hub | Nationwide Pakistan
Official Dispatch: ${SPD_COMPANY_INFO.email}
Website: ${SPD_COMPANY_INFO.website}
Managing Director: ${SPD_COMPANY_INFO.mdName} (${SPD_COMPANY_INFO.mdPhone})
Founder / CEO: ${SPD_COMPANY_INFO.ceoName} (${SPD_COMPANY_INFO.ceoPhone})
Karachi: ${SPD_COMPANY_INFO.karachiHub}
Lahore: ${SPD_COMPANY_INFO.lahoreHub}
WhatsApp: ${SPD_COMPANY_INFO.whatsappUrl}
(c) 1996-${currentYear} ${SPD_COMPANY_INFO.name}`;
}

export function generateNewContactEmailHtml(payload: ContactEmailPayload): string {
  const {
    name,
    phone,
    email,
    subject = "New Contact Form Message - SPD Logistics",
    message,
    submittedAt,
  } = payload;

  const dateStr =
    submittedAt ||
    new Date().toLocaleString("en-PK", {
      timeZone: "Asia/Karachi",
      dateStyle: "full",
      timeStyle: "medium",
    });

  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const waUrl = "https://wa.me/923252024433?text=" + encodeURIComponent("Assalam-o-Alaikum Hammad Sahab, regarding inquiry from " + name + " (" + phone + "): " + message);
  const replyMailto = "mailto:" + email + "?subject=" + encodeURIComponent("Re: " + subject + " - SPD Logistics");

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Contact Form Message - SPD Logistics</title>
  <style>
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body { margin: 0 !important; padding: 0 !important; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse !important; }
    img { border: 0; height: auto; outline: none; }
    a { text-decoration: none; }
  </style>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0F172A; color: #1E293B;">
  <center style="width: 100%; background-color: #0F172A;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 650px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #1E293B;">
      <tr>
        <td style="background: linear-gradient(135deg, #1E3A8A 0%, #1E40AF 60%, #DC2626 100%); padding: 12px 24px; text-align: center;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="left" style="font-size: 11px; font-weight: 800; color: #FFFFFF; letter-spacing: 1.5px; text-transform: uppercase;">
                ${SPD_COMPANY_INFO.name} &bull; EST. ${SPD_COMPANY_INFO.est}
              </td>
              <td align="right" style="font-size: 10px; font-weight: 700; color: #E0E7FF; letter-spacing: 1px; text-transform: uppercase;">
                KARACHI &bull; LAHORE
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 28px 28px 18px 28px; text-align: center; background-color: #FFFFFF;">
          <img 
            src="${SPD_COMPANY_INFO.logoUrl}" 
            alt="SPD Logo" 
            width="72" 
            height="72" 
            style="border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 2px; background: #FFFFFF; display: block; margin: 0 auto 12px auto;" 
          />
          <div style="font-size: 15px; font-weight: 900; color: #1E40AF; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 2px;">
            ${SPD_COMPANY_INFO.shortName}
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #DC2626; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
            ${SPD_COMPANY_INFO.name} Est. ${SPD_COMPANY_INFO.est}
          </div>
          <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 900; color: #0F172A; letter-spacing: -0.5px;">
            New Contact Form Message
          </h1>
          <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 500; color: #475569;">
            Received from the official website contact form. Clicking <strong>Reply</strong> responds directly to the customer.
          </p>
          <div style="display: inline-block; padding: 5px 14px; background-color: #EFF6FF; border-radius: 9999px; border: 1px solid #BFDBFE;">
            <span style="color: #1E40AF; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
              &#9993; Reply-To: ${email}
            </span>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 28px;">
          <div style="height: 2px; background: linear-gradient(to right, #1E40AF 0%, #DC2626 50%, #1E40AF 100%);"></div>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px 28px 12px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; border-radius: 14px; border: 1.5px solid #E2E8F0; overflow: hidden; margin-bottom: 18px;">
            <tr>
              <td style="padding: 12px 18px; background-color: #F1F5F9; border-bottom: 1.5px solid #E2E8F0;">
                <span style="font-size: 12px; font-weight: 900; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">
                  &#128100; Sender / Customer Details
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="36%" style="font-size: 12px; font-weight: 800; color: #64748B; text-transform: uppercase;">Customer Name:</td>
                    <td width="64%" style="font-size: 15px; font-weight: 900; color: #0F172A;">${name}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="36%" style="font-size: 12px; font-weight: 800; color: #64748B; text-transform: uppercase;">Phone / WhatsApp:</td>
                    <td width="64%" style="font-size: 15px; font-weight: 900; color: #DC2626;">
                      <a href="tel:${cleanPhone}" style="color: #DC2626; text-decoration: none;">&#128222; ${phone}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="36%" style="font-size: 12px; font-weight: 800; color: #64748B; text-transform: uppercase;">Customer Email:</td>
                    <td width="64%" style="font-size: 14px; font-weight: 800; color: #1E40AF;">
                      <a href="mailto:${email}" style="color: #1E40AF; text-decoration: none;">&#9993; ${email}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="36%" style="font-size: 12px; font-weight: 800; color: #64748B; text-transform: uppercase;">Subject:</td>
                    <td width="64%" style="font-size: 14px; font-weight: 700; color: #334155;">${subject}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 18px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="36%" style="font-size: 12px; font-weight: 800; color: #64748B; text-transform: uppercase;">Submitted At:</td>
                    <td width="64%" style="font-size: 12px; font-weight: 700; color: #475569;">${dateStr} (PKT)</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <div style="background-color: #FFFFFF; border-radius: 14px; border: 1.5px solid #E2E8F0; padding: 18px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 900; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">
              &#128221; Full Customer Message:
            </p>
            <div style="padding: 16px; background-color: #F8FAFC; border-radius: 10px; border-left: 4px solid #DC2626; font-size: 14px; line-height: 1.6; color: #0F172A; white-space: pre-wrap; font-family: inherit;">
${message}
            </div>
          </div>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
            <tr>
              <td align="center" style="padding-bottom: 10px;">
                <a href="${replyMailto}" style="display: block; width: 100%; max-width: 420px; padding: 14px 20px; background-color: #DC2626; color: #FFFFFF; font-size: 14px; font-weight: 900; text-align: center; border-radius: 12px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">
                  &#9993; Reply Directly to Customer (${email})
                </a>
              </td>
            </tr>
            <tr>
              <td align="center">
                <a href="${waUrl}" target="_blank" style="display: block; width: 100%; max-width: 420px; padding: 14px 20px; background-color: #25D366; color: #FFFFFF; font-size: 14px; font-weight: 900; text-align: center; border-radius: 12px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">
                  &#128172; Chat on WhatsApp (${phone})
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${generateConsistentEmailFooterHtml()}
    </table>
  </center>
</body>
</html>`;
}

export function generateNewContactEmailText(payload: ContactEmailPayload): string {
  const {
    name,
    phone,
    email,
    subject = "New Contact Form Message - SPD Logistics",
    message,
    submittedAt,
  } = payload;

  const dateStr =
    submittedAt ||
    new Date().toLocaleString("en-PK", {
      timeZone: "Asia/Karachi",
      dateStyle: "full",
      timeStyle: "medium",
    });

  return `===================================================
${SPD_COMPANY_INFO.shortName} - ${SPD_COMPANY_INFO.name} Est. ${SPD_COMPANY_INFO.est}
NEW CONTACT FORM MESSAGE
Official Dispatch: ${SPD_COMPANY_INFO.email}
Reply-To: ${email}
===================================================

SENDER / CUSTOMER DETAILS:
Customer Name:      ${name}
Phone / WhatsApp:   ${phone}
Customer Email:     ${email}
Subject:            ${subject}
Submitted At:       ${dateStr} (PKT)

FULL CUSTOMER MESSAGE:
---------------------------------------------------
${message}
---------------------------------------------------

To reply directly to customer, respond to this email or send to: ${email}
Direct WhatsApp: ${phone}

${generateConsistentEmailFooterText()}`;
}

export function generateCustomerReplyEmailHtml(options: CustomerReplyEmailOptions): string {
  const { customerName, customerEmail, subject, replyMessage, originalMessage, agentName } = options;
  const signatureName = agentName || "SPD Logistics Dispatch Team";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject} - SPD Logistics</title>
  <style>
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body { margin: 0 !important; padding: 0 !important; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse !important; }
    img { border: 0; height: auto; outline: none; }
    a { text-decoration: none; }
  </style>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0F172A; color: #1E293B;">
  <center style="width: 100%; background-color: #0F172A;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 650px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #1E293B;">
      <tr>
        <td style="background: linear-gradient(135deg, #1E3A8A 0%, #1E40AF 60%, #DC2626 100%); padding: 12px 24px; text-align: center;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="left" style="font-size: 11px; font-weight: 800; color: #FFFFFF; letter-spacing: 1.5px; text-transform: uppercase;">
                ${SPD_COMPANY_INFO.name} &bull; EST. ${SPD_COMPANY_INFO.est}
              </td>
              <td align="right" style="font-size: 10px; font-weight: 700; color: #E0E7FF; letter-spacing: 1px; text-transform: uppercase;">
                CUSTOMER SERVICES
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 28px 28px 18px 28px; text-align: center; background-color: #FFFFFF;">
          <img 
            src="${SPD_COMPANY_INFO.logoUrl}" 
            alt="SPD Logo" 
            width="72" 
            height="72" 
            style="border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 2px; background: #FFFFFF; display: block; margin: 0 auto 12px auto;" 
          />
          <div style="font-size: 15px; font-weight: 900; color: #1E40AF; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 2px;">
            ${SPD_COMPANY_INFO.shortName}
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #DC2626; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
            ${SPD_COMPANY_INFO.name} Est. ${SPD_COMPANY_INFO.est}
          </div>
          <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 900; color: #0F172A; letter-spacing: -0.5px;">
            ${subject}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 28px;">
          <div style="height: 2px; background: linear-gradient(to right, #1E40AF 0%, #DC2626 50%, #1E40AF 100%);"></div>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px 28px 20px 28px;">
          <p style="margin: 0 0 16px 0; font-size: 15px; color: #0F172A; font-weight: 600;">
            Dear <strong>${customerName}</strong>,
          </p>
          <div style="font-size: 14.5px; line-height: 1.7; color: #334155; margin-bottom: 24px; white-space: pre-wrap;">
${replyMessage}
          </div>
          ${originalMessage ? `
          <div style="background-color: #F8FAFC; border-radius: 12px; border-left: 4px solid #94A3B8; padding: 14px 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase;">Your Previous Inquiry:</p>
            <p style="margin: 0; font-size: 13px; color: #475569; font-style: italic;">"${originalMessage}"</p>
          </div>` : ""}
          <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0F172A;">
            Best regards,
          </p>
          <p style="margin: 0 0 20px 0; font-size: 13px; color: #DC2626; font-weight: 800;">
            ${signatureName}
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
            <tr>
              <td style="padding: 4px 6px;">
                <a href="${SPD_COMPANY_INFO.website}" target="_blank" style="display: inline-block; padding: 12px 20px; background-color: #1E40AF; color: #FFFFFF; font-size: 13px; font-weight: 800; border-radius: 10px; text-decoration: none;">
                  &#127760; Visit Website
                </a>
              </td>
              <td style="padding: 4px 6px;">
                <a href="${SPD_COMPANY_INFO.website}/contact" target="_blank" style="display: inline-block; padding: 12px 20px; background-color: #DC2626; color: #FFFFFF; font-size: 13px; font-weight: 800; border-radius: 10px; text-decoration: none;">
                  &#9993; Contact Us
                </a>
              </td>
              <td style="padding: 4px 6px;">
                <a href="${SPD_COMPANY_INFO.whatsappUrl}" target="_blank" style="display: inline-block; padding: 12px 20px; background-color: #25D366; color: #FFFFFF; font-size: 13px; font-weight: 800; border-radius: 10px; text-decoration: none;">
                  &#128172; WhatsApp
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${generateConsistentEmailFooterHtml()}
    </table>
  </center>
</body>
</html>`;
}

export function generateCustomerReplyEmailText(options: CustomerReplyEmailOptions): string {
  const { customerName, subject, replyMessage, originalMessage, agentName } = options;
  return `===================================================
${SPD_COMPANY_INFO.shortName} - ${subject}
===================================================

Dear ${customerName},

${replyMessage}

${originalMessage ? `\nYour Previous Inquiry:\n"${originalMessage}"\n` : ""}

Best regards,
${agentName || "SPD Logistics Dispatch Team"}
Official Dispatch: ${SPD_COMPANY_INFO.email}

${generateConsistentEmailFooterText()}`;
}

export function generateBiltyEmailHtml(options: BiltyEmailOptions): string {
  const {
    customerName,
    biltyNumber,
    trackingId,
    bookingDate = new Date().toLocaleDateString("en-PK"),
    sender,
    receiver,
    senderPhone = "N/A",
    receiverPhone = "N/A",
    origin,
    destination,
    weight = "Standard Freight",
    packages = "1",
    packageDetails = "General Cargo",
    totalAmount,
    paidAmount,
    remainingBalance,
    shipmentStatus = "BOOKED",
    notes,
  } = options;

  const trackingUrl = SPD_COMPANY_INFO.website + "/tracking?id=" + encodeURIComponent(trackingId || biltyNumber);
  const biltyUrl = SPD_COMPANY_INFO.website + "/admin/bilty";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bilty Consignment #${biltyNumber} - SPD Logistics</title>
  <style>
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body { margin: 0 !important; padding: 0 !important; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse !important; }
    img { border: 0; height: auto; outline: none; }
    a { text-decoration: none; }
  </style>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0F172A; color: #1E293B;">
  <center style="width: 100%; background-color: #0F172A;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 650px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #1E293B;">
      <tr>
        <td style="background: linear-gradient(135deg, #1E3A8A 0%, #1E40AF 60%, #DC2626 100%); padding: 12px 24px; text-align: center;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="left" style="font-size: 11px; font-weight: 800; color: #FFFFFF; letter-spacing: 1.5px; text-transform: uppercase;">
                ${SPD_COMPANY_INFO.name} &bull; EST. ${SPD_COMPANY_INFO.est}
              </td>
              <td align="right" style="font-size: 10px; font-weight: 700; color: #E0E7FF; letter-spacing: 1px; text-transform: uppercase;">
                OFFICIAL BILTY VOUCHER
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 28px 28px 18px 28px; text-align: center; background-color: #FFFFFF;">
          <img 
            src="${SPD_COMPANY_INFO.logoUrl}" 
            alt="SPD Logo" 
            width="72" 
            height="72" 
            style="border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 2px; background: #FFFFFF; display: block; margin: 0 auto 12px auto;" 
          />
          <div style="font-size: 15px; font-weight: 900; color: #1E40AF; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 2px;">
            ${SPD_COMPANY_INFO.shortName}
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #DC2626; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
            Super Pak Data Goods Transport Co. Est. 1996
          </div>
          <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 900; color: #0F172A; letter-spacing: -0.5px;">
            Consignment Bilty #${biltyNumber}
          </h1>
          <div style="display: inline-block; padding: 5px 14px; background-color: #EFF6FF; border-radius: 9999px; border: 1px solid #BFDBFE;">
            <span style="color: #1E40AF; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
              Tracking ID: ${trackingId} &bull; Status: ${shipmentStatus.replace(/_/g, " ")}
            </span>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 28px;">
          <div style="height: 2px; background: linear-gradient(to right, #1E40AF 0%, #DC2626 50%, #1E40AF 100%);"></div>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px 28px 16px 28px;">
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #0F172A;">
            Valued Customer <strong>${customerName}</strong>, here are the official consignment details for your freight shipment:
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; border-radius: 14px; border: 1.5px solid #E2E8F0; overflow: hidden; margin-bottom: 20px;">
            <tr>
              <td width="38%" style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #64748B; background: #F1F5F9; border-bottom: 1px solid #E2E8F0;">Bilty Number:</td>
              <td width="62%" style="padding: 10px 14px; font-size: 14px; font-weight: 900; color: #0F172A; border-bottom: 1px solid #E2E8F0;">#${biltyNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #64748B; background: #F1F5F9; border-bottom: 1px solid #E2E8F0;">Tracking ID:</td>
              <td style="padding: 10px 14px; font-size: 14px; font-weight: 900; color: #1E40AF; border-bottom: 1px solid #E2E8F0;">${trackingId}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #64748B; background: #F1F5F9; border-bottom: 1px solid #E2E8F0;">Booking Date:</td>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #334155; border-bottom: 1px solid #E2E8F0;">${bookingDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #64748B; background: #F1F5F9; border-bottom: 1px solid #E2E8F0;">Route Corridor:</td>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 800; color: #DC2626; border-bottom: 1px solid #E2E8F0;">${origin} &rarr; ${destination}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #64748B; background: #F1F5F9; border-bottom: 1px solid #E2E8F0;">Sender (Shipper):</td>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #0F172A; border-bottom: 1px solid #E2E8F0;">${sender} (${senderPhone})</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #64748B; background: #F1F5F9; border-bottom: 1px solid #E2E8F0;">Receiver (Consignee):</td>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #0F172A; border-bottom: 1px solid #E2E8F0;">${receiver} (${receiverPhone})</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #64748B; background: #F1F5F9; border-bottom: 1px solid #E2E8F0;">Cargo Packages:</td>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #334155; border-bottom: 1px solid #E2E8F0;">${packages} units (${packageDetails})</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #64748B; background: #F1F5F9; border-bottom: 1px solid #E2E8F0;">Cargo Weight:</td>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #334155; border-bottom: 1px solid #E2E8F0;">${weight}</td>
            </tr>
            ${totalAmount !== undefined ? `
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #64748B; background: #F1F5F9; border-bottom: 1px solid #E2E8F0;">Freight / Charges:</td>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 900; color: #0F172A; border-bottom: 1px solid #E2E8F0;">
                Total: PKR ${totalAmount.toLocaleString()} 
                ${paidAmount !== undefined ? `| Paid: PKR ${paidAmount.toLocaleString()}` : ""}
                ${remainingBalance !== undefined ? `| Balance: PKR ${remainingBalance.toLocaleString()}` : ""}
              </td>
            </tr>` : ""}
            ${notes ? `
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #64748B; background: #F1F5F9;">Consignment Notes:</td>
              <td style="padding: 10px 14px; font-size: 12px; color: #475569;">${notes}</td>
            </tr>` : ""}
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
            <tr>
              <td align="center" style="padding-bottom: 10px;">
                <a href="${trackingUrl}" target="_blank" style="display: block; width: 100%; max-width: 420px; padding: 14px 20px; background-color: #DC2626; color: #FFFFFF; font-size: 14px; font-weight: 900; text-align: center; border-radius: 12px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">
                  &#128666; Track Shipment (${trackingId})
                </a>
              </td>
            </tr>
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 4px 6px;">
                      <a href="${biltyUrl}" target="_blank" style="display: inline-block; padding: 10px 16px; background-color: #1E40AF; color: #FFFFFF; font-size: 12px; font-weight: 800; border-radius: 10px; text-decoration: none;">
                        &#128196; View Bilty
                      </a>
                    </td>
                    <td style="padding: 4px 6px;">
                      <a href="${SPD_COMPANY_INFO.website}/contact" target="_blank" style="display: inline-block; padding: 10px 16px; background-color: #334155; color: #FFFFFF; font-size: 12px; font-weight: 800; border-radius: 10px; text-decoration: none;">
                        &#9993; Contact Us
                      </a>
                    </td>
                    <td style="padding: 4px 6px;">
                      <a href="${SPD_COMPANY_INFO.website}" target="_blank" style="display: inline-block; padding: 10px 16px; background-color: #475569; color: #FFFFFF; font-size: 12px; font-weight: 800; border-radius: 10px; text-decoration: none;">
                        &#127760; Visit Website
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${generateConsistentEmailFooterHtml()}
    </table>
  </center>
</body>
</html>`;
}

export function generateBiltyEmailText(options: BiltyEmailOptions): string {
  const {
    customerName,
    biltyNumber,
    trackingId,
    bookingDate = new Date().toLocaleDateString("en-PK"),
    sender,
    receiver,
    origin,
    destination,
    weight = "Standard Freight",
    packages = "1",
    totalAmount,
    paidAmount,
    remainingBalance,
    shipmentStatus = "BOOKED",
    notes,
  } = options;

  const trackingUrl = SPD_COMPANY_INFO.website + "/tracking?id=" + encodeURIComponent(trackingId || biltyNumber);

  return `===================================================
${SPD_COMPANY_INFO.shortName} - BILTY CONSIGNMENT #${biltyNumber}
===================================================

Customer:          ${customerName}
Bilty Number:      #${biltyNumber}
Tracking ID:       ${trackingId}
Booking Date:      ${bookingDate}
Route:             ${origin} -> ${destination}
Sender:            ${sender}
Receiver:          ${receiver}
Packages:          ${packages} pkg
Weight:            ${weight}
Status:            ${shipmentStatus}
${totalAmount !== undefined ? `Total Freight:     PKR ${totalAmount.toLocaleString()}\nPaid:              PKR ${(paidAmount || 0).toLocaleString()}\nBalance:           PKR ${(remainingBalance || 0).toLocaleString()}` : ""}
${notes ? `Notes:             ${notes}` : ""}

Track Online:
${trackingUrl}

${generateConsistentEmailFooterText()}`;
}

export function generateTrackingStatusEmailHtml(options: TrackingEmailOptions): string {
  const {
    customerName = "Valued Customer",
    biltyNumber,
    trackingId,
    currentStatus,
    statusDate = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
    origin = "Karachi",
    destination = "Lahore",
    notes,
  } = options;

  const trackingUrl = SPD_COMPANY_INFO.website + "/tracking?id=" + encodeURIComponent(trackingId || biltyNumber);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Shipment Status Update: #${biltyNumber} - SPD Logistics</title>
  <style>
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body { margin: 0 !important; padding: 0 !important; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse !important; }
    img { border: 0; height: auto; outline: none; }
    a { text-decoration: none; }
  </style>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0F172A; color: #1E293B;">
  <center style="width: 100%; background-color: #0F172A;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 650px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #1E293B;">
      <tr>
        <td style="background: linear-gradient(135deg, #1E3A8A 0%, #1E40AF 60%, #DC2626 100%); padding: 12px 24px; text-align: center;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="left" style="font-size: 11px; font-weight: 800; color: #FFFFFF; letter-spacing: 1.5px; text-transform: uppercase;">
                ${SPD_COMPANY_INFO.name} &bull; EST. ${SPD_COMPANY_INFO.est}
              </td>
              <td align="right" style="font-size: 10px; font-weight: 700; color: #E0E7FF; letter-spacing: 1px; text-transform: uppercase;">
                SHIPMENT TRACKING STATUS
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 28px 28px 18px 28px; text-align: center; background-color: #FFFFFF;">
          <img 
            src="${SPD_COMPANY_INFO.logoUrl}" 
            alt="SPD Logo" 
            width="72" 
            height="72" 
            style="border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 2px; background: #FFFFFF; display: block; margin: 0 auto 12px auto;" 
          />
          <div style="font-size: 15px; font-weight: 900; color: #1E40AF; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 2px;">
            ${SPD_COMPANY_INFO.shortName}
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #DC2626; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
            Super Pak Data Goods Transport Co. Est. 1996
          </div>
          <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 900; color: #0F172A; letter-spacing: -0.5px;">
            Shipment Status Update
          </h1>
          <div style="display: inline-block; padding: 6px 18px; background-color: #DC2626; color: #FFFFFF; border-radius: 9999px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">
            ${currentStatus.replace(/_/g, " ")}
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 28px;">
          <div style="height: 2px; background: linear-gradient(to right, #1E40AF 0%, #DC2626 50%, #1E40AF 100%);"></div>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px 28px 16px 28px;">
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #0F172A;">
            Hello <strong>${customerName}</strong>, your shipment has an operational status update:
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; border-radius: 14px; border: 1.5px solid #E2E8F0; overflow: hidden; margin-bottom: 20px;">
            <tr>
              <td width="38%" style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #64748B; background: #F1F5F9; border-bottom: 1px solid #E2E8F0;">Bilty Number:</td>
              <td width="62%" style="padding: 10px 14px; font-size: 14px; font-weight: 900; color: #0F172A; border-bottom: 1px solid #E2E8F0;">#${biltyNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #64748B; background: #F1F5F9; border-bottom: 1px solid #E2E8F0;">Tracking ID:</td>
              <td style="padding: 10px 14px; font-size: 14px; font-weight: 900; color: #1E40AF; border-bottom: 1px solid #E2E8F0;">${trackingId}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #64748B; background: #F1F5F9; border-bottom: 1px solid #E2E8F0;">Current Status:</td>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 900; color: #DC2626; border-bottom: 1px solid #E2E8F0;">${currentStatus.replace(/_/g, " ")}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #64748B; background: #F1F5F9; border-bottom: 1px solid #E2E8F0;">Status Date / Time:</td>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #334155; border-bottom: 1px solid #E2E8F0;">${statusDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #64748B; background: #F1F5F9; border-bottom: 1px solid #E2E8F0;">Route:</td>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #334155; border-bottom: 1px solid #E2E8F0;">${origin} &rarr; ${destination}</td>
            </tr>
            ${notes ? `
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #64748B; background: #F1F5F9;">Status Details:</td>
              <td style="padding: 10px 14px; font-size: 12px; color: #475569;">${notes}</td>
            </tr>` : ""}
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
            <tr>
              <td align="center" style="padding-bottom: 10px;">
                <a href="${trackingUrl}" target="_blank" style="display: block; width: 100%; max-width: 420px; padding: 14px 20px; background-color: #DC2626; color: #FFFFFF; font-size: 14px; font-weight: 900; text-align: center; border-radius: 12px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">
                  &#128666; Track Shipment Live (${trackingId})
                </a>
              </td>
            </tr>
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 4px 6px;">
                      <a href="${SPD_COMPANY_INFO.website}" target="_blank" style="display: inline-block; padding: 10px 16px; background-color: #1E40AF; color: #FFFFFF; font-size: 12px; font-weight: 800; border-radius: 10px; text-decoration: none;">
                        &#127760; Website
                      </a>
                    </td>
                    <td style="padding: 4px 6px;">
                      <a href="${SPD_COMPANY_INFO.website}/contact" target="_blank" style="display: inline-block; padding: 10px 16px; background-color: #334155; color: #FFFFFF; font-size: 12px; font-weight: 800; border-radius: 10px; text-decoration: none;">
                        &#9993; Contact Us
                      </a>
                    </td>
                    <td style="padding: 4px 6px;">
                      <a href="${SPD_COMPANY_INFO.whatsappUrl}" target="_blank" style="display: inline-block; padding: 10px 16px; background-color: #25D366; color: #FFFFFF; font-size: 12px; font-weight: 800; border-radius: 10px; text-decoration: none;">
                        &#128172; WhatsApp
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${generateConsistentEmailFooterHtml()}
    </table>
  </center>
</body>
</html>`;
}

export function generateTrackingStatusEmailText(options: TrackingEmailOptions): string {
  const {
    customerName = "Valued Customer",
    biltyNumber,
    trackingId,
    currentStatus,
    statusDate = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
    origin = "Karachi",
    destination = "Lahore",
    notes,
  } = options;

  const trackingUrl = SPD_COMPANY_INFO.website + "/tracking?id=" + encodeURIComponent(trackingId || biltyNumber);

  return `===================================================
${SPD_COMPANY_INFO.shortName} - SHIPMENT STATUS UPDATE
===================================================

Customer:          ${customerName}
Bilty Number:      #${biltyNumber}
Tracking ID:       ${trackingId}
Current Status:    ${currentStatus}
Status Date:       ${statusDate}
Route:             ${origin} -> ${destination}
${notes ? `Details:           ${notes}` : ""}

Track Live:
${trackingUrl}

${generateConsistentEmailFooterText()}`;
}

export const generateVipContactEmailHtml = generateNewContactEmailHtml;
export const generateVipContactEmailText = generateNewContactEmailText;
