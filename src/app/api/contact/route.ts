import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createSystemNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fullName = body.fullName || body.name || 'Website Visitor';
    const phone = body.phone || body.contact || 'Not Provided';
    const email = body.email || 'Not Provided';
    const origin = body.origin || 'Direct Inquiry / General';
    const destination = body.destination || 'Direct Inquiry / General';
    const cargoDetails = body.cargoDetails || body.cargo || 'Not Specified';
    const message = body.message || 'Direct inquiry submitted from website.';
    
    const rawDigits = String(phone).replace(/[^0-9]/g, '');
    const cleanPhone = rawDigits.startsWith('0') 
      ? '92' + rawDigits.slice(1) 
      : (rawDigits.startsWith('92') ? rawDigits : (rawDigits ? '92' + rawDigits : '923252024433'));
    const submissionDate = new Intl.DateTimeFormat('en-PK', {
      timeZone: 'Asia/Karachi',
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(new Date());

    // Configure Nodemailer with Port 587 STARTTLS
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // STARTTLS
      auth: {
        user: 'spdgoodstransport@gmail.com',
        pass: 'rturgfirgundlmyf'
      },
      connectionTimeout: 15000,
      tls: {
        rejectUnauthorized: false
      }
    });

    const subject = `[NEW CARGO INQUIRY] SPD Logistics - From: ${fullName} (${phone})`;

    // VIP Corporate HTML Template
    const htmlEmail = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border-top: 6px solid #dc2626;">
              
              <!-- BRAND HEADER -->
              <tr>
                <td style="background: linear-gradient(135deg, #0b1329 0%, #1e3a8a 100%); padding: 26px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1.5px;">
                    SPD <span style="color: #ef4444;">LOGISTICS</span>
                  </h1>
                  <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                    Super Pak Data Wale Goods Transport Co. (Est. 1996)
                  </p>
                </td>
              </tr>

              <!-- TITLE & STATUS BADGE -->
              <tr>
                <td style="padding: 24px 30px 10px 30px; text-align: center;">
                  <span style="display: inline-block; padding: 5px 14px; background-color: #dcfce7; color: #15803d; font-size: 11px; font-weight: 800; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
                    📦 New Direct Website Message
                  </span>
                  <h2 style="color: #0f172a; margin: 12px 0 4px 0; font-size: 20px; font-weight: 800;">
                    Consignment Booking / Contact Inquiry
                  </h2>
                  <p style="color: #64748b; font-size: 12px; margin: 0;">
                    Received on: <strong>${submissionDate}</strong> (PKT)
                  </p>
                </td>
              </tr>

              <!-- STRUCTURED DETAILS TABLE -->
              <tr>
                <td style="padding: 16px 30px 24px 30px;">
                  <table width="100%" cellpadding="10" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #1e293b;">
                    <tr style="background-color: #f8fafc;">
                      <td width="36%" style="font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Customer Name:</td>
                      <td style="font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${fullName}</td>
                    </tr>
                    <tr>
                      <td style="font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Phone / WhatsApp:</td>
                      <td style="font-weight: 800; color: #dc2626; border-bottom: 1px solid #e2e8f0;">${phone}</td>
                    </tr>
                    <tr style="background-color: #f8fafc;">
                      <td style="font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Email Address:</td>
                      <td style="border-bottom: 1px solid #e2e8f0;">${email}</td>
                    </tr>
                    <tr>
                      <td style="font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Route Details:</td>
                      <td style="font-weight: 800; color: #1e3a8a; border-bottom: 1px solid #e2e8f0;">${origin} ➔ ${destination}</td>
                    </tr>
                    <tr style="background-color: #f8fafc;">
                      <td style="font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Cargo / Goods:</td>
                      <td style="border-bottom: 1px solid #e2e8f0;">${cargoDetails}</td>
                    </tr>
                    <tr>
                      <td style="font-weight: 700; color: #64748b; vertical-align: top;">Client Message:</td>
                      <td style="line-height: 1.5; color: #334155;">${message}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- DIRECT 1-CLICK WHATSAPP REPLY BUTTON -->
              <tr>
                <td style="padding: 0 30px 24px 30px; text-align: center;">
                  <a href="https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(fullName)},%20we%20have%20received%20your%20inquiry%20regarding%20SPD%20Logistics.%20Our%20team%20is%20ready%20to%20assist%20you." 
                     target="_blank" 
                     style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);">
                    💬 DIRECT WHATSAPP REPLY (+${cleanPhone})
                  </a>
                </td>
              </tr>

              <!-- TERMINALS & DEVELOPER FOOTER -->
              <tr>
                <td style="background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 12px; font-weight: 700; color: #0f172a;">
                    SUPER PAK DATA WALE GOODS TRANSPORT CO.
                  </p>
                  <p style="margin: 4px 0 10px 0; font-size: 11px; color: #64748b;">
                    Karachi Hawksbay Terminal • Lahore Saggian Bypass Hub<br>
                    Official Portal Inbox: spdgoodstransport@gmail.com
                  </p>
                  <div style="border-top: 1px dashed #cbd5e1; padding-top: 8px; font-size: 11px; color: #475569;">
                    Designed &amp; Developed by 
                    <a href="https://wa.me/923252875985" target="_blank" style="color: #dc2626; font-weight: 800; text-decoration: none;">
                      Mehtab (+92 325 2875985)
                    </a>
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: `"SPD Logistics" <spdgoodstransport@gmail.com>`,
      to: 'spdgoodstransport@gmail.com',
      replyTo: email !== 'Not Provided' && email.includes('@') ? email : undefined,
      subject: subject,
      html: htmlEmail
    });

    // Also persist to system notifications for admin visibility
    try {
      await createSystemNotification({
        type: 'CONTACT',
        title: `Inquiry from ${fullName}`,
        message: `Phone: ${phone} | Route: ${origin} ➔ ${destination} | Msg: ${message.slice(0, 120)}`,
        link: '/admin/notifications',
      });
    } catch {}

    return NextResponse.json({ 
      success: true, 
      message: 'Thank you! Your inquiry has been submitted successfully. Our team will contact you shortly.' 
    });

  } catch (error: any) {
    console.error('SMTP Delivery Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Unable to send message right now. Please reach out to us directly via WhatsApp.' 
    }, { status: 500 });
  }
}
