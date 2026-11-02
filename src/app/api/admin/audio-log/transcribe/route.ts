import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const auth = await validateAdminSession(request, ['SUPER_ADMIN', 'ADMIN', 'STAFF']);
    if (auth.errorResponse) return auth.errorResponse;
    const { session } = auth;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          status: 'unconfigured',
          error:
            'Groq Whisper AI speech-to-text transcription requires GROQ_API_KEY configured in the server environment. Add GROQ_API_KEY to your .env file.',
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided for transcription' },
        { status: 400 }
      );
    }

    // Call Groq Whisper API
    const groqFormData = new FormData();
    groqFormData.append('file', file, file.name || 'audio.webm');
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('language', 'ur'); // Supports Urdu and English
    groqFormData.append('temperature', '0.2');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: groqFormData,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!groqRes.ok) {
      const errData = await groqRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: errData?.error?.message || `Groq Whisper API returned HTTP ${groqRes.status}`,
        },
        { status: 502 }
      );
    }

    const data = await groqRes.json();
    return NextResponse.json({
      success: true,
      text: data.text || '',
      model: 'whisper-large-v3',
    });
  } catch (err: any) {
    console.error('Transcription error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.name === 'AbortError' ? 'Transcription request timed out' : err.message || 'Transcription failed',
      },
      { status: 500 }
    );
  }
}
