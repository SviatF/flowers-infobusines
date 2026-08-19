import type { Metadata } from 'next';
import { CapturedScriptReviver } from '@/components/CapturedScriptReviver';
import { getCaptureDocument } from '@/lib/capture';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function generateMetadata(): Metadata {
  const capture = getCaptureDocument();

  return {
    title: capture.title,
    description: capture.description || undefined,
  };
}

export default function HomePage() {
  const capture = getCaptureDocument();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: capture.styles }} />
      <div
        id="captured-site"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: capture.body }}
      />
      <CapturedScriptReviver />
    </>
  );
}
