# Changelog

## Unreleased

- Initial release of `@tecture/skill`: one-command install/update of the
  `architecture-docs` agent skill across Claude Code, Cursor, GitHub Copilot,
  Codex, and Windsurf.
- Bundled, version-locked skill payload (no registry, no network).
- Smart default command (install-or-update), `--check`, `remove`, and
  non-interactive `--yes` / `--agent` / `--global` / `--force` flags.
- Per-install `.tecture.json` manifest with content checksum for safe updates
  and local-edit detection.
