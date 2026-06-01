# Change Log

All notable changes to the Tecture VS Code extension are documented here.

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
