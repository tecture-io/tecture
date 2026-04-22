The three Express handler groups mounted by `createApp()` on the shared Express instance. Each handler owns one URL prefix and is registered side-by-side in [packages/server/src/server.ts](../../packages/server/src/server.ts): a health probe at `/api/health`, the architecture read-API under `/api/architecture`, and the static SPA fallback at `/*`.

## Responsibilities
- Keep HTTP route mounting in one place so request paths and middleware order stay easy to audit
- Separate concerns — liveness, domain API, static serving — without pulling them into separate processes
- Let `express-app` stay a thin wiring layer that only knows about route prefixes

## Tech Stack
- Express 4 Router instances in [packages/server/src/routes/](../../packages/server/src/routes/)
