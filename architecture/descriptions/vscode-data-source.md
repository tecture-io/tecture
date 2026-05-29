The VS Code backend for the shared data contract — `VscodeFsArchitectureDataSource` and `VscodeFsLayoutStore`, which read and write the `architecture/` tree through `vscode.workspace.fs` (URIs) rather than `node:fs` paths. The in-editor counterpart to the server's `FsArchitectureDataSource`.

## Responsibilities
- Implement `ArchitectureDataSource` — load `manifest.json`, `diagrams/<slug>.json`, and `descriptions/<id>.md` as workspace-relative URIs, decoding bytes with a `TextDecoder`.
- Implement `LayoutStore` — read/write per-diagram layout files under `architecture/.tecture/layouts/`, validating bodies with the shared `normalizeLayoutUpdate`.
- Translate `vscode.FileSystemError` (FileNotFound / EntryNotFound) into the shared typed errors (`DiagramNotFoundError`, `DescriptionNotFoundError`) so the message handler maps them identically to the server.
- Enforce `SLUG_RE` on every slug before touching the filesystem.

## Tech Stack
- TypeScript, `vscode.workspace.fs` + `vscode.Uri`
- `@tecture/shared` interfaces, errors, and `normalizeLayoutUpdate` / `emptyLayout` helpers
