Local-first code-intelligence companion (npm: `@colbymchenry/codegraph`) that Tecture requires on every machine that authors architecture docs. It parses the repo with tree-sitter into a SQLite symbol/edge/file graph at `.codegraph/`, and exposes it to coding agents via the `codegraph` CLI and an MCP server.

## Responsibilities
- Index the repository into a deterministic symbol/call/import graph (`codegraph init`, kept fresh by `codegraph sync` and its file watcher)
- Answer the skill's discovery and deep-dive queries (`codegraph explore`, `codegraph_explore` MCP tool, `codegraph status --json`)
- Back the evidence script: `scripts/evidence.mjs` reads `.codegraph/codegraph.db` directly to verify node paths and declared edges, producing `architecture/.tecture/drift.json`

## Tech Stack
- Distributed as a global npm package with a vendored Node runtime; data is plain SQLite on the developer's machine — no backend service
- Installed and indexed automatically by `npx @tecture/install`; Tecture spawns it with `CODEGRAPH_TELEMETRY=0`
