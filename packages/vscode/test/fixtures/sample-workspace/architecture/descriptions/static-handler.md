The static + SPA-fallback handler set up conditionally in [packages/server/src/server.ts](packages/server/src/server.ts). Active only in the published/built CLI (where `dist/public/` exists) — omitted during `pnpm dev`, when Vite serves the UI on port 5173 and proxies `/api/*` back to Express.

## Responsibilities
- `express.static(publicDir)` — serve the bundled React UI's hashed JS/CSS assets.
- Catch-all `GET *` that falls through to `index.html` for any non-`/api/*` path, so hash-based client routes (`#/diagram/<slug>`) resolve on refresh/deep-link.

## Tech Stack
- Express built-in `express.static`
- `node:fs` (existsSync), `node:url` (fileURLToPath)
