import { NextRequest, NextResponse } from "next/server";

const CANDIDATE_MODELS = [
  "gemini-1.5-flash",
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
];

async function callDirectGemini(
  userMessage: string,
  operationalContext: string,
  apiKey: string
): Promise<{ reply: string; model: string }> {
  let lastError = "";

  const systemPrompt = `Aap 'Super Pak Data Wale Goods Transport Co.' ke smart logistics assistant hain. Aap user ke har sawal ka seedha, aasan aur mukhtasir jawab Roman Urdu / Urdu mein dein. Agar user pooche 'Cashbook kidhar hai?', 'Balance kahan hai?', 'Diesel ka hisab', ya koi bhi sawal pooche, to foran seedha aur munasib guide karein. KISI BHI SURAT MEIN canned / hardcoded template repeat NAHI karna.

Hawaalay aur Navigation Guide (Agar user software mein rasta ya page pooche to foran guide karein):
- Cashbook kidhar hai: Navigation menu mein 'Cash Book' (/admin/cash-book) par click karein. Yahan rozana ki cash aamad aur kharchay darj hotay hain.
- Balance kahan hai / Party khatay: Customer Ledgers (/admin/customers) aur Cash Book (/admin/cash-book) par live balance aur accounts mojood hain.
- Diesel ka hisab: 'Cash Book' (/admin/cash-book) mein Diesel category entry se hisab hota hai, ya 'Trip Challan' (/admin/challan) mein truck advance hisab dekhein.
- Bilty Booking: 'Bilty Booking' (/admin/bilty/new) par nayi bilty book karein aur 4-sheet dossier print karein.
- Challan / Gari rawangi: 'Challan in Transit' (/admin/challan-in-transit) par truck manifest print karein aur live trips check karein.
- Fleet / Gadiyan: 'Fleet Management' (/admin/fleet) par tamam commercial vehicles ki list hai.
- Consignment Tracking: Live tracking page (/tracking) par Bilty number ya QR code scan kar ke consignment track karein.

Live System Snapshot:
${operationalContext}

Action Generation Rules:
- Agar user nayi bilty banane ya maal book karne ka kahe, to jawab ke aakhir mein structured JSON dein:
\`\`\`json
{
  "action": "CREATE_BILTY",
  "data": {
    "biltyNumber": "SPD-2026-XXXX",
    "sender": "Consignor Name",
    "receiver": "Consignee Name",
    "origin": "Karachi Hawksbay Hub",
    "destination": "Lahore Saggian Hub",
    "freight": 45000,
    "packages": 60,
    "commodity": "Industrial Goods",
    "weight": "1800 kg",
    "vehicleNo": "TLR-786",
    "paymentType": "TO_PAY"
  }
}
\`\`\`
- Agar user challan banane ya gari rawana karne ka kahe:
\`\`\`json
{
  "action": "CREATE_CHALLAN",
  "data": {
    "challanNumber": "CHL-2026-XXXX",
    "truckNumber": "TLR-992",
    "driverName": "Muhammad Tariq Khan",
    "driverPhone": "0300-8451290",
    "origin": "Karachi Mauripur / Hawksbay",
    "destination": "Lahore Saggian Terminal",
    "totalTruckHire": 95000,
    "advancePaid": 45000,
    "balancePayable": 50000
  }
}
\`\`\`
- Agar user kharcha ya aamad add karne ka kahe:
\`\`\`json
{
  "action": "ADD_CASHBOOK_TRANSACTION",
  "data": {
    "type": "OUT",
    "amount": 5000,
    "category": "Diesel",
    "party": "Linehaul Fleet Driver",
    "description": "Operational voucher"
  }
}
\`\`\`
`;

  const promptText = `${systemPrompt}\n\nUser Question/Command:\n${userMessage}`;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: promptText }],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 1200,
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

  throw new Error(lastError || "Gemini candidate models failed");
}

function parseStructuredAction(text: string): { type: string; data: any } | null {
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.action) {
        return { type: parsed.action, data: parsed.data || parsed };
      }
      if (parsed.type) {
        return { type: parsed.type, data: parsed.data || parsed };
      }
    }
  } catch {}
  return null;
}

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  return NextResponse.json({
    success: true,
    status: apiKey ? "ready" : "unconfigured",
    engine: "Google Gemini (Live Direct Assistant)",
    features: [
      "pure_gemini_natural_language",
      "no_canned_templates",
      "dynamic_bilty_action_payloads",
      "dynamic_challan_action_payloads",
      "cashbook_voucher_recording",
      "live_profit_loss_and_ledger_queries",
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
        { success: false, error: "Khali sawal ya command darj nahi kiya ja sakta." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API key is not configured in environment.",
        },
        { status: 500 }
      );
    }

    // Build operational context snapshot for accurate Gemini calculations
    let operationalContextSnippet = "\n--- LIVE SPD LOGISTICS OPERATIONAL SNAPSHOT ---\n";

    const inVal = Number(context.todayCashIn) || 0;
    const outVal = Number(context.todayCashOut) || 0;
    const netVal = inVal - outVal;
    operationalContextSnippet += `[Cash Book Today]:\n- Cash In (Aamad): PKR ${inVal.toLocaleString()}\n- Cash Out (Kharchay): PKR ${outVal.toLocaleString()}\n- Net Cash Balance: PKR ${netVal.toLocaleString()} (${netVal >= 0 ? "Profit" : "Deficit"})\n`;

    if (Array.isArray(context.cashBooks) && context.cashBooks.length > 0) {
      const recent = context.cashBooks.slice(0, 10).map((c: any) => ({
        date: c.date,
        type: c.type || c.entryType,
        party: c.partyName || c.party,
        category: c.category,
        amount: c.amount,
        desc: c.description || c.notes,
      }));
      operationalContextSnippet += `[Recent Cash Book Entries]:\n${JSON.stringify(recent, null, 2)}\n`;
    }

    if (Array.isArray(context.bilties) && context.bilties.length > 0) {
      const totalFreight = context.bilties.reduce(
        (sum: number, b: any) => sum + (Number(b.totalAmount || b.freight) || 0),
        0
      );
      operationalContextSnippet += `[Active Bilties]:\n- Total Bilties in System: ${context.bilties.length}\n- Total Accumulated Freight Value: PKR ${totalFreight.toLocaleString()}\n`;
    }

    if (Array.isArray(context.challans) && context.challans.length > 0) {
      const totalTripCost = context.challans.reduce(
        (sum: number, ch: any) =>
          sum + (Number(ch.totalTruckHire || ch.truckFreight || ch.advancePaid) || 0),
        0
      );
      operationalContextSnippet += `[Active Trip Challans]:\n- Active Trips: ${context.challans.length}\n- Total Truck Hire Outflow: PKR ${totalTripCost.toLocaleString()}\n`;
    }

    if (Array.isArray(context.customers) && context.customers.length > 0) {
      const partySummary = context.customers.slice(0, 20).map((cust: any) => ({
        name: cust.name || cust.companyName,
        phone: cust.phone,
        city: cust.city,
        balance: cust.balance || 0,
        ntn: cust.ntn,
      }));
      operationalContextSnippet += `[Registered Party Ledgers / Customers]:\n${JSON.stringify(partySummary, null, 2)}\n`;
    }

    const geminiResult = await callDirectGemini(
      userText,
      operationalContextSnippet,
      apiKey
    );

    const parsedAction = parseStructuredAction(geminiResult.reply);

    return NextResponse.json({
      success: true,
      reply: geminiResult.reply,
      action: parsedAction,
      model: geminiResult.model,
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
