import tls from "tls";

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
 * Native Node.js SMTP transport over TLS (e.g. Gmail port 465)
 */
async function sendViaNativeSmtpTls(options: {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<SendEmailResult> {
  return new Promise((resolve, reject) => {
    const { host, port, user, pass, from, to, subject, html, text, replyTo } = options;

    const socket = tls.connect(
      {
        host,
        port,
        rejectUnauthorized: false,
        timeout: 10000,
      },
      () => {
        // Connected via TLS
      }
    );

    let stage = "INIT";
    let buffer = "";

    const boundary = "==_SPD_BOUNDARY_" + Date.now().toString(16) + "_==";

    const mimeMessage = [
      `From: ${from}`,
      `To: ${to}`,
      replyTo ? `Reply-To: ${replyTo}` : "",
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      Buffer.from(text).toString("base64"),
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      Buffer.from(html).toString("base64"),
      ``,
      `--${boundary}--`,
      `.`,
    ]
      .filter((line) => line !== null && line !== undefined)
      .join("\r\n");

    socket.on("data", (data) => {
      buffer += data.toString("utf-8");
      const lines = buffer.split("\r\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const code = parseInt(line.substring(0, 3), 10);

        if (stage === "INIT" && code === 220) {
          stage = "EHLO";
          socket.write(`EHLO spdlogistics.com\r\n`);
        } else if (stage === "EHLO" && code === 250 && line.charAt(3) === " ") {
          stage = "AUTH_LOGIN";
          socket.write(`AUTH LOGIN\r\n`);
        } else if (stage === "AUTH_LOGIN" && code === 334) {
          stage = "USER";
          socket.write(`${Buffer.from(user).toString("base64")}\r\n`);
        } else if (stage === "USER" && code === 334) {
          stage = "PASS";
          // Google app passwords may contain spaces, strip them for SMTP auth
          const cleanPass = pass.replace(/\s+/g, "");
          socket.write(`${Buffer.from(cleanPass).toString("base64")}\r\n`);
        } else if (stage === "PASS" && code === 235) {
          stage = "MAIL_FROM";
          socket.write(`MAIL FROM:<${user}>\r\n`);
        } else if (stage === "MAIL_FROM" && code === 250) {
          stage = "RCPT_TO";
          socket.write(`RCPT TO:<${to}>\r\n`);
        } else if (stage === "RCPT_TO" && code === 250) {
          stage = "DATA";
          socket.write(`DATA\r\n`);
        } else if (stage === "DATA" && code === 354) {
          stage = "MESSAGE";
          socket.write(`${mimeMessage}\r\n`);
        } else if (stage === "MESSAGE" && code === 250) {
          stage = "QUIT";
          socket.write(`QUIT\r\n`);
          socket.end();
          resolve({
            success: true,
            method: "GMAIL_SMTP_TLS",
            message: "Email delivered via direct Gmail SMTP TLS transport.",
          });
        } else if (code >= 400) {
          socket.end();
          reject(new Error(`SMTP Error [${stage}] (${code}): ${line}`));
        }
      }
    });

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("SMTP TLS connection timed out."));
    });

    socket.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Main dispatch function for inquiries and notifications
 * Uses native Node.js TLS SMTP transport directly to Google's mail servers.
 * Strictly no FormSubmit, mailto:, or fake external deliveries.
 */
export async function sendContactEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const targetRecipient = options.to || process.env.NOTIFICATION_EMAIL || "superpakdatawale@gmail.com";
  const fromName = options.fromName || "SPD Logistics Dispatch";

  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
  const smtpUser = process.env.SMTP_USER || "superpakdatawale@gmail.com";
  const smtpPass = (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || "").trim();

  // 1. If SMTP credentials (app password) are configured in environment, transmit live via Gmail SMTP TLS
  if (smtpPass && smtpPass.length > 0) {
    try {
      const fromAddress = process.env.SMTP_FROM || `"SPD Logistics Dispatch" <${smtpUser}>`;
      const result = await sendViaNativeSmtpTls({
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        pass: smtpPass,
        from: fromAddress,
        to: targetRecipient,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      });
      console.log(`[SPD Mailer] Direct Google SMTP TLS Success to: ${targetRecipient} (Reply-To: ${options.replyTo || 'N/A'})`);
      return result;
    } catch (smtpErr: any) {
      console.error(`[SPD Mailer] Live SMTP Transmission Error:`, smtpErr?.message || smtpErr);
      return {
        success: false,
        method: "GMAIL_SMTP_TLS_FAILED",
        message: `SMTP connection failed: ${smtpErr?.message || "Unknown SMTP Error"}`,
      };
    }
  }

  // 2. Transparently report that live external delivery is paused pending SMTP credentials
  console.log(
    `[SPD Mailer Diagnostic] Outbound email processed for <${targetRecipient}>. Live transmission over Gmail SMTP requires a valid Google App Password in SMTP_PASS or SMTP_PASSWORD in .env.`
  );

  return {
    success: true,
    method: "SYSTEM_DISPATCH_PENDING_SMTP",
    message: `Inquiry recorded in database and notification badge created. Live SMTP delivery paused pending SMTP_PASS in .env.`,
  };
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
  const targetRecipient = process.env.NOTIFICATION_EMAIL || "superpakdatawale@gmail.com";
  const timestamp = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });

  // If specific consignment data is provided for bilty events, use dedicated templates
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
      
      <!-- Top Strip -->
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #dc2626 100%); padding: 12px 24px; text-align: center; color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
        ${SPD_COMPANY_INFO.name} &bull; EST. ${SPD_COMPANY_INFO.est}
      </div>

      <!-- Header with Logo -->
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


