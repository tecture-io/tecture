# Changelog — @tecture/install

## 0.1.0 - 2026-07-06

- Initial release: one command installs the architecture-docs skill AND the required CodeGraph companion (`@colbymchenry/codegraph`) — global CLI, MCP server config for Claude Code/Cursor/Codex, and a one-time repository index.
- CodeGraph is mandatory: any companion failure aborts the install before skill files are written, with exact manual remedy commands.
- Non-interactive (`--yes`) runs silently upgrade an outdated global CodeGraph with a printed notice; interactive runs confirm first.
- Project-scope installs write repo-level MCP config (`.mcp.json`); global scope writes machine-level config.
- `check` reports skill and CodeGraph/index status; `remove` uninstalls the skill and leaves CodeGraph in place.
- All spawned codegraph processes run with `CODEGRAPH_TELEMETRY=0`.
