The Express application factory at [packages/server/src/server.ts](packages/server/src/server.ts) — wires together the JSON body parser, the two API routers, the architecture error handler, and the static + SPA-fallback handler. Exported as `createApp(options)` so tests and alternate entry points can construct an app without binding a port.

## Responsibilities
- Register `express.json()` and mount `/api/health` and `/api/architecture` routers.
- Install the architecture-specific error handler *after* the architecture router so errors surface as structured `ApiArchitectureError` JSON.
- Detect whether `dist/public/` exists (i.e. the UI has been bundled) and, if so, register static serving + an SPA fallback that skips `/api/*` paths.

## Tech Stack
- Express 4
- `node:fs` (existsSync), `node:url` (fileURLToPath)
