The Express HTTP server that backs the Web UI. Exposes a read-only REST API over the local architecture directory and also serves the built React SPA from the same port, so the entire product runs as one process.

## Responsibilities
- Mount JSON body parsing and the three route groups: `/api/health`, `/api/architecture/*`, and a static + SPA-fallback handler for everything else.
- Return strongly-typed responses (`ApiArchitectureSummary`, `ApiDiagram`, `ApiNodeDetail`) defined in `@tecture/shared`.
- Translate filesystem-level errors into structured 404 responses with codes like `diagram_not_found`, `node_not_found`, `description_not_found`, and `architecture_unreadable`.
- Fall back to `index.html` for any non-`/api/*` path so the client-side hash router can handle deep links.

## Tech Stack
- `express` 4 with `express.json()` middleware.
- `express.static` pointed at the bundled `dist/public/` directory.
- Custom error middleware for the architecture router.
- Drill into [components-api](components-api) for the internal component breakdown.
