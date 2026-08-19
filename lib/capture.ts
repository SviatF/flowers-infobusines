import fs from 'node:fs';
import path from 'node:path';

type CaptureDocument = {
  lang: string;
  title: string;
  description: string;
  styles: string;
  body: string;
};

const capturePath = path.join(process.cwd(), 'index.html');
let cachedCapture: CaptureDocument | null = null;

const blockedScriptTokens = [
  'rightmessage',
  'googletagmanager',
  'events.framer.com',
  "gtag('",
  'gtag("',
  '__framer_force_showing_editorbar_since',
  'framer.com/edit',
];

function extractInner(html: string, tag: string) {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1] ?? '';
}

function extractAttribute(source: string, attribute: string) {
  const match = source.match(new RegExp(`${attribute}=["']([^"']*)["']`, 'i'));
  return match?.[1] ?? '';
}

function escapeAttribute(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function freezeScripts(html: string) {
  return html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (full, rawAttributes: string, code: string) => {
    const fingerprint = `${rawAttributes} ${code}`.toLowerCase();
    if (blockedScriptTokens.some((token) => fingerprint.includes(token))) {
      return '';
    }

    const typeMatch = rawAttributes.match(/\s+type\s*=\s*(["'])(.*?)\1/i);
    const originalType = typeMatch?.[2] ?? '';
    const attributes = typeMatch
      ? rawAttributes.replace(typeMatch[0], '')
      : rawAttributes;

    return `<script type="application/x-captured-script" data-captured-type="${escapeAttribute(originalType)}"${attributes}>${code}</script>`;
  });
}

function extractStyles(head: string) {
  const styles: string[] = [];
  const pattern = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(head)) !== null) {
    const attributes = match[1] ?? '';
    if (/data-rightmessage/i.test(attributes)) continue;
    styles.push(match[2] ?? '');
  }

  return styles.join('\n');
}

function extractHeadScripts(head: string) {
  const scripts = head.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) ?? [];
  return freezeScripts(scripts.join('\n'));
}

function sanitizeBody(body: string) {
  let cleaned = body;

  const injectedRightMessage = cleaned.lastIndexOf('<div><div class="rm-c">');
  if (injectedRightMessage >= 0) {
    cleaned = cleaned.slice(0, injectedRightMessage);
  }

  cleaned = cleaned.replace(
    /<iframe\b[^>]*id=["']__framer-editorbar["'][\s\S]*?<\/iframe>/gi,
    '',
  );

  return freezeScripts(cleaned);
}

export function getCaptureDocument(): CaptureDocument {
  if (cachedCapture) return cachedCapture;

  const html = fs.readFileSync(capturePath, 'utf8');
  const htmlOpen = html.match(/<html\b([^>]*)>/i)?.[1] ?? '';
  const head = extractInner(html, 'head');
  const rawBody = extractInner(html, 'body');

  const title = head.match(/<title>([\s\S]*?)<\/title>/i)?.[1]
    ?.replaceAll('&amp;', '&')
    .trim() ?? 'Flowers Infobusiness';

  const description = head.match(
    /<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/i,
  )?.[1]
    ?.replaceAll('&amp;', '&')
    .trim() ?? '';

  cachedCapture = {
    lang: extractAttribute(htmlOpen, 'lang') || 'en',
    title,
    description,
    styles: extractStyles(head),
    body: `${extractHeadScripts(head)}\n${sanitizeBody(rawBody)}`,
  };

  return cachedCapture;
}
