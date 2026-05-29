The `tecture-vscode` extension — the second viewer host, published to the VS Code Marketplace and Open VSX. It renders the same `@tecture/web` UI as the CLI server, but inside a webview panel instead of a browser, and reads the `architecture/` directory through `vscode.workspace.fs` instead of `node:fs`. Activates automatically when a workspace contains `architecture/manifest.json`.

## Responsibilities
- Implement the shared `ArchitectureDataSource` + `LayoutStore` contract over the VS Code filesystem API, scoped to the workspace folder.
- Host the bundled web SPA in a webview and bridge it to the data source over a `postMessage` request/response channel (the in-editor equivalent of the CLI's REST API).
- Add editor-native affordances the browser viewer can't: a sidebar diagram tree, "open this node's source file" actions, and file watchers that live-reload the diagrams when the architecture files change on disk.
- Read the architecture path from the `tecture.architecturePath` setting and rebuild its data source / watchers when that setting or the workspace folder changes.

## Tech Stack
- TypeScript, VS Code Extension API (`vscode` ^1.90)
- Host bundle built with tsup; webview bundle built with Vite + React 18 + Tailwind 4 (aliasing `@tecture/web` to source)
- Packaged and published with `@vscode/vsce` (Marketplace) and `ovsx` (Open VSX)
- Depends on `@tecture/web` (UI) and `@tecture/shared` (contract)
