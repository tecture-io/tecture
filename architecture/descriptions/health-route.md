`packages/server/src/routes/health.ts` — a single-endpoint router mounted at `/api/health`. Used by the UI's proxy-aware dev setup to confirm the API is reachable and by any external uptime probe that wants a cheap check.

## Responsibilities
- Respond to `GET /api/health` with a typed `ApiHealthResponse` payload: `{ status, uptime, timestamp }`.
- Stay dependency-free — never touch the filesystem or the architecture loader, so a broken architecture directory still returns a healthy process.
