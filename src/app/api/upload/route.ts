import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Max allowed file size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed mime types
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
]);

// Allowed extensions
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/**
 * Validate image buffer magic bytes
 */
function isValidImageMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }

  // WEBP: RIFF....WEBP (bytes 0-3: 'RIFF', bytes 8-11: 'WEBP')
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return true;
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in to upload photos.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided. Please select an image to upload.' },
        { status: 400 }
      );
    }

    // 1. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds the 5MB limit. Please upload a smaller image.' },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'The uploaded file is empty. Please select a valid image.' },
        { status: 400 }
      );
    }

    // 2. Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Only JPG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // 3. Validate file extension
    const originalName = file.name || 'image.jpg';
    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file extension. Only .jpg, .jpeg, .png, and .webp are accepted.' },
        { status: 400 }
      );
    }

    // 4. Validate buffer magic bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidImageMagicBytes(buffer)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or corrupted image content. Only valid JPG, PNG, and WebP images are accepted.' },
        { status: 400 }
      );
    }

    // 5. Generate secure unique filename
    const randomHash = crypto.randomBytes(8).toString('hex');
    const safeExt = ext === '.jpeg' ? '.jpg' : ext;
    const filename = `profile_${Date.now()}_${randomHash}${safeExt}`;

    // 6. Ensure target directory exists in public/uploads/profiles
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    // Also sync to standalone directory if running standalone build
    const standaloneDir = path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads', 'profiles');
    try {
      if (fs.existsSync(path.join(process.cwd(), '.next', 'standalone'))) {
        await fs.promises.mkdir(standaloneDir, { recursive: true });
        await fs.promises.writeFile(path.join(standaloneDir, filename), buffer);
      }
    } catch {
      // Ignore sync error if standalone dir is not present
    }

    const publicUrl = `/uploads/profiles/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
    });
  } catch (error: any) {
    console.error('Error handling upload:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error occurred while uploading the file.' },
      { status: 500 }
    );
  }
}
