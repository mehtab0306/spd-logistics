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

export const dynamic = "force-dynamic";

const GEMINI_CANDIDATE_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
];

const GROQ_CANDIDATE_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
];

async function callGemini(conversation: ChatMessage[], apiKey: string): Promise<{ reply: string; model: string }> {
  const contents = conversation.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.role === "system" ? `[System Directive: ${msg.content}]` : msg.content }],
  }));

  let lastError = "";

  for (const model of GEMINI_CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1000,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return { reply: text.trim(), model };
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        lastError = errJson?.error?.message || `HTTP ${res.status}`;
      }
    } catch (err: any) {
      lastError = err.message || "Network error";
    }
  }

  throw new Error(lastError || "Gemini model error");
}

export async function GET() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (geminiKey) {
    return NextResponse.json({
      success: true,
      status: "ready",
      model: "Google Gemini 3.8 Flash Engine",
    });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return NextResponse.json({
      success: true,
      status: "ready",
      model: "Groq AI Llama 3.3 Engine",
    });
  }

  return NextResponse.json({
    success: false,
    status: "unconfigured",
    message: "Configuration Required: GEMINI_API_KEY is not configured",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], message } = body;

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

    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // 1. Try Gemini first
    if (geminiKey) {
      try {
        const result = await callGemini(conversation, geminiKey);
        return NextResponse.json({
          success: true,
          reply: result.reply,
          model: result.model,
        });
      } catch (geminiErr: any) {
        console.warn("Gemini call failed, attempting fallback:", geminiErr.message);
      }
    }

    // 2. Try Groq as fallback if configured
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey !== "PASTE_YOUR_GROQ_KEY_HERE") {
      for (const model of GROQ_CANDIDATE_MODELS) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqKey}`,
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
            const reply = data.choices?.[0]?.message?.content;
            if (reply && reply.trim().length > 0) {
              return NextResponse.json({
                success: true,
                reply,
                model: `Groq/${model}`,
              });
            }
          }
        } catch (groqErr) {
          // Continue to next candidate
        }
      }
    }

    // 3. Graceful offline fallback response so user operations are never blocked
    return NextResponse.json({
      success: true,
      reply: "Thank you for contacting SPD Logistics. For immediate dispatch assistance, live tracking updates, or custom FTL freight tariffs, please reach our Operations Desk on WhatsApp / Call at 0325 2024433.",
      model: "spd-assistant-fallback",
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
