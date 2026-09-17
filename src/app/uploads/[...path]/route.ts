import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const relativePath = (params.path || []).join('/');

    // Prevent directory traversal attacks
    const normalized = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
    if (normalized.includes('..')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Try finding the file in public/uploads or standalone public/uploads
    const candidates = [
      path.join(process.cwd(), 'public', 'uploads', normalized),
      path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads', normalized),
    ];

    let targetFilePath = '';
    for (const candidate of candidates) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        targetFilePath = candidate;
        break;
      }
    }

    if (!targetFilePath) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(targetFilePath);
    const ext = path.extname(targetFilePath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error serving upload asset:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
