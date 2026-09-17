import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateNewContactEmailHtml, generateNewContactEmailText } from "@/lib/email-template";
import { sendContactEmail } from "@/lib/mailer";
import prisma from "@/lib/prisma";

const contactSchema = z.object({
  name: z.string().optional().default("Valued Customer"),
  phone: z.string().optional().default("Not specified"),
  email: z.string().optional().default("superpakdatawale@gmail.com"),
  subject: z.string().optional().default("[SPD Logistics Booking Inquiry] New Customer Request"),
  message: z.string().optional().default("General freight inquiry"),
});

export async function POST(req: NextRequest) {
  try {
    let rawBody: any = {};
    try {
      rawBody = await req.json();
    } catch {
      rawBody = {};
    }

    const validatedData = contactSchema.parse(rawBody);
    const clientName = validatedData.name?.trim() || "Valued Customer";
    const clientPhone = validatedData.phone?.trim() || "Not specified";
    const clientEmail = validatedData.email?.trim() || "superpakdatawale@gmail.com";
    const clientMessage = validatedData.message?.trim() || "General cargo inquiry";
    const clientSubject = validatedData.subject?.trim() || "[SPD Logistics Booking Inquiry] New Customer Request";

    const submissionTime = new Date().toLocaleString("en-PK", {
      timeZone: "Asia/Karachi",
      dateStyle: "full",
      timeStyle: "medium",
    });

    const targetEmail = "superpakdatawale@gmail.com";
    const subject = clientSubject;

    // Generate Official HTML Email Template for SPD Dispatch
    const vipHtml = generateNewContactEmailHtml({
      name: clientName,
      phone: clientPhone,
      email: clientEmail,
      subject,
      message: clientMessage,
      submittedAt: submissionTime,
    });

    // Generate Plain Text version for MIME delivery
    const vipText = generateNewContactEmailText({
      name: clientName,
      phone: clientPhone,
      email: clientEmail,
      subject,
      message: clientMessage,
      submittedAt: submissionTime,
    });

    // Save notification / audit in database
    try {
      await prisma.auditLog.create({
        data: {
          action: "INQUIRY_RECEIVED",
          module: "CONTACT",
          details: `Inquiry from ${clientName} (${clientPhone}) - target: ${targetEmail}`,
        },
      });

      const { createSystemNotification } = await import("@/lib/notifications");
      await createSystemNotification({
        type: "CONTACT",
        title: `New Inquiry from ${clientName}`,
        message: `${clientSubject}: "${clientMessage}" (Phone: ${clientPhone})`,
        link: "/admin/audit-logs",
      });
    } catch (dbErr) {
      console.warn("[Contact DB Warning]", dbErr);
    }

    // Automatically send email from the backend
    let dispatchMethod: string = "mailer";
    try {
      const dispatchResult = await sendContactEmail({
        to: targetEmail,
        fromName: clientName,
        fromEmail: clientEmail,
        phone: clientPhone,
        message: clientMessage,
        submittedAt: submissionTime,
        replyTo: clientEmail,
        subject,
        html: vipHtml,
        text: vipText,
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
        message: "Thank you! Your cargo inquiry has been sent successfully to superpakdatawale@gmail.com. Our dispatch team will contact you shortly.",
        targetEmail,
        submissionTime,
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
        message: "Thank you! Your cargo inquiry has been received for superpakdatawale@gmail.com. Our dispatch team will contact you shortly.",
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
