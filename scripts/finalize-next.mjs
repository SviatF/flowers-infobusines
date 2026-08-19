import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'index.html');

if (!fs.existsSync(sourcePath)) {
  throw new Error('index.html is missing; cleanup may have already been applied.');
}

const blockedScriptTokens = [
  'rightmessage',
  'googletagmanager',
  "gtag('",
  'gtag("',
  '__framer_force_showing_editorbar_since',
  'framer.com/edit',
];

function extractInner(html, tag) {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1] ?? '';
}

function extractAttribute(source, attribute) {
  const match = source.match(new RegExp(`${attribute}=["']([^"']*)["']`, 'i'));
  return match?.[1] ?? '';
}

function escapeAttribute(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function freezeScripts(html) {
  return html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (_full, rawAttributes, code) => {
    const fingerprint = `${rawAttributes} ${code}`.toLowerCase();
    if (blockedScriptTokens.some((token) => fingerprint.includes(token))) return '';

    const typeMatch = rawAttributes.match(/\s+type\s*=\s*(["'])(.*?)\1/i);
    const originalType = typeMatch?.[2] ?? '';
    const attributes = typeMatch ? rawAttributes.replace(typeMatch[0], '') : rawAttributes;

    return `<script type="application/x-captured-script" data-captured-type="${escapeAttribute(originalType)}"${attributes}>${code}</script>`;
  });
}

function extractStyles(head) {
  const styles = [];
  const pattern = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
  let match;

  while ((match = pattern.exec(head)) !== null) {
    const attributes = match[1] ?? '';
    if (/data-rightmessage/i.test(attributes)) continue;
    styles.push(match[2] ?? '');
  }

  return styles.join('\n');
}

function extractHeadScripts(head) {
  const scripts = head.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) ?? [];
  return freezeScripts(scripts.join('\n'));
}

function sanitizeBody(body) {
  let cleaned = body;
  const injectedRightMessage = cleaned.lastIndexOf('<div><div class="rm-c">');
  if (injectedRightMessage >= 0) cleaned = cleaned.slice(0, injectedRightMessage);

  cleaned = cleaned.replace(
    /<iframe\b[^>]*id=["']__framer-editorbar["'][\s\S]*?<\/iframe>/gi,
    '',
  );

  return freezeScripts(cleaned);
}

const html = fs.readFileSync(sourcePath, 'utf8');
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

const capture = {
  lang: extractAttribute(htmlOpen, 'lang') || 'en',
  title,
  description,
  styles: extractStyles(head),
  body: `${extractHeadScripts(head)}\n${sanitizeBody(rawBody)}`,
};

fs.writeFileSync(
  path.join(root, 'lib/generated-capture.json'),
  `${JSON.stringify(capture)}\n`,
  'utf8',
);

fs.writeFileSync(
  path.join(root, 'lib/capture.ts'),
  `import capture from './generated-capture.json';\n\nexport type CaptureDocument = {\n  lang: string;\n  title: string;\n  description: string;\n  styles: string;\n  body: string;\n};\n\nexport function getCaptureDocument(): CaptureDocument {\n  return capture;\n}\n`,
  'utf8',
);

for (const legacyFile of ['index.html', 'design.json', 'README.txt']) {
  const filePath = path.join(root, legacyFile);
  if (fs.existsSync(filePath)) fs.rmSync(filePath);
}

fs.writeFileSync(
  path.join(root, 'README.md'),
  `# Flowers Infobusiness — Next.js SSR\n\nProduction-ready Next.js App Router project with server-side rendering.\n\n## Stack\n\n- Next.js 16.3\n- React 19.2.7\n- TypeScript\n- Node.js 20.9+\n\n## Commands\n\n\`\`\`bash\nnpm install\nnpm run dev\nnpm run typecheck\nnpm run build\nnpm start\n\`\`\`\n\n## Structure\n\n- \`app/\` — App Router pages, layout, and server route handlers\n- \`components/\` — client-side compatibility components\n- \`lib/generated-capture.json\` — generated page payload consumed by Next.js; no standalone legacy HTML is required at runtime\n- \`assets/\` — captured fonts, images, and JavaScript resources served by the Next.js asset route\n\nThe old standalone \`index.html\`, \`design.json\`, and capture README have been removed. The repository now deploys as a single Next.js application.\n`,
  'utf8',
);

console.log('Next.js cleanup generated successfully.');
