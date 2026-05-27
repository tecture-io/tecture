The Express application factory at [packages/server/src/server.ts](packages/server/src/server.ts) — wires together the JSON body parser, the two API routers, the architecture error handler, and the static + SPA-fallback handler. Exported as `createApp({ source, layoutStore? })` so the bundled CLI, tests, and downstream library consumers can construct an app without binding a port.

## Responsibilities
- Accept either a constant `ArchitectureDataSource` (and optional `LayoutStore`) or a `(req) => …` resolver for either; normalize both forms to a per-request resolver internally.
- Register `express.json()` and mount `/api/health` plus `/api/architecture` (the latter wired to the injected source/store resolvers).
- Install the architecture-specific error handler *after* the architecture router so errors surface as structured `ApiArchitectureError` JSON.
- Detect whether `dist/public/` exists (i.e. the UI has been bundled) and, if so, register static serving + an SPA fallback that skips `/api/*` paths.

## Tech Stack
- Express 4
- `node:fs` (existsSync), `node:url` (fileURLToPath)
- Source and store interfaces from [[data-source-types]]
