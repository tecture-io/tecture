`packages/server/src/cli.ts` — the process entrypoint that runs when the published bin is invoked. Keeps argument handling in a small function so the rest of the server is easy to test without process-level state.

## Responsibilities
- Parse `--port`/`-p` and `--architecture-path`/`-a`, with `PORT` and `ARCHITECTURE_PATH` env-var fallbacks.
- Validate that `--port` is an integer in `(0, 65535]`; throw otherwise.
- Resolve the architecture path to an absolute location before handing it to `createApp`.
- Call `app.listen(port)` and log the URL and resolved root.

## Tech Stack
- Plain `process.argv` parsing — no `commander` / `yargs` dependency.
- `node:path` for `resolve()`.
