import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
];

const PUBLIC_ENCLAVE_SYSTEM_PROMPT = `Aap "SUPER PAK DATA WALE GOODS TRANSPORT CO." (SPD Logistics, Established 1996) ke PUBLIC Customer Support Assistant hain.
Aapka daira-e-kar (scope) sirf aur sirf aam customer inquiries aur public information tak mehdood hai.

IJAAZAT SHUDA MAALOOMAAT (Allowed Scope):
1. Consignment Tracking: Customers ko batayein ke woh apna Bilty Number ya Tracking ID /tracking page par enter kar ke live status check kar sakte hain.
2. Services Overview: Full Truck Load (22-Wheeler / 10-Wheeler / Mazda), Nationwide Goods Transport, Bilty Booking, aur Warehousing.
3. Terminal Locations:
   - Karachi Hub: Plot 12-B, Transport Nagar, Hawksbay Road / Mauripur.
   - Lahore Hub: Super Pak Data Godown, Saggian Bypass / Badami Bagh Goods.
4. Official Contact Helpline:
   - Operations Head & Booking: Hammad Faisal Bhatti (Phone / WhatsApp: 0325 2024433)
   - Senior Patron: Haji Rahim

STRICT PRIVACY ENCLAVE RULE (No Internal Financial Data):
- Aap ke paas company ke internal accounts, cash books, vehicle costs, profit/loss, driver advances, ya private customer ledgers (khatay) ka BILKUL KOI ACCESS NAHI HAI.
- Agar koi user company ke internal financial figures, nafa/nuqsan, cash balance, driver advances, ya kisi party ke khatay/balances ke baray mein pooche, to foran aur ba-adab yehi jawab dein:
  "Yeh maaloomaat confidential hain. Baraye meherbani SPD head office se rabta karein."
- Kisi bhi surat mein internal data fabricate ya reveal na karein. Hamesha shaishta, mukhtasar aur professional Roman Urdu ya English mein jawab dein.`;

async function callPublicGemini(
  conversation: { role: string; content: string }[],
  apiKey: string
): Promise<string> {
  let lastError = "";

  const contents = conversation.map((c) => ({
    role: c.role === "assistant" ? "model" : "user",
    parts: [{ text: c.content }],
  }));

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const requestBody = {
        systemInstruction: {
          parts: [{ text: PUBLIC_ENCLAVE_SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 600,
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        lastError = errJson?.error?.message || `HTTP ${res.status}`;
      }
    } catch (err: any) {
      lastError = err.message || "Network error";
    }
  }

  throw new Error(lastError || "Public Gemini model error");
}

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  return NextResponse.json({
    success: true,
    status: apiKey ? "ready" : "unconfigured",
    enclave: "STRICT_PUBLIC_ISOLATION",
    engine: "Google Gemini 3.8 Flash (Public Enclave)",
    services: [
      "public_consignment_tracking_guidance",
      "terminal_addresses_and_contacts",
      "commercial_freight_overview",
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], message } = body;

    const userText =
      message ||
      (Array.isArray(messages) && messages.length > 0
        ? messages[messages.length - 1]?.content || ""
        : "");

    if (!userText || !userText.trim()) {
      return NextResponse.json(
        { success: false, error: "Empty query" },
        { status: 400 }
      );
    }

    const lower = userText.toLowerCase();

    // Fast Privacy Guardrail Check: Block inquiries about internal finances or khatas
    const financialTriggers = [
      "profit",
      "loss",
      "nuqsan",
      "nafa",
      "khata",
      "balance",
      "cash book",
      "cash in",
      "cash out",
      "salary",
      "tankhwah",
      "advance",
      "receivable",
      "payable",
      "ledger",
      "driver expense",
      "diesel cost",
    ];

    const isFinancialQuery = financialTriggers.some((trigger) => lower.includes(trigger));

    if (isFinancialQuery) {
      return NextResponse.json({
        success: true,
        reply: "Yeh maaloomaat confidential hain. Baraye meherbani SPD head office se rabta karein.",
        privacyEnforced: true,
      });
    }

    const conversation: { role: string; content: string }[] = [];

    if (Array.isArray(messages) && messages.length > 0) {
      for (const m of messages.slice(-6)) {
        if (m.role === "user" || m.role === "assistant") {
          conversation.push({ role: m.role, content: String(m.content || m.text || "") });
        }
      }
    } else {
      conversation.push({ role: "user", content: userText });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      try {
        const reply = await callPublicGemini(conversation, apiKey);
        return NextResponse.json({
          success: true,
          reply,
          enclave: "PUBLIC_SECURE",
        });
      } catch (geminiErr: any) {
        console.warn("Public Gemini API fallback active:", geminiErr.message);
      }
    }

    // Local Public Knowledge Base Fallback
    let fallbackReply = "";
    if (lower.includes("track") || lower.includes("bilty") || lower.includes("status")) {
      fallbackReply =
        "Aap apna consignment foran track kar sakte hain! Barah-e-karam apna Bilty Number (jaise SPD-LHR-2026-...) hamare /tracking portal par enter karein ya WhatsApp par 0325 2024433 par bheinjein.";
    } else if (lower.includes("contact") || lower.includes("phone") || lower.includes("number") || lower.includes("hammad")) {
      fallbackReply =
        "SPD Logistics Operations Helpline:\n- Hammad Faisal Bhatti: 0325 2024433 (Call / WhatsApp)\n- Senior Management: Haji Rahim\n- Karachi & Lahore Terminals 24/7 dastiyab hain.";
    } else if (lower.includes("terminal") || lower.includes("address") || lower.includes("godown") || lower.includes("karachi") || lower.includes("lahore")) {
      fallbackReply =
        "Hamare Main Hub Terminals:\n1. Karachi Terminal: Plot 12-B, Transport Nagar, Hawksbay Road / Mauripur, Karachi.\n2. Lahore Terminal: Super Pak Data Godown, Saggian Bypass / Badami Bagh Goods, Lahore.";
    } else {
      fallbackReply =
        "Assalam-o-Alaikum! Main SPD Logistics ka Public Assistant hoon. Main aapko consignment tracking, commercial freight services (FTL, Goods Transport), aur terminal locations ke baray mein guidance de sakta hoon. Kisi bhi booking ke liye 0325 2024433 par rabta karein.";
    }

    return NextResponse.json({
      success: true,
      reply: fallbackReply,
      enclave: "PUBLIC_SECURE_LOCAL",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Public customer support service temporarily unavailable.",
      },
      { status: 500 }
    );
  }
}
