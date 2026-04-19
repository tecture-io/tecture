# Tecture IO

A React UI + Express REST API shipped as a single npm package. Users launch the whole app with one command:

```bash
npx @tecture/io
# → Tecture IO running at http://localhost:3000
```

The Express server serves the built React UI and the `/api/*` routes on the **same port**, so there is nothing to configure on the end-user side.

## Requirements

- **Node.js ≥ 20** (see `.nvmrc`)
- **pnpm** (the repo pins `pnpm@10` via `packageManager`; Corepack will install it automatically when needed)

## Repository layout

```
tecture-io/
├── package.json              # root workspace, scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json        # strict TS config extended by each package
└── packages/
    ├── shared/               # @tecture/shared — shared TS types (source-only, no build)
    ├── web/                  # @tecture/web    — React + Vite UI (private)
    └── server/               # @tecture/io     — Express + CLI (the PUBLISHED package)
```

Only `@tecture/io` is published to npm. `web` and `shared` stay private; their output is bundled into `packages/server/dist/` at build time.

## Getting started

```bash
pnpm install
pnpm dev
```

`pnpm dev` runs two processes in parallel:

| Process | Port  | Purpose                                              |
|---------|-------|------------------------------------------------------|
| Vite    | 5173  | Serves the React UI with HMR                         |
| Express | 3001  | Serves the API; Vite proxies `/api/*` to this server |

Open http://localhost:5173 — the UI calls `/api/health` through the Vite proxy.

## Production build

```bash
pnpm build   # builds web, then bundles server + copies web/dist → server/dist/public
pnpm start   # runs the built CLI (identical to npx @tecture/io after publish)
```

Everything is emitted under `packages/server/dist/`:

```
packages/server/dist/
├── cli.js               # ESM bundle with #!/usr/bin/env node shebang
└── public/              # built React UI (index.html + hashed assets)
```

## Publishing

```bash
# 1. Bump version in packages/server/package.json
# 2. Build
pnpm build
# 3. Inspect what will be published (no upload)
pnpm --filter @tecture/io publish --dry-run
# 4. Publish (uses publishConfig.access = "public" automatically)
pnpm --filter @tecture/io publish
```

The published tarball contains only `dist/**` and `package.json` — no source, no tests, no lockfile.

## Scripts (root)

| Script           | What it does                                                    |
|------------------|-----------------------------------------------------------------|
| `pnpm dev`       | Runs web + server in parallel                                   |
| `pnpm build`     | Builds web, then server (bundles UI into `server/dist/public/`) |
| `pnpm start`     | Runs the built CLI locally                                      |
| `pnpm typecheck` | Typechecks every package                                        |
| `pnpm clean`     | Removes all `dist/` folders                                     |

## Tech choices

- **pnpm workspaces** for fast installs, `workspace:*` linking, and per-package filtering
- **Vite + React 18** for the UI
- **Express 4** for the API
- **tsup** to bundle the server into a single executable ESM file (via esbuild)
- **TypeScript** strict-mode everywhere, shared `tsconfig.base.json`

Intentionally not (yet) included: Turborepo/Nx, ESLint/Prettier, test runner, CI config — add them incrementally once the code demands them.
