The CLI bootstrap at [packages/server/src/cli.ts](packages/server/src/cli.ts) — the module whose compiled output lives at `dist/cli.js` and is the `bin` entry of the published package. Parses args, constructs filesystem-backed data sources, then hands off to the Express factory.

## Responsibilities
- Parse `--port`/`-p`, `--architecture-path`/`-a`, and `--tecture-path`/`-t` (with `PORT` / `ARCHITECTURE_PATH` / `TECTURE_PATH` env fallbacks) and validate the port is in `[1, 65535]`.
- Resolve the architecture and tecture-state paths to absolute paths relative to the current working directory.
- Construct `new FsArchitectureDataSource(architecturePath)` and `new FsLayoutStore(tecturePath)`, then call `createApp({ source, layoutStore })` and `app.listen(port)`, logging the URL and resolved roots.

## Tech Stack
- TypeScript, `node:path`
- Uses [[fs-data-source]] as the default backend
