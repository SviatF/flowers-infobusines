# Flowers Infobusiness — Next.js SSR

Production-ready Next.js App Router project with server-side rendering.

## Stack

- Next.js 16.3
- React 19.2.7
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

## Structure

- `app/` — App Router pages, layout, and server route handlers
- `components/` — client-side compatibility components
- `lib/generated-capture.json` — generated page payload consumed by Next.js; no standalone legacy HTML is required at runtime
- `assets/` — captured fonts, images, and JavaScript resources served by the Next.js asset route

The old standalone `index.html`, `design.json`, and capture README have been removed. The repository now deploys as a single Next.js application.
