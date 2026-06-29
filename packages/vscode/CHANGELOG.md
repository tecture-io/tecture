# Change Log

All notable changes to the Tecture VS Code extension are documented here.

## [0.0.12] — 2026-06-29

### Fixed

- **Dragging a node no longer reloads the whole diagram.** The atomic layout
  save writes through a temporary `<slug>.json.tmp` file, whose create/delete
  events were slipping past the layout-file filter in the file watcher and
  triggering a full refresh — which reset the viewport and re-opened the
  onboarding wizard on every drag. The watcher now ignores all writes under the
  `.tecture/layouts` directory, so positions persist silently.

### Changed

- **New app icon.** Refreshed the Marketplace/extension logo.

## [0.0.11] — 2026-06-26

### Added

- **First-run onboarding wizard in the diagram panel.** Opening an architecture
  now shows a short, dismissable tour: an intro with the architecture's name and
  description, followed by two looping animated demos — clicking a component to
  open its detail panel, and double-clicking a container to drill into its
  sub-diagram. A floating help (`?`) button replays the tour at any time, and the
  animations respect `prefers-reduced-motion`.

## [0.0.10] — 2026-06-25

### Changed

- **Webview rebuilt from the now-published `@tecture/web` library.** The diagram
  UI hosted in the webview is now built from the `@tecture/web` package that ships
  to npm, so the extension and the standalone viewer render from the same source.
  No change to behaviour — diagrams, drill-down, and node details work as before.

## [0.0.9] — 2026-06-22

### Fixed

- **Telemetry accuracy.** `diagram.viewed` and `node.inspected` now fire on real
  user actions (navigating to a diagram, opening a node) instead of on the
  viewer's background data fetches. Previously, opening the panel pre-loaded
  every diagram and node detail, massively over-counting views and reporting
  levels the user never opened. Events now reflect actual usage.

## [0.0.8] — 2026-06-16

### Added

- **Anonymous usage telemetry** (opt-out via VS Code's `telemetry.telemetryLevel`).
  Records only the C4 level and interaction counts — never diagram/node names,
  file paths, or repo content. Dependency-free; the standalone viewer and CLI
  send nothing.

### Changed

- Install docs now point to `npx @tecture/skill@latest` as the single
  cross-agent install command for the architecture-docs skill.

## [0.0.7] — 2026-06-02

### Changed

- **Copy deep-dive prompt** now copies a slash command —
  `/architecture-docs deep-dive <id>` — instead of the longer
  "Use the architecture-docs skill to deep-dive…" sentence. Shorter to
  paste, and it invokes the skill directly. The id alone resolves the
  component.
- Renamed the bundled skill from `tecture` to `architecture-docs`, so
  the deep-dive prompt and skill invocation use the new name.

> Version jumps from 0.0.5 to 0.0.7 (no 0.0.6) to align the extension
> with `@tecture/core` on a single shared version.

## [0.0.5] — 2026-06-02

### Added

- **Copy deep-dive prompt** action in a node's detail panel. For first-party
  code nodes (alongside **Open file/folder**), one click copies a ready-to-paste
  prompt that asks a coding agent to deep-dive that component and enrich its
  description — keyed on the node id so there's no ambiguity about which
  component to document.

### Fixed

- The diagram no longer flickers or resets its zoom/pan when you drag a node to
  reposition it.

## [0.0.4] — 2026-05-29

### Added

- Open a node's source straight from the diagram. Nodes that map to a single
  file or directory now show an **Open file** / **Open folder** action that opens
  the file in an editor (or reveals the folder in Explorer). Backed by new
  manifest `source` + `sourceHost` fields and a per-node `path`.

## [0.0.3] — 2026-05-28

### Added

- The Diagrams sidebar selection now follows the active diagram: drilling into a
  sub-diagram inside the canvas (or navigating within the panel) highlights the
  matching item in the tree. Syncs only when the sidebar is already open.
- New `tecture.architecturePath` setting (workspace-scoped) to point at a custom
  architecture folder; defaults to `architecture`. The layout store follows the
  configured path (`<architecturePath>/.tecture/layouts/`).

### Changed

- Layout files moved from `<workspace>/.tecture/layouts/` to
  `<workspace>/architecture/.tecture/layouts/`, keeping all Tecture files under
  the `architecture/` tree.

## [0.0.2] — 2026-05-28

### Changed

- Marketplace README rewritten as a user-facing landing page with screenshots
  showing system context diagrams, component drill-down, and description panels.
- Developer and publishing documentation moved to `docs/` (excluded from .vsix).
- Updated tagline: "AI-generated architecture diagrams for complex codebases."
- Custom brand icon for Activity Bar and Marketplace listing.

## [0.0.1] — 2026-05-27

### Added

- Initial release.
- `Tecture: Open Architecture` command renders the workspace's `architecture/`
  folder in an editor-side panel using the same React Flow + Mermaid renderer
  as the `npx @tecture/core` web app.
- **Tecture** Activity Bar with a Diagrams tree listing every diagram in the
  manifest. Clicking opens the panel and selects that diagram.
- Layout persistence: dragging a node writes positions to
  `<workspace>/.tecture/layouts/<slug>.json` (version-controllable).
- Live refresh: editing any file under `architecture/` or `.tecture/`
  reloads the panel.
- Strict Content Security Policy with per-load nonce. No outbound network
  access (`connect-src 'none'`).
- Activates only when the workspace contains `architecture/manifest.json`.

### Known limitations

- Multi-root workspaces: only the first folder is used.
- Dark theme only — VS Code light theme support is planned.
