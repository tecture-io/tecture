`packages/server/src/architecture/loader.ts` — the only component that touches the filesystem. Exposes pure `async` functions that read and parse the manifest, individual diagrams, and per-node descriptions, plus helpers that build summaries and resolve a node id to its owning diagram.

## Responsibilities
- `loadManifest(root)` — read and parse `manifest.json`.
- `loadDiagram(root, slug)` — read and parse `diagrams/<slug>.json`; throw `DiagramNotFoundError` on `ENOENT` or a malformed slug.
- `loadDescription(root, nodeId)` — read `descriptions/<nodeId>.md`; throw `DescriptionNotFoundError` on `ENOENT`.
- `buildArchitectureSummary(root)` — load manifest + every diagram in parallel, return name/description/topDiagram plus `ApiDiagramSummary[]` with node/edge counts.
- `findNode(root, id)` — walk every diagram listed in the manifest until a matching node id is found; throw `NodeNotFoundError` otherwise.

## Safety
- `safeJoin()` resolves every path under the configured root and refuses anything that escapes it (guards `..` traversal even through nested segments).
- Slug inputs are validated against `SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/` before any disk access, so non-slug ids short-circuit to a not-found error without hitting the filesystem.

## Tech Stack
- `node:fs/promises` for async reads.
- `node:path` for `join`, `resolve`, `sep`.
- Typed with `ManifestFile`, `DiagramFile`, `ApiArchitectureSummary`, etc. from `@tecture/shared`.
