The primary Tecture entry point (`npx @tecture/install`, npm: `@tecture/install`): a CLI that performs the full setup — the architecture-docs skill plus the mandatory CodeGraph companion — in one command.

## Responsibilities
- Drive the skill install by reusing `@tecture/skill` as a library (`runSync` with an `afterTargetsChosen` hook), so agent/scope selection and update semantics stay identical
- Ensure the CodeGraph companion before any skill file is written: detect or `npm install -g` the CLI (silently upgrading below the version floor under `--yes`), run `codegraph install --yes --target <mapped agents> --location <local|global>` for Claude Code/Cursor/Codex, and `codegraph init` the repo
- Hard-fail with exact manual remedy commands when any companion step fails — a partial install never lands
- Extend `check` with a CodeGraph/index status section; `remove` uninstalls the skill only and prints how to remove CodeGraph

## Key files
- `src/cli.ts` — argument parsing, USAGE, top-level error shaping (`CodegraphSetupError` → remedies + exit 1)
- `src/install.ts` — orchestration: companion-then-skill ordering, `check` decoration
- `src/codegraph.ts` — all child-process logic: detection, npm install/upgrade, MCP config, init; every spawn gets `CODEGRAPH_TELEMETRY=0`

## Dependencies
- **Inbound** — developers via `npx @tecture/install`
- **Outbound** — `@tecture/skill` (bundled at build time), the `codegraph` CLI and npm (child processes), PostHog (one anonymous `install.completed` event, opt-out)

## Tech Stack
- TypeScript, tsup single-file ESM bundle, zero runtime dependencies (skill installer code inlined at build)
