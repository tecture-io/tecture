A single-endpoint Express router at [packages/server/src/routes/health.ts](packages/server/src/routes/health.ts) that returns process liveness and uptime. Exists so deployments and supervisors can probe the CLI without hitting the architecture filesystem.

## Responsibilities
- Respond `200 { status: "ok", uptime, timestamp }` on `GET /api/health`.

## Tech Stack
- Express Router
- `process.uptime()`
