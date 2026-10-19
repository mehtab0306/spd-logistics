import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to?: string;
  fromName?: string;
  fromEmail?: string;
  phone?: string;
  message?: string;
  submittedAt?: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  message: string;
  method?: string;
  messageId?: string;
}

/**
 * Main dispatch function for inquiries and notifications using Nodemailer with Gmail SMTP.
 * Target recipient: spdgoodstransport@gmail.com
 */
export async function sendContactEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const targetRecipient = options.to || process.env.RECEIVER_EMAIL || process.env.NOTIFICATION_EMAIL || "spdgoodstransport@gmail.com";
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587", 10);
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || "spdgoodstransport@gmail.com").trim();
  const pass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || "minklfyiagkzceaud").trim();

  // If credentials are empty
  if (!user || !pass) {
    console.warn(
      `[SPD Mailer] SMTP credentials are not configured in environment. Outbound email paused for <${targetRecipient}>.`
    );
    return {
      success: false,
      method: "SMTP_UNCONFIGURED",
      message: "SMTP credentials are not configured in environment.",
    };
  }

  const fromAddress = process.env.SMTP_FROM || `"SPD Logistics Dispatch" <${user}>`;
  const isSecure = port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass: pass.replace(/\s+/g, ""), // Clean spaces from 16-character Google app password
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    tls: {
      ciphers: "SSLv3",
      rejectUnauthorized: false,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: targetRecipient,
      replyTo: options.replyTo,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(
      `[SPD Mailer] Email accepted by Gmail SMTP server for <${targetRecipient}>. MessageId: ${info.messageId}`
    );

    return {
      success: true,
      method: "GMAIL_SMTP_NODEMAILER",
      message: "Email successfully accepted by Gmail SMTP server.",
      messageId: info.messageId,
    };
  } catch (err: any) {
    console.error(`[SPD Mailer] Nodemailer Gmail SMTP transmission error:`, err?.message || err);
    return {
      success: false,
      method: "GMAIL_SMTP_FAILED",
      message: err?.message || "Failed to transmit email through Gmail SMTP.",
    };
  }
}

export interface EventEmailOptions {
  eventType: "BILTY_CREATED" | "BILTY_DELIVERED" | "PAYMENT_RECORDED" | "CONTACT_FORM" | "SYSTEM";
  subject: string;
  title: string;
  summary: string;
  fields?: Record<string, string | number | null | undefined>;
  link?: string;
  consignmentData?: {
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
  };
}

/**
 * Dispatch real event notifications (Bilty Created, Delivered, Payment, etc.) to admin
 */
export async function sendEventEmail(options: EventEmailOptions): Promise<SendEmailResult> {
  const targetRecipient = process.env.NOTIFICATION_EMAIL || "spdgoodstransport@gmail.com";
  const timestamp = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });

  if (options.consignmentData && (options.eventType === "BILTY_CREATED" || options.eventType === "BILTY_DELIVERED")) {
    const { generateBiltyEmailHtml, generateBiltyEmailText } = await import("@/lib/email-template");
    const html = generateBiltyEmailHtml(options.consignmentData);
    const text = generateBiltyEmailText(options.consignmentData);

    return sendContactEmail({
      to: targetRecipient,
      fromName: "SPD Logistics Dispatch",
      subject: options.subject,
      html,
      text,
    });
  }

  const { generateConsistentEmailFooterHtml, generateConsistentEmailFooterText, SPD_COMPANY_INFO } = await import(
    "@/lib/email-template"
  );

  const fieldsHtml = options.fields
    ? Object.entries(options.fields)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(
          ([k, v]) => `
          <tr>
            <td style="padding: 10px 14px; font-weight: 800; color: #475569; background-color: #f8fafc; width: 38%; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-transform: uppercase;">${k}</td>
            <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700;">${v}</td>
          </tr>`
        )
        .join("")
    : "";

  const fieldsText = options.fields
    ? Object.entries(options.fields)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `• ${k}: ${v}`)
        .join("\n")
    : "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${options.subject}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <center style="width: 100%;">
    <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 1px solid #1e293b;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #dc2626 100%); padding: 12px 24px; text-align: center; color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
        ${SPD_COMPANY_INFO.name} &bull; EST. ${SPD_COMPANY_INFO.est}
      </div>

      <div style="padding: 24px 24px 16px 24px; text-align: center;">
        <img 
          src="${SPD_COMPANY_INFO.logoUrl}" 
          alt="SPD Logo" 
          width="64" 
          height="64" 
          style="border-radius: 12px; border: 1.5px solid #e2e8f0; padding: 2px; background: #ffffff; display: block; margin: 0 auto 10px auto;" 
        />
        <div style="font-size: 15px; font-weight: 900; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">
          ${SPD_COMPANY_INFO.shortName}
        </div>
        <div style="font-size: 11px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
          Operations Dispatch Alert
        </div>

        <div style="display: inline-block; padding: 5px 14px; background-color: #fee2e2; color: #b91c1c; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px;">
          ${options.eventType.replace(/_/g, " ")}
        </div>

        <h2 style="margin: 0 0 6px 0; font-size: 20px; color: #0f172a; font-weight: 800;">${options.title}</h2>
        <p style="margin: 0 0 16px 0; color: #475569; font-size: 13px; line-height: 1.5;">${options.summary}</p>
      </div>
      
      <div style="padding: 0 24px 20px 24px;">
        ${
          fieldsHtml
            ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border-radius: 12px; overflow: hidden; border: 1.5px solid #e2e8f0;">${fieldsHtml}</table>`
            : ""
        }
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${generateConsistentEmailFooterHtml()}
      </table>
    </div>
  </center>
</body>
</html>`;

  const text = `
=== SPD LOGISTICS OPERATIONS ALERT ===
Event: ${options.eventType}
Title: ${options.title}
Timestamp: ${timestamp}

${options.summary}

${fieldsText}

${generateConsistentEmailFooterText()}
`;

  return sendContactEmail({
    to: targetRecipient,
    fromName: "SPD Logistics Dispatch",
    subject: options.subject,
    html,
    text,
  });
}
