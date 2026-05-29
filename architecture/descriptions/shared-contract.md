The `@tecture/shared` package — the source-independent contract that lets one UI and two completely different host backends agree on the same data without depending on each other. Everything here is types plus zero-dependency helper functions; it owns no I/O, so the CLI server (`node:fs`) and the VS Code extension (`vscode.workspace.fs`) can each implement the same interfaces against a different filesystem.

## Responsibilities
- Define the file-format types (`ManifestFile`, `DiagramFile`, `ArchitectureNode`, `ArchitectureEdge`) and the API shapes the UI consumes (`ApiArchitectureSummary`, `ApiDiagram`, `ApiNodeDetail`, `DiagramLayoutFile`).
- Declare the `ArchitectureDataSource` (loadManifest / loadDiagram / loadDescription) and `LayoutStore` (loadLayout / saveLayout) interfaces every backend satisfies, plus the typed not-found / invalid error classes route handlers and message handlers map to responses.
- Declare the in-process message protocol — `TectureRequest` / `TectureResponse` / `TectureEvent` / `TectureNotification` — that the VS Code webview and host exchange (the postMessage analogue of the REST routes).
- Centralize source-independent logic so neither host re-implements it: `SLUG_RE`, `isValidLayoutEntry`, `normalizeLayoutUpdate` (the layout-body validator), and the composed traversals `buildArchitectureSummary(source)`, `findNode(source, id)`, and `buildSourceUrl(...)`.

## Tech Stack
- TypeScript interfaces + plain functions, no runtime dependencies
- Consumed as `workspace:*` by `@tecture/core`, `@tecture/web`, and `tecture-vscode`; the server's `source/types.ts` simply re-exports it
