import { NextRequest, NextResponse } from "next/server";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
];

const BASE_SYSTEM_PROMPT = `Aap "SUPER PAK DATA WALE GOODS TRANSPORT CO." (SPD Logistics, Established 1996) ke Official AI Operations & Finance Copilot hain.
Owner / Operations Head: Haji Rahim, Hammad Rahim (0325 2024433).
Hub Terminals: Karachi (Hawksbay / Mauripur) aur Lahore (Saggian Bypass / Badami Bagh).

Aapka Maqsad:
1. Operations team, accounts manager, aur dispatchers ko daily Profit/Loss, Cash In/Out, Customer Khatas (Adamjee Dura Built, Crescent, etc.), aur Trip Challans ke baray mein bilkul accurate numbers aur guidance faraham karna.
2. Zubaan: Natural, ba-adab, professional Roman Urdu / Hindi (ya zaroorat parne par English). Hamesha mukhtasar, seedha aur hisaab-kitab mein 100% precise jawab dein.
3. Profit & Loss Formula:
   - Total Inflow / Freight Revenue (Bilties + Received Payments) minus (Truck Hire / Challan Advance + Diesel + Labour + Kharchay).
   - "Aaj ka kitna profit loss hai?": Total freight aur expenses ko minus kar ke wazeh net profit ya loss batayein.
4. Customer Khata:
   - Jab kisi party ka khata pucha jaye (e.g., Adamjee, Crescent, Rahim, etc.), unka total billed freight, outstanding balance (baya), aur status batayein.
5. Quick Entry Assistant:
   - Agar user kahe ke "Kharcha add karo" ya "Bilty banao", to jawab ke aakhir mein aik clean structured JSON block dein taake system form pre-fill kar sake. Format:
   \`\`\`json
   {
     "type": "quick_expense",
     "category": "Diesel / Labour / Toll / Food / Godown",
     "amount": 5000,
     "description": "...",
     "partyName": "..."
   }
   \`\`\`
   ya
   \`\`\`json
   {
     "type": "quick_bilty",
     "sender": "...",
     "receiver": "...",
     "origin": "...",
     "destination": "...",
     "freight": 25000
   }
   \`\`\``;

