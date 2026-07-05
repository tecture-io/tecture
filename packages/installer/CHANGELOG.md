# Changelog

## 0.3.0 - 2026-07-06

- The bundled skill now hard-requires the CodeGraph companion: a presence gate
  stops authoring/deep-dives until `npx @tecture/install` has set it up, Phase A
  discovery leads with the CodeGraph index, and a new `scripts/evidence.mjs`
  verifies the architecture against the index (node paths, declared edges,
  undeclared dependencies, unmapped SDKs) and writes the committed
  `architecture/.tecture/drift.json` the viewers render. Requires Node ≥ 22.5 at
  run time; findings follow resolve-or-explain (fix errors; fix or justify warns).
- New library entry (`import { runSync, runCheck, runRemove } from "@tecture/skill"`)
  with an `afterTargetsChosen` hook that runs before any skill file is written —
  the seam `npx @tecture/install` builds on. The CLI's behavior is unchanged;
  its help now points full setups at `npx @tecture/install@latest`.
- Added a vitest suite covering install/update/local-edit paths and the new hook.

## 0.2.1 - 2026-06-24

- Anonymous, opt-out install telemetry: emits a single `skill.installed` event
  (skill/installer version, platform, agents, scope) after a successful install
  or update. Shares the viewer's per-machine id, sends no repo or path data,
  fails silently when offline, and honors `TECTURE_TELEMETRY=0` / `DO_NOT_TRACK=1`.

## 0.2.0 - 2026-06-17

- Initial release of `@tecture/skill`: one-command install/update of the
  `architecture-docs` agent skill across Claude Code, Cursor, GitHub Copilot,
  Codex, and Windsurf.
- Bundled, version-locked skill payload (no registry, no network).
- Smart default command (install-or-update), `--check`, `remove`, and
  non-interactive `--yes` / `--agent` / `--global` / `--force` flags.
- Per-install `.tecture.json` manifest with content checksum for safe updates
  and local-edit detection.
