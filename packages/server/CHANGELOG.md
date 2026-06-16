# Change Log

All notable changes to `@tecture/core` are documented here.

## [0.0.8] — 2026-06-16

### Added

- **Anonymous, opt-out usage telemetry** for the standalone viewer. Records only
  the C4 diagram level and counts — never names, paths, or architecture content.
  Disable with `TECTURE_TELEMETRY=0` or `DO_NOT_TRACK=1`; a one-time notice
  prints on first run. (Only the standalone viewer reports; the VS Code webview
  uses the extension's own telemetry, so there's no double-counting.)
- First `@tecture/core` README, documenting usage and the telemetry policy.

## [0.0.7] — 2026-06-02

### Changed

- **Copy deep-dive prompt** now copies a slash command —
  `/architecture-docs deep-dive <id>` — instead of the longer
  "Use the architecture-docs skill to deep-dive…" sentence. Shorter to
  paste, and it invokes the skill directly. The id alone resolves the
  component.
- Renamed the bundled skill from `tecture` to `architecture-docs`, so
  the deep-dive prompt and skill invocation use the new name.

## [0.0.6] — 2026-06-02

### Added

- **Copy deep-dive prompt** action in a node's detail panel of the bundled
  viewer. For first-party code nodes (next to **View file/folder**), one click
  copies a ready-to-paste prompt that asks a coding agent to deep-dive that
  component and enrich its description — keyed on the node id so there's no
  ambiguity about which component to document.
