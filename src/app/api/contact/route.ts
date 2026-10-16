import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

// Helper to escape HTML entities for safety in HTML emails
function escapeHtml(str: string = ''): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      type = 'CUSTOMER_INQUIRY',
      inquiryType,
      fullName: rawFullName,
      brokerName,
      phone: rawPhone,
      whatsapp,
      email: rawEmail,
      origin: rawOrigin,
      originCity,
      destination: rawDestination,
      destinationCity,
      cargoDetails: rawCargoDetails,
      cargoDescription,
      weight: rawWeight,
      estimatedWeight,
      message: rawMessage,
      // Broker specific fields
      companyName: rawCompanyName,
      vehicleType: rawVehicleType,
      vehicleNumber: rawVehicleNumber,
      vehicleRegNo,
      preferredRoutes: rawPreferredRoutes,
      tariffExpectations: rawTariffExpectations,
      expectedTerms
    } = body;

    // Normalizing aliases
    const fullName = String(rawFullName || brokerName || body.name || '').trim();
    const phone = String(rawPhone || whatsapp || '').trim();
    const email = String(rawEmail || '').trim();
    const parsedOrigin = String(rawOrigin || originCity || '').trim();
    const parsedDestination = String(rawDestination || destinationCity || '').trim();
    const origin = parsedOrigin || 'Direct Contact / General Inquiry';
    const destination = parsedDestination || 'Direct Contact / General Inquiry';
    const cargoDetails = String(rawCargoDetails || cargoDescription || '').trim();
    const weight = String(rawWeight || estimatedWeight || '').trim();
    const message = String(rawMessage || '').trim();
    const companyName = String(rawCompanyName || '').trim();
    const vehicleType = String(rawVehicleType || '').trim();
    const vehicleNumber = String(rawVehicleNumber || vehicleRegNo || '').trim();
    const preferredRoutes = String(rawPreferredRoutes || '').trim();
    const tariffExpectations = String(rawTariffExpectations || expectedTerms || '').trim();

    // Server-side validation
    if (!fullName || !phone) {
      return NextResponse.json({ 
        success: false,
        delivered: false,
        error: 'Naam aur Phone number lazmi hain.',
        message: 'Naam aur Phone number lazmi hain.' 
      }, { status: 400 });
    }

    // Phone digits normalization for 1-click WhatsApp action
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('92')) {
      cleanPhone = '92' + cleanPhone;
    }

    const effectiveType = type || inquiryType || 'CUSTOMER_INQUIRY';
    const isBroker = effectiveType === 'BROKER_REGISTRATION' || effectiveType === 'BROKER';
    const referenceId = `SPD-${Date.now().toString().slice(-6)}`;
    
    const submissionTime = new Intl.DateTimeFormat('en-PK', {
      timeZone: 'Asia/Karachi',
      dateStyle: 'full',
      timeStyle: 'medium'
    }).format(new Date());

    const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER || 'superpakdatawale@gmail.com';
    const rawPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || 'minklfyiagkzceaud';
    const smtpPass = rawPass.replace(/\s+/g, '');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 465),
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const subject = isBroker
      ? `[FLEET REGISTRATION] SPD Logistics | ${fullName} | ${vehicleType || 'Truck Fleet'}`
      : `[NEW CUSTOMER INQUIRY] SPD Logistics | ${fullName} | ${origin || 'Origin'} ➔ ${destination || 'Destination'}`;

    // Premium Corporate Responsive HTML Template (DHL / Maersk Standard)
    const htmlEmail = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(subject)}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border-top: 6px solid #dc2626;">
              
              <!-- HEADER -->
              <tr>
                <td style="background: linear-gradient(135deg, #0b1329 0%, #1e3a8a 100%); padding: 24px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">
                    SPD <span style="color: #ef4444;">LOGISTICS</span>
                  </h1>
                  <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">
                    Super Pak Data Wale Goods Transport Co. (Est. 1996)
                  </p>
                </td>
              </tr>

              <!-- STATUS BADGE & TITLE -->
              <tr>
                <td style="padding: 24px 30px 10px 30px; text-align: center;">
                  <span style="display: inline-block; padding: 5px 14px; background-color: ${isBroker ? '#f3e8ff' : '#dcfce7'}; color: ${isBroker ? '#7e22ce' : '#15803d'}; font-size: 11px; font-weight: 800; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
                    ${isBroker ? '🚛 Transporter / Fleet Registration' : '📦 Customer Cargo Booking Inquiry'}
                  </span>
                  <h2 style="color: #0f172a; margin: 12px 0 4px 0; font-size: 19px; font-weight: 800;">
                    ${isBroker ? 'New Commercial Fleet Application' : 'Consignment Inquiry Received'}
                  </h2>
                  <p style="color: #64748b; font-size: 12px; margin: 0;">
                    Ref ID: <strong>${escapeHtml(referenceId)}</strong> | Logged on: ${escapeHtml(submissionTime)} (PKT)
                  </p>
                </td>
              </tr>

              <!-- PARTICULARS TABLE -->
              <tr>
                <td style="padding: 16px 30px 24px 30px;">
                  <table width="100%" cellpadding="10" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #1e293b;">
                    <tr style="background-color: #f8fafc;">
                      <td width="38%" style="font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Applicant / Name:</td>
                      <td style="font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${escapeHtml(fullName)} ${companyName ? `(${escapeHtml(companyName)})` : ''}</td>
                    </tr>
                    <tr>
                      <td style="font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Phone / WhatsApp:</td>
                      <td style="font-weight: 800; color: #dc2626; border-bottom: 1px solid #e2e8f0;">${escapeHtml(phone)}</td>
                    </tr>
                    ${email ? `
                    <tr style="background-color: #f8fafc;">
                      <td style="font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Email Address:</td>
                      <td style="border-bottom: 1px solid #e2e8f0;"><a href="mailto:${escapeHtml(email)}" style="color: #1e3a8a; text-decoration: none;">${escapeHtml(email)}</a></td>
                    </tr>` : ''}
                    
                    ${!isBroker ? `
                    <tr>
                      <td style="font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Route Corridor:</td>
                      <td style="font-weight: 800; color: #1e3a8a; border-bottom: 1px solid #e2e8f0;">${escapeHtml(origin || 'Not Specified')} ➔ ${escapeHtml(destination || 'Not Specified')}</td>
                    </tr>
                    <tr style="background-color: #f8fafc;">
                      <td style="font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Cargo & Weight:</td>
                      <td style="border-bottom: 1px solid #e2e8f0;">${escapeHtml(cargoDetails || 'N/A')}${weight ? ` (${escapeHtml(weight)})` : ''}</td>
                    </tr>
                    ` : `
                    <tr>
                      <td style="font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Vehicle Category:</td>
                      <td style="font-weight: 800; color: #1e3a8a; border-bottom: 1px solid #e2e8f0;">${escapeHtml(vehicleType || 'Commercial Carrier')}</td>
                    </tr>
                    <tr style="background-color: #f8fafc;">
                      <td style="font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Registration Plate:</td>
                      <td style="font-weight: 800; color: #dc2626; border-bottom: 1px solid #e2e8f0;">${escapeHtml(vehicleNumber || 'Unassigned')}</td>
                    </tr>
                    <tr>
                      <td style="font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0;">Operating Routes:</td>
                      <td style="border-bottom: 1px solid #e2e8f0;">${escapeHtml(preferredRoutes || 'All Pakistan')}</td>
                    </tr>
                    `}

                    <tr>
                      <td style="font-weight: 700; color: #64748b; vertical-align: top;">Client Message:</td>
                      <td style="line-height: 1.5; color: #334155;">${escapeHtml(message || tariffExpectations || 'No additional notes provided.')}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- 1-CLICK WHATSAPP REPLY BUTTON -->
              <tr>
                <td style="padding: 0 30px 24px 30px; text-align: center;">
                  <a href="https://wa.me/${cleanPhone}?text=Assalam-o-Alaikum%20${encodeURIComponent(fullName)},%20we%20have%20received%20your%20inquiry%20regarding%20SPD%20Logistics.%20Our%20team%20is%20ready%20to%20assist%20you." 
                     target="_blank" 
                     style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);">
                    💬 REPLY ON WHATSAPP (+${cleanPhone})
                  </a>
                </td>
              </tr>

              <!-- FOOTER SIGNATURE -->
              <tr>
                <td style="background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 12px; font-weight: 700; color: #0f172a;">
                    SUPER PAK DATA WALE GOODS TRANSPORT CO.
                  </p>
                  <p style="margin: 4px 0 10px 0; font-size: 11px; color: #64748b;">
                    Karachi Hawksbay Terminal • Lahore Saggian Bypass Hub<br>
                    Official Operations: superpakdata@gmail.com | superpakdatawale@gmail.com
                  </p>
                  <div style="border-top: 1px dashed #cbd5e1; padding-top: 8px; font-size: 11px; color: #475569;">
                    System Developed &amp; Maintained by 
                    <a href="https://wa.me/923147194861" target="_blank" style="color: #dc2626; font-weight: 700; text-decoration: none;">
                      Mehtab (+92 314 7194861)
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

    const receiverList = process.env.RECEIVER_EMAIL 
      ? process.env.RECEIVER_EMAIL.split(',').map((s: string) => s.trim()).filter(Boolean).join(', ')
      : 'superpakdata@gmail.com, superpakdatawale@gmail.com';

    await transporter.sendMail({
      from: `"SPD Logistics Web Portal" <${smtpUser}>`,
      to: receiverList,
      replyTo: email || undefined,
      subject: subject,
      html: htmlEmail
    });

    return NextResponse.json({ 
      success: true, 
      delivered: true,
      refId: referenceId,
      message: 'Shukriya! Aap ki inquiry SPD Logistics ko bhej di gayi hai. Hamari team jald aap se rabta karegi.' 
    });

  } catch (error: any) {
    console.error('SMTP Delivery Error:', error);
    return NextResponse.json({ 
      success: false,
      delivered: false,
      error: 'Maazrat, aap ki inquiry abhi send nahi ho saki. Aap dobara koshish karein ya WhatsApp ke zariye rabta karein.',
      message: 'Maazrat, aap ki inquiry abhi send nahi ho saki. Aap dobara koshish karein ya WhatsApp ke zariye rabta karein.'
    }, { status: 500 });
  }
}
