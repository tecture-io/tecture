The filesystem-backed implementation of the data-source contract at [packages/server/src/source/fs.ts](packages/server/src/source/fs.ts). Ships two classes — `FsArchitectureDataSource` (reads `manifest.json`, `diagrams/*.json`, `descriptions/*.md`) and `FsLayoutStore` (reads and atomically writes `architecture/.tecture/layouts/*.json`). The CLI constructs both and injects them into `createApp`; downstream consumers can ignore this file entirely and ship their own implementation.

## Responsibilities
- Implement `ArchitectureDataSource.loadManifest / loadDiagram / loadDescription` over a configurable root directory using `node:fs/promises`.
- Implement `LayoutStore.loadLayout / saveLayout` over a configurable `architecture/.tecture/` root, using a temp-file + `rename` write to keep saves atomic.
- `safeJoin` every candidate path against the root and throw on traversal attempts (`..`).
- Translate `ENOENT` into the typed errors declared by [[data-source-types]] so the route layer can produce the right HTTP status.
- Tolerate malformed layout JSON by warning and returning an empty layout, never crashing the server.

## Tech Stack
- `node:fs/promises`, `node:path`
- Implements interfaces from [[data-source-types]]
