# Change Log

All notable changes to the Tecture VS Code extension are documented here.

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
