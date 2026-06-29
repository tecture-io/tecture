The `@tecture/skill` CLI — a `tsup`-bundled ESM binary (`npx @tecture/skill`) that installs and updates the **architecture-docs** agent skill into a developer's coding-agent directories, so the agent can author the `architecture/` tree the viewers render. The skill payload is bundled into the package at build time (`scripts/copy-skill.mjs`), so installs work offline; this is the sole distribution channel for the skill (no registry, no symlinks). Distinct from the two viewer hosts: it ships the *authoring* capability rather than reading or rendering architecture files.

## Responsibilities
- Parse the `sync` / `remove` / `check` commands plus `--agent`, `--global`/`--project`, `--yes`, `--force` flags (`cli.ts`).
- Resolve each supported agent's real skills directory — Claude Code, Cursor, GitHub Copilot, Codex, Windsurf — at project or machine scope (`agents.ts`, `paths.ts`).
- Copy the bundled skill into each target dir, version-comparing against an install manifest to skip up-to-date or locally-edited installs unless `--force` (`install.ts`, `skill.ts`, `manifest.ts`, `fsutil.ts`).
- Drive the interactive multi-select / scope prompts when not run with `--yes` (`prompt.ts`).
- Send anonymous, opt-out install telemetry to PostHog, flushing before the short-lived CLI exits (`telemetry.ts`).

## Tech Stack
- Node 20+, TypeScript 5.6, bundled by tsup 8 (binary entry `./dist/cli.js`)
- Zero runtime deps beyond Node built-ins; PostHog reached over plain HTTPS
- Published to npm as `@tecture/skill` (released via the `skill-v*` tag pipeline)
