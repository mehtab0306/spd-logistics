import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const senderName = body.fullName || body.name || 'Website Visitor';
    const senderPhone = body.phone || body.contact || 'Not Provided';
    const senderEmail = body.email || 'Not Provided';
    const clientMessage = body.message || 'Direct inquiry submitted from website.';
    const cleanDigits = String(senderPhone).replace(/[^0-9]/g, '');
    const cleanPhone = cleanDigits.startsWith('0') 
      ? '92' + cleanDigits.slice(1) 
      : (cleanDigits.startsWith('92') ? cleanDigits : (cleanDigits ? '92' + cleanDigits : '923252024433'));

    // Pure Gmail SMTP with verified 16-character App Password
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: 'superpakdatawale@gmail.com',
        pass: 'minklfyiagkzceaud'.replace(/\s+/g, '') // Official App Password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const subject = `[NEW INQUIRY] SPD Logistics - From: ${senderName} (${senderPhone})`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px; background-color: #0f172a; font-family: Arial, sans-serif;">
      <table align="center" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; border-top: 5px solid #dc2626;">
        <tr>
          <td style="background-color: #0b1329; padding: 20px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 22px; letter-spacing: 1px;">SPD LOGISTICS</h2>
            <p style="margin: 4px 0 0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Super Pak Data Wale Goods Transport Co.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 24px;">
            <h3 style="color: #0f172a; margin-top: 0;">New Consignment Inquiry</h3>
            <table width="100%" cellpadding="8" cellspacing="0" style="border: 1px solid #e2e8f0; font-size: 14px;">
              <tr style="background-color: #f8fafc;">
                <td width="35%" style="font-weight: bold; color: #64748b;">Full Name:</td>
                <td style="color: #0f172a; font-weight: bold;">${senderName}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; color: #64748b;">Phone / WhatsApp:</td>
                <td style="color: #dc2626; font-weight: bold;">${senderPhone}</td>
              </tr>
              <tr style="background-color: #f8fafc;">
                <td style="font-weight: bold; color: #64748b;">Email Address:</td>
                <td>${senderEmail}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; color: #64748b; vertical-align: top;">Message:</td>
                <td style="line-height: 1.5; color: #334155;">${clientMessage}</td>
              </tr>
            </table>

            <div style="text-align: center; margin-top: 24px;">
              <a href="https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(senderName)},%20we%20have%20received%20your%20inquiry%20regarding%20SPD%20Logistics." 
                 style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px;">
                Direct WhatsApp Reply (${senderPhone})
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b;">
            Official Inbox: superpakdatawale@gmail.com<br>
            Designed & Developed by <a href="https://wa.me/923147194861" style="color: #dc2626; font-weight: bold; text-decoration: none;">Mehtab</a>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    // Strictly one recipient: superpakdatawale@gmail.com
    await transporter.sendMail({
      from: `"SPD Logistics" <superpakdatawale@gmail.com>`,
      to: 'superpakdatawale@gmail.com',
      replyTo: (senderEmail && senderEmail !== 'Not Provided' && senderEmail.includes('@')) ? senderEmail : undefined,
      subject: subject,
      html: htmlContent
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Thank you! Your inquiry has been submitted successfully. Our team will contact you shortly.' 
    });

  } catch (error: any) {
    console.error('SMTP ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to dispatch email. Please reach out via WhatsApp.' 
    }, { status: 500 });
  }
}
