The `@tecture/core` Node process — a `tsup`-bundled ESM binary (shebanged `#!/usr/bin/env node`) that parses CLI flags, instantiates an Express app, and serves both the JSON architecture API and the bundled web UI from a single port. The only deployable in the repo.

## Responsibilities
- Parse `--port` / `--architecture-path` and resolve the architecture root to an absolute path.
- Mount `/api/health` and `/api/architecture` REST routes backed by on-disk JSON + Markdown, with a path-escape guard (`safeJoin`) on every filesystem read.
- Serve `dist/public/*` (the built React UI) plus an SPA fallback that serves `index.html` for any non-`/api/*` route.

## Tech Stack
- Node 20+ (declared in root `package.json` `engines`)
- Express 4.21
- TypeScript 5.6, bundled by tsup 8
- Published to npm as `@tecture/core` (binary entry `./dist/cli.js`)
