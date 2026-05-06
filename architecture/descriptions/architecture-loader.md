The filesystem access layer at [packages/server/src/architecture/loader.ts](packages/server/src/architecture/loader.ts). The only module allowed to read the architecture directory — centralizing path-safety, slug validation, and typed "not found" errors keeps those concerns out of the route handlers.

## Responsibilities
- Expose `loadManifest`, `loadDiagram`, `loadDescription`, `findNode`, and `buildArchitectureSummary` over a root path.
- Validate every incoming id/slug against `SLUG_RE` (`[a-z0-9]+(-[a-z0-9]+)*`) before touching disk.
- `safeJoin` every candidate path and throw if it resolves outside the architecture root (prevents `..` traversal).
- Translate `ENOENT` into typed `DiagramNotFoundError` / `NodeNotFoundError` / `DescriptionNotFoundError` so routes can produce 404s.

## Tech Stack
- `node:fs/promises`, `node:path`
- `@tecture/shared` file types (`ManifestFile`, `DiagramFile`)