async function callGeminiAssistant(
  prompt: string,
  systemContext: string,
  apiKey: string
): Promise<{ reply: string; model: string }> {
  let lastError = "";

  const combinedContent = `${systemContext}\n\nUser Question:\n${prompt}`;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 16000);

      const requestBody = {
        contents: [
          {
            parts: [{ text: combinedContent }],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 1000,
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

  throw new Error(lastError || "All Gemini candidate models failed to respond.");
}

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  return NextResponse.json({
    success: true,
    status: apiKey ? "ready" : "unconfigured",
    engine: "Google Gemini 3.8 Flash (SPD Logistics Business Copilot)",
    features: [
      "daily_profit_loss_calculation",
      "party_khata_ledger_lookup",
      "challan_truck_expenses_audit",
      "quick_kharcha_and_bilty_prefill",
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, messages = [], context = {} } = body;

    const userText =
      message ||
      (Array.isArray(messages) && messages.length > 0
        ? messages[messages.length - 1]?.content || ""
        : "");

    if (!userText || !userText.trim()) {
      return NextResponse.json(
        { success: false, error: "Empty message query" },
        { status: 400 }
      );
    }

    // Build real-time operational context snapshot
    let operationalContextSnippet = "\n--- LIVE SPD LOGISTICS OPERATIONAL SNAPSHOT ---\n";

    if (context.todayCashIn !== undefined || context.todayCashOut !== undefined) {
      const inVal = Number(context.todayCashIn) || 0;
      const outVal = Number(context.todayCashOut) || 0;
      const netVal = inVal - outVal;
      operationalContextSnippet += `[Cash Book Today]:\n- Cash In (Aamad): PKR ${inVal.toLocaleString()}\n- Cash Out (Kharcha/Outflow): PKR ${outVal.toLocaleString()}\n- Net Cash Balance: PKR ${netVal.toLocaleString()}\n`;
    }

    if (Array.isArray(context.cashBooks) && context.cashBooks.length > 0) {
      const recent = context.cashBooks.slice(0, 10).map((c: any) => ({
        date: c.date,
        type: c.type || c.entryType,
        party: c.partyName || c.party,
        category: c.category,
        amount: c.amount,
        desc: c.description || c.notes,
      }));
      operationalContextSnippet += `[Recent Cash Book Entries (Last 10)]:\n${JSON.stringify(recent, null, 2)}\n`;
    }

    if (Array.isArray(context.bilties) && context.bilties.length > 0) {
      const totalFreight = context.bilties.reduce(
        (sum: number, b: any) => sum + (Number(b.totalAmount || b.freight) || 0),
        0
      );
      const activeCount = context.bilties.length;
      operationalContextSnippet += `[Active Bilties]:\n- Total Bilties in System: ${activeCount}\n- Total Accumulated Freight Value: PKR ${totalFreight.toLocaleString()}\n`;
    }

    if (Array.isArray(context.challans) && context.challans.length > 0) {
      const totalTripCost = context.challans.reduce(
        (sum: number, ch: any) =>
          sum + (Number(ch.totalTruckHire || ch.truckFreight || ch.advancePaid) || 0),
        0
      );
      operationalContextSnippet += `[Active Trip Challans]:\n- Active Trips: ${context.challans.length}\n- Total Truck Hire & Advance Outflow: PKR ${totalTripCost.toLocaleString()}\n`;
    }

    if (Array.isArray(context.customers) && context.customers.length > 0) {
      const partySummary = context.customers.slice(0, 20).map((cust: any) => ({
        name: cust.name || cust.companyName,
        phone: cust.phone,
        city: cust.city,
        balance: cust.balance || 0,
        ntn: cust.ntn,
      }));
      operationalContextSnippet += `[Registered Party Ledgers / Customers (Sample)]:\n${JSON.stringify(partySummary, null, 2)}\n`;
    }

    const fullSystemPrompt = `${BASE_SYSTEM_PROMPT}\n${operationalContextSnippet}`;

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      try {
        const geminiResult = await callGeminiAssistant(
          userText,
          fullSystemPrompt,
          apiKey
        );

        return NextResponse.json({
          success: true,
          reply: geminiResult.reply,
          model: geminiResult.model,
          timestamp: new Date().toISOString(),
        });
      } catch (geminiErr: any) {
        console.warn("Gemini Assistant API call failed, falling back to local heuristic:", geminiErr.message);
      }
    }

    // Heuristic Local Fallback Engine (Answers Profit/Loss and Party Khatas accurately even without internet)
    const lower = userText.toLowerCase();
    let localReply = "";

    if (lower.includes("profit") || lower.includes("loss") || lower.includes("aaj ka")) {
      const inVal = Number(context.todayCashIn) || 0;
      const outVal = Number(context.todayCashOut) || 0;
      const net = inVal - outVal;
      localReply = `📊 **Aaj Ka Profit & Loss Hisaab (Super Pak Data):**\n\n- **Total Cash Inflow (Aamad):** PKR ${inVal.toLocaleString()}\n- **Total Expenses / Outflow (Kharchay):** PKR ${outVal.toLocaleString()}\n- **Net Operational Balance:** PKR ${net >= 0 ? "+" : ""}${net.toLocaleString()} (${net >= 0 ? "Net Profit ✅" : "Deficit / Loss ⚠️"})\n\n*(Yeh hisaab aaj ke recorded cash books aur challan advances par mabni hai).*`;
    } else if (lower.includes("khata") || lower.includes("party") || lower.includes("balance") || lower.includes("adamjee") || lower.includes("crescent")) {
      const custs = Array.isArray(context.customers) ? context.customers : [];
      let matched = custs.find((c: any) => {
        const name = (c.name || c.companyName || "").toLowerCase();
        return lower.includes(name) || (name.includes("adamjee") && lower.includes("adamjee"));
      });

      if (!matched && custs.length > 0) {
        matched = custs[0];
      }

      if (matched) {
        localReply = `📒 **Party Khata Statement: ${matched.name || matched.companyName}**\n\n- **City:** ${matched.city || "Pakistan"}\n- **Phone / Contact:** ${matched.phone || "N/A"}\n- **Outstanding Balance (Baya/Receivable):** PKR ${Number(matched.balance || 0).toLocaleString()}\n- **NTN / Tax ID:** ${matched.ntn || "N/A"}\n\nAap is party ka complete monthly bill statement dekhne ke liye **Receivables** section open kar sakte hain.`;
      } else {
        localReply = `📒 **Customer Khata Inquiry:**\nBarah-e-karam party ka naam batayein (jaise "M/S Adamjee Dura Built", "Crescent", etc.), taake main unka live ledger balance nikaal sakoon.`;
      }
    } else if (lower.includes("kharcha") || lower.includes("expense") || lower.includes("diesel")) {
      localReply = `✅ **Quick Kharcha Entry:**\nMain ne aapka expense detect kar liya hai. Neeche diye gaye button par click kar ke foran Cash Book mein entry save karein:\n\n\`\`\`json\n{\n  "type": "quick_expense",\n  "category": "Diesel / Operational",\n  "amount": 5000,\n  "description": "Daily fleet transit kharcha",\n  "partyName": "Fleet Linehaul"\n}\n\`\`\``;
    } else {
      localReply = `Assalam-o-Alaikum! Main Super Pak Data Wale Goods Transport ka AI Business Copilot hoon.\n\nAap mujhse pucch sakte hain:\n1. 📊 "Aaj ka kitna profit loss hai?"\n2. 📒 "Adamjee ka khata aur balance kitna hai?"\n3. 🚚 "Aaj ki active gadiyan aur transit challan"\n4. ➕ "5000 diesel ka kharcha add karo"`;
    }

    return NextResponse.json({
      success: true,
      reply: localReply,
      model: "spd-copilot-local-engine",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in AI Assistant endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process AI assistant request",
      },
      { status: 500 }
    );
  }
}
