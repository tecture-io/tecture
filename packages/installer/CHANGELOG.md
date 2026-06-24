# Changelog

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
