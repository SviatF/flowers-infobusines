# Flowers Infobusiness — Next.js SSR

This repository now runs the captured single-page site through Next.js App Router with request-time server rendering.

## Runtime

- Next.js 16.3
- React 19.2
- TypeScript
- Node.js 20.9+

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm start
```

## How the migration works

The original `index.html` remains the visual source of truth. `lib/capture.ts` reads it on the server, extracts the captured CSS and body markup, removes third-party tracking/editor runtime noise, and renders the result from `app/page.tsx`.

The existing `assets/` directory remains unchanged. `app/assets/[...path]/route.ts` serves the captured fonts, images, and JavaScript through Next.js so the original relative asset URLs continue to work without duplicating binary files into `public/`.

`CapturedScriptReviver` replays the retained Framer runtime scripts after React hydration so interactive behavior can continue without executing legacy scripts during hydration itself.

## Next step

The SSR adapter intentionally preserves visual fidelity first. Individual captured sections can now be progressively replaced with native React Server/Client Components without changing the deployment architecture.
