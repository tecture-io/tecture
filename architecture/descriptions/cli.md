The `@tecture/io` bin entrypoint. A thin Node.js script that parses CLI flags, resolves the architecture directory to an absolute path, constructs the Express app, and starts listening.

## Responsibilities
- Parse `--port` / `-p` (default `PORT` env or `3000`, validated as a 1–65535 integer) and `--architecture-path` / `-a` (default `./architecture`).
- Respond to `--help` / `-h` with a one-line usage string and exit.
- Resolve the architecture path via `path.resolve()` so the server always sees an absolute location.
- Call `createApp({ architecturePath })` and `app.listen(port)`; log the URL and resolved architecture root.

## Tech Stack
- `nodedotjs` 20+ runtime.
- Plain `process.argv` parsing — no CLI framework dependency.
- Distributed as an ESM bundle (`dist/cli.js`) with a `#!/usr/bin/env node` shebang.
