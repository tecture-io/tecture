The CLI bootstrap at [packages/server/src/cli.ts](packages/server/src/cli.ts) — the module whose compiled output lives at `dist/cli.js` and is the `bin` entry of the published package. Handles arg parsing, then hands off to the Express factory.

## Responsibilities
- Parse `--port`/`-p` and `--architecture-path`/`-a` (with `PORT` / `ARCHITECTURE_PATH` env fallbacks) and validate the port is in `[1, 65535]`.
- Resolve the architecture path to an absolute path relative to the current working directory.
- Call `createApp({ architecturePath })` and `app.listen(port)`, logging the URL and resolved root.

## Tech Stack
- TypeScript, `node:path`
