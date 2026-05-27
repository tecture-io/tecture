# Tecture for VS Code

Render file-based architecture diagrams (`./architecture`) inside VS Code.

This extension is the editor-integrated counterpart to the `npx @tecture/core`
web app. It reuses the same React Flow + Mermaid renderer; the only difference
is that diagram JSON/Markdown is read via `vscode.workspace.fs` and the panel
lives inside an editor tab instead of a browser.

## Features (v1)

- **Open Architecture** command renders the workspace's `architecture/` folder
  in a webview panel.
- **Tecture Activity Bar** lists every diagram in the manifest; clicking opens
  the panel and selects that diagram.
- **Layout persistence**: dragging a node writes positions to
  `<workspace>/.tecture/layouts/<slug>.json` (version-controllable).
- **Live refresh**: editing any file under `architecture/` or `.tecture/`
  reloads the panel.

## Requirements

- A workspace that contains `architecture/manifest.json`. The extension
  activates only when that file is present, so it stays inert in unrelated
  repos.

## Local development

Build the webview bundle, then the host:

```bash
pnpm --filter tecture-vscode build
```

Open `packages/vscode` in VS Code and hit **F5** — this launches an Extension
Development Host with the extension loaded. Open the `tecture-io` repo as the
host's workspace folder and run **"Tecture: Open Architecture"**.

## Running integration tests

```bash
pnpm --filter tecture-vscode test
```

Uses [`@vscode/test-cli`](https://github.com/microsoft/vscode-test-cli). On
first run, downloads VS Code Insiders (~220 MB) to `./.vscode-test/`. Tests
cover `VscodeFsArchitectureDataSource`, `VscodeFsLayoutStore`, the message
protocol handler, and command registration.

## Packaging + manual install

```bash
pnpm --filter tecture-vscode vscode:package
# produces packages/vscode/tecture-vscode-0.0.1.vsix

code --install-extension packages/vscode/tecture-vscode-0.0.1.vsix
```

Then open any folder containing `architecture/manifest.json` and run
**Cmd+Shift+P → "Tecture: Open Architecture"**.

## Architecture

```
extension host (Node) ──┐
                        ├──→ vscode.workspace.fs (architecture/, .tecture/)
                        │
                        │ postMessage(TectureRequest)
                        ▼
            webview (React + React Flow + Mermaid)
                        │
                        │ same @tecture/web components as the npx app —
                        │ only the data source layer differs.
```

The message protocol (`TectureRequest`, `TectureResponse`, `TectureEvent`)
lives in `@tecture/shared` so both sides share types.

## Known limitations (v1)

- Multi-root workspaces: only the first folder is used.
- Theme: panel is dark-only. VS Code light theme support is planned.
- Not yet published to the Marketplace or Open VSX.
