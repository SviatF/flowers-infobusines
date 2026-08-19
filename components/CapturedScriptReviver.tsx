'use client';

import { useEffect } from 'react';

export function CapturedScriptReviver() {
  useEffect(() => {
    let cancelled = false;

    async function reviveScripts() {
      const root = document.getElementById('captured-site');
      if (!root) return;

      const placeholders = Array.from(
        root.querySelectorAll<HTMLScriptElement>(
          'script[type="application/x-captured-script"]',
        ),
      );

      for (const placeholder of placeholders) {
        if (cancelled || !placeholder.isConnected) break;

        const script = document.createElement('script');
        const capturedType = placeholder.dataset.capturedType;

        for (const attribute of Array.from(placeholder.attributes)) {
          if (attribute.name === 'type' || attribute.name === 'data-captured-type') {
            continue;
          }
          script.setAttribute(attribute.name, attribute.value);
        }

        if (capturedType) {
          script.type = capturedType;
        }

        script.textContent = placeholder.textContent;

        const shouldWait = Boolean(script.src) || script.type === 'module';

        if (shouldWait) {
          await new Promise<void>((resolve) => {
            script.addEventListener('load', () => resolve(), { once: true });
            script.addEventListener('error', () => resolve(), { once: true });
            placeholder.replaceWith(script);
          });
        } else {
          placeholder.replaceWith(script);
        }
      }
    }

    void reviveScripts();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
