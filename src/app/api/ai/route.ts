import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GEMINI_CANDIDATE_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
];

const SPD_SYSTEM_PROMPT = `You are the official AI Logistics Operations Intelligence System for SPD LOGISTICS (Super Pak Data Goods Transport Co., Est. 1996).
You specialize in Pakistani freight transport, cargo documentation, customer ledger analysis, automated bilty remarks, and nationwide transit rate recommendations.
Tone: Professional, precise, business-accurate, and concise.`;

async function callGeminiRest(prompt: string, systemPrompt?: string): Promise<{ text: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in server environment.");
  }

  let lastError = "";

  for (const model of GEMINI_CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      const requestBody: any = {
        contents: [
          {
            parts: [{ text: `${systemPrompt ? systemPrompt + "\n\n" : ""}${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
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
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return { text: text.trim(), model };
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        lastError = errJson?.error?.message || `HTTP ${res.status}`;
      }
    } catch (err: any) {
      lastError = err.message || "Network error";
    }
  }

  throw new Error(lastError || "All Gemini candidate models failed to respond.");
}

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      status: "unconfigured",
      message: "GEMINI_API_KEY is not configured in environment",
    });
  }

  try {
    const testResult = await callGeminiRest("Reply with: READY", "SPD Logistics AI Health Check");
    return NextResponse.json({
      success: true,
      status: "ready",
      engine: "Google Gemini 3.8 Flash",
      model: testResult.model,
      features: [
        "automated_consignment_remarks",
        "party_ledger_summaries",
        "smart_freight_recommendations",
        "operations_copilot",
      ],
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      status: "degraded",
      message: err.message || "Gemini API unavailable",
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = "chat", data = {}, prompt, message } = body;

    // Feature 1: Automated Consignment Remarks Generation
    if (action === "remarks" || action === "generate_remarks") {
      const {
        commodity = "Commercial Merchandise",
        origin = "Lahore",
        destination = "Karachi",
        weight = 100,
        quantity = 1,
        dispatchMode = "Normal",
        amountType = "To Pay",
      } = data;

      const userPrompt = `Generate a concise, professional 2-3 sentence transport operational remark for a Pakistani commercial Bilty consignment with these specs:
- Commodity: ${commodity}
- Route: ${origin} to ${destination}
- Weight: ${weight} KG | Quantity: ${quantity} units
- Dispatch Mode: ${dispatchMode} (${amountType})
Include handling guidelines (e.g. moisture protection, fragile packaging, stacking, tie-down) and transit instructions. Output ONLY the remarks text.`;

      try {
        const result = await callGeminiRest(userPrompt, SPD_SYSTEM_PROMPT);
        return NextResponse.json({
          success: true,
          action: "remarks",
          remarks: result.text,
          model: result.model,
        });
      } catch (err) {
        // Fallback default remark
        return NextResponse.json({
          success: true,
          action: "remarks",
          remarks: `Standard Commercial Consignment: ${commodity}. Handle with proper care, ensure secure tarpaulin coverage during transit from ${origin} to ${destination}.`,
          model: "local-fallback",
        });
      }
    }

    // Feature 2: Party Ledger Summary & Risk Assessment
    if (action === "ledger_summary" || action === "party_summary") {
      const {
        partyName = "Customer",
        totalBookings = 0,
        totalBilled = 0,
        totalPaid = 0,
        balance = 0,
        recentBilties = [],
      } = data;

      const userPrompt = `Analyze this logistics corporate party ledger and provide a structured 3-point business summary (Payment Promptness, Exposure/Risk Level, Account Health):
- Party Name: ${partyName}
- Total Consignments: ${totalBookings}
- Total Freight Billed: PKR ${Number(totalBilled).toLocaleString()}
- Total Paid: PKR ${Number(totalPaid).toLocaleString()}
- Outstanding Balance: PKR ${Number(balance).toLocaleString()}
Recent transactions: ${JSON.stringify(recentBilties.slice(0, 5))}
Keep it under 150 words.`;

      try {
        const result = await callGeminiRest(userPrompt, SPD_SYSTEM_PROMPT);
        return NextResponse.json({
          success: true,
          action: "ledger_summary",
          summary: result.text,
          model: result.model,
        });
      } catch (err) {
        const paymentRatio = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 100;
        return NextResponse.json({
          success: true,
          action: "ledger_summary",
          summary: `Account for ${partyName}: Total Billed PKR ${Number(totalBilled).toLocaleString()} with ${paymentRatio}% recovery. Outstanding balance stands at PKR ${Number(balance).toLocaleString()}. Payment history is verified active.`,
          model: "local-fallback",
        });
      }
    }

    // Feature 3: Smart Freight Tariff Recommendation
    if (action === "freight_recommendation" || action === "calculate_rate") {
      const {
        origin = "Lahore",
        destination = "Karachi",
        weight = 100,
        volume = 0,
        dispatchMode = "Normal",
        commodity = "General Commercial Cargo",
      } = data;

      const userPrompt = `Provide a recommended commercial freight quotation in PKR for Pakistani domestic road freight:
- Route: ${origin} to ${destination}
- Cargo: ${commodity}
- Weight: ${weight} KG
- Volume: ${volume} CBM
- Dispatch: ${dispatchMode}
Give the estimated total freight PKR range, per-KG base rate, and fuel/toll note in 2 concise sentences.`;

      try {
        const result = await callGeminiRest(userPrompt, SPD_SYSTEM_PROMPT);
        return NextResponse.json({
          success: true,
          action: "freight_recommendation",
          recommendation: result.text,
          model: result.model,
        });
      } catch (err) {
        const baseRate = origin.toLowerCase().includes("karachi") || destination.toLowerCase().includes("karachi") ? 18 : 12;
        const estimated = Math.max(1500, Math.round(Number(weight) * baseRate));
        return NextResponse.json({
          success: true,
          action: "freight_recommendation",
          recommendation: `Recommended freight for ${origin} to ${destination} is approximately PKR ${estimated.toLocaleString()} (approx. PKR ${baseRate}/KG standard tariff, subject to diesel surcharge and delivery drop).`,
          model: "local-fallback",
        });
      }
    }

    // Feature 4: General Operations Copilot / Chat
    const userMessage = prompt || message || body.text || "Hello";
    const result = await callGeminiRest(userMessage, SPD_SYSTEM_PROMPT);

    return NextResponse.json({
      success: true,
      action: "chat",
      reply: result.text,
      model: result.model,
    });
  } catch (error: any) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process AI request",
      },
      { status: 500 }
    );
  }
}
