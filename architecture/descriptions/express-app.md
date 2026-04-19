`packages/server/src/server.ts` — the `createApp()` factory that wires the Express instance, middleware, and routers together. Returning the app (instead of listening inside the factory) keeps the CLI and any future tests in control of the HTTP lifecycle.

## Responsibilities
- Install `express.json()` body parsing.
- Mount `healthRouter` at `/api/health` and the architecture router at `/api/architecture` (with its error handler).
- If the `dist/public/` directory exists next to the executable, mount `express.static` for it and add an SPA fallback that serves `index.html` for any non-`/api/*` path.

## Tech Stack
- `express` 4.
- `node:fs.existsSync` and `node:url.fileURLToPath` to locate the bundled `public/` beside the ESM entry.
