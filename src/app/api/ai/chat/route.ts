import { NextRequest, NextResponse } from "next/server";

const SPD_SYSTEM_PROMPT = `You are the official AI Logistics Assistant and Virtual Dispatcher for SPD LOGISTICS (Super Pak Data Goods Transport Co., Est. 1996).

Your role is to assist corporate clients, traders, factory owners, and shippers with freight rates, shipment tracking, booking, warehouse locations, and transit timelines across Pakistan.

=== KEY COMPANY INFORMATION ===
• Full Legal Name: Super Pak Data Goods Transport Co. (SPD Logistics)
• Established: 1996 (28+ years of nationwide transport excellence)
• Executive Leadership:
  - Hammad Faisal Bhatti (Owner / Managing Director) - Direct Dispatch: 0325 2024433
  - Faisal Hussain Bhatti (Founder / CEO) - Office: 0300 2024433
• Official Email: superpakdatawale@gmail.com

=== WAREHOUSE & TERMINAL HUBS ===
1. Karachi Terminal: Plot No 9, Gate No 1, Street No 4 Truck Stand, Hawksbay Road, Karachi.
   (24/7 port receiving from KPT & Port Qasim, container destuffing, cross-docking, nationwide dispatch)
2. Lahore Terminal: Central Punjab Commercial Freight & Cargo Terminal, Lahore.
   (Primary distribution hub for Lahore, Gujranwala, Sialkot, Faisalabad, and upper Punjab)

=== PRIMARY SERVICES ===
1. Full Truck Load (FTL): Dedicated fleet of 10-wheelers, 22-wheelers, flatbeds, and containers for direct nationwide transport.
2. Commercial Bilty & LTL Goods Transport: Daily dispatches for break-bulk, cartons, machinery, textiles, chemicals, and general cargo.
3. Port Logistics & Destuffing: Direct cargo clearance and transport from Karachi Port Trust (KPT) and Port Qasim.
4. Warehousing & Secure Storage: 24/7 monitored facilities in Karachi and Lahore with forklift handling and palletized storage.
5. Express Trunk Transit: Karachi to Punjab (Lahore, Multan, Faisalabad) transit within 24 to 48 hours.

=== NATIONWIDE TRANSIT CORRIDORS ===
Karachi, Hyderabad, Sukkur, Rahim Yar Khan, Multan, Faisalabad, Lahore, Gujranwala, Sialkot, Rawalpindi/Islamabad, Peshawar, and Quetta.

=== INQUIRY GUIDELINES ===
• Shipment Tracking: Guide users to enter their Bilty Number (e.g., BLT-2026-001) or 8-digit Tracking ID directly on the website tracking page (/tracking) or message WhatsApp at 0325 2024433 for live consignment updates.
• Booking & Rates: Freight tariffs depend on cargo weight, volume (CBM), and route. For instant vehicle allocation and competitive commercial rates, direct customers to contact Managing Director Hammad Faisal Bhatti at 0325 2024433.
• Languages: Fluent and courteous in both English and Urdu/Roman Urdu. Respond in the language used by the customer.
• Tone: Professional, authoritative, polite, concise, and helpful. Use clear bullet points when explaining options.`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const CANDIDATE_MODELS = [
  "groq/compound-mini",
  "groq/compound",
  "openai/gpt-oss-120b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "qwen/qwen3.8-27b",
];

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      status: "unconfigured",
      message: "Configuration Required: GROQ_API_KEY is not configured",
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return NextResponse.json({
        success: true,
        status: "ready",
        model: "Groq AI Llama 3.3 Engine",
      });
    } else {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        status: "unavailable",
        message: errData?.error?.message || `Groq API returned HTTP ${res.status}`,
      });
    }
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      status: "unavailable",
      message: err.name === "AbortError" ? "Groq health check timed out" : (err.message || "Cannot reach Groq API"),
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], message } = body;

    // Build message thread
    const conversation: ChatMessage[] = [
      { role: "system", content: SPD_SYSTEM_PROMPT },
    ];

    if (Array.isArray(messages) && messages.length > 0) {
      for (const m of messages) {
        if (m.role === "user" || m.role === "assistant") {
          conversation.push({
            role: m.role,
            content: String(m.content || m.text || ""),
          });
        }
      }
    } else if (message) {
      conversation.push({
        role: "user",
        content: String(message),
      });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.warn("GROQ_API_KEY not configured in environment");
      return NextResponse.json(
        {
          success: false,
          error: "GROQ_API_KEY is not configured in the server environment. Please set GROQ_API_KEY in .env.",
        },
        { status: 503 }
      );
    }

    let reply = "";
    let usedModel = "";
    let lastError = "";

    // Attempt models in priority order
    for (const model of CANDIDATE_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: conversation,
            temperature: 0.6,
            max_tokens: 800,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          reply = data.choices?.[0]?.message?.content || "";
          if (reply && reply.trim().length > 0) {
            usedModel = model;
            break;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData?.error?.message || `Groq API returned HTTP ${response.status}`;
          console.warn(`Groq model ${model} failed with HTTP ${response.status}:`, lastError);
        }
      } catch (err: any) {
        lastError = err.name === "AbortError" ? "Groq request timed out" : (err.message || "Network error");
        console.warn(`Error trying Groq model ${model}:`, lastError);
      }
    }

    if (!reply) {
      return NextResponse.json(
        {
          success: false,
          error: lastError ? `AI Engine Error: ${lastError}` : "Unable to reach Groq AI. Please check server network access and try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      reply,
      model: usedModel,
    });
  } catch (error: any) {
    console.error("Error in AI chat route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Server error occurred while processing AI request.",
      },
      { status: 500 }
    );
  }
}
