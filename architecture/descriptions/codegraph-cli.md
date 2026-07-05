The globally-installed CodeGraph command-line tool (`codegraph`, from `@colbymchenry/codegraph`) as seen from inside the Tecture monorepo: the external binary the umbrella installer drives and the skill's evidence script reads data from.

## Responsibilities
- `codegraph install --yes --target … --location …` — write MCP server config for Claude Code/Cursor/Codex (repo-level `.mcp.json` for project scope, machine-level for global)
- `codegraph init` — create `.codegraph/` and index the repository (idempotent; refuses unsafe roots like `$HOME`)
- Maintain `.codegraph/codegraph.db`, the SQLite graph that `scripts/evidence.mjs` queries read-only to produce the drift report

## Dependencies
- **Inbound** — spawned by the Umbrella Installer; queried by coding agents (`codegraph explore`, MCP) and by the skill's evidence script (direct SQLite read)
- **Outbound** — none that Tecture relies on; Tecture disables its telemetry per spawn (`CODEGRAPH_TELEMETRY=0`)

## Tech Stack
- npm-distributed CLI with vendored Node runtime; SQLite (WAL) database on local disk
