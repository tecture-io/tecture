The `@tecture/core` Node process — a `tsup`-bundled ESM binary (shebanged `#!/usr/bin/env node`) that parses CLI flags, instantiates an Express app, and serves both the JSON architecture API and the bundled web UI from a single port. The only deployable in the repo. The package also ships a library entry (`@tecture/core` import) that exposes `createApp`, the data-source interfaces, and the FS implementations so downstream projects can embed Tecture with a custom backend (e.g. fetching architecture files from the GitHub API instead of disk).

## Responsibilities
- Parse `--port` / `--architecture-path` / `--tecture-path` and resolve the architecture and layout-state roots to absolute paths.
- Construct filesystem-backed source + layout store and pass them to `createApp({ source, layoutStore })`.
- Mount `/api/health` and `/api/architecture` REST routes, with the architecture routes resolving the data source per request from the injected configuration.
- Serve `dist/public/*` (the built React UI) plus an SPA fallback that serves `index.html` for any non-`/api/*` route.
- Export a public library API (`createApp`, `createArchitectureRouter`, `ArchitectureDataSource`, `LayoutStore`, `FsArchitectureDataSource`, `FsLayoutStore`, error classes) so external apps can mount the same routes against their own backend.

## Tech Stack
- Node 20+ (declared in root `package.json` `engines`)
- Express 4.21
- TypeScript 5.6, bundled by tsup 8 (two entries — `cli.js` for the bin, `index.js` for the library)
- Published to npm as `@tecture/core` (binary entry `./dist/cli.js`, library entry `./dist/index.js`)
