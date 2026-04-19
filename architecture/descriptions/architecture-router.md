`packages/server/src/routes/architecture.ts` — the Express router that exposes the architecture over HTTP. Constructed via `createArchitectureRouter(root)` so every handler closes over the resolved filesystem root provided by the CLI.

## Responsibilities
Handle these endpoints, all read-only `GET`s under `/api/architecture`:

| Path | Purpose |
|------|---------|
| `/` | Return an `ApiArchitectureSummary` (manifest name/description + list of `ApiDiagramSummary`). |
| `/manifest` | Return the raw `ManifestFile`. |
| `/diagrams` | Return just the array of `ApiDiagramSummary`. |
| `/diagrams/:diagramId` | Return one full `ApiDiagram` (nodes + edges + meta). |
| `/diagrams/:diagramId/nodes` | Return only the nodes for a diagram. |
| `/diagrams/:diagramId/edges` | Return only the edges for a diagram. |
| `/nodes/:nodeId` | Return an `ApiNodeDetail` (node fields + owning `diagramId` + Markdown description). |
| `/nodes/:nodeId/description` | Return the raw Markdown as `text/markdown; charset=utf-8`. |

## Error Handling
- Validate every `:diagramId` / `:nodeId` against `SLUG_RE` before touching disk.
- Catch `DiagramNotFoundError`, `NodeNotFoundError`, `DescriptionNotFoundError` and translate each to a typed 404 with an `error` code and the offending `slug` or `id`.
- Delegate unexpected errors to `architectureErrorHandler`, which returns a 500 with `error: "architecture_unreadable"`.

## Tech Stack
- `express` `Router`.
- Shared types from `@tecture/shared` for every response body.
