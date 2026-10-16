import { NextResponse } from 'next/server';

const CANDIDATE_MODELS = [
  'gemini-1.5-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-2.0-flash',
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userQuery = body.query || body.message || '';
    if (!userQuery.trim()) {
      return NextResponse.json({ reply: 'Baraye meherbani apna sawal likhein ya mic se bolein.' });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const promptText = `You are the authentic, intelligent operations manager of 'SUPER PAK DATA WALE GOODS TRANSPORT CO.'. 
Respond directly, accurately, and naturally in polite Roman Urdu / Hindi.
Answer whatever the user asks (e.g. cash book guidance, balance checks, bilty tips, diesel records, navigation help).
NEVER repeat canned greeting lists or fixed templates.
User question: ${userQuery}`;

    let reply = '';

    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: promptText }],
                },
              ],
              generationConfig: {
                temperature: 0.35,
                maxOutputTokens: 1000,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim().length > 0) {
            reply = text.trim();
            break;
          }
        }
      } catch (err) {
        console.warn(`[Gemini API] Failed on model ${model}:`, err);
      }
    }

    if (!reply) {
      reply = 'Maaf kijiye, abhi response process nahi ho saka. Dobara check karein.';
    }

    return NextResponse.json({ reply, success: true });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ reply: 'System error: Gemini API se rabta nahi ho saka.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ready', engine: 'Google Gemini 1.5 Flash' });
}
