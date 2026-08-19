import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const assetRoot = path.resolve(process.cwd(), 'assets');

const contentTypes: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function resolveAssetPath(parts: string[]) {
  const filePath = path.resolve(assetRoot, ...parts);
  const relativePath = path.relative(assetRoot, filePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null;
  }

  return filePath;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  const filePath = resolveAssetPath(params.path);

  if (!filePath) {
    return new Response('Bad request', { status: 400 });
  }

  try {
    const file = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();

    return new Response(new Uint8Array(file), {
      status: 200,
      headers: {
        'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
