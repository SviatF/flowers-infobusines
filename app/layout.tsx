import type { ReactNode } from 'react';
import { getCaptureDocument } from '@/lib/capture';
import './globals.css';

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const capture = getCaptureDocument();

  return (
    <html lang={capture.lang} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
