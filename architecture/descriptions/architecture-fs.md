The directory on the developer's local disk that the CLI points at. It is the only persistent state Tecture IO touches — there is no database, no remote storage, and no write path.

## Responsibilities
- Provide `manifest.json` at the root, listing the top diagram slug and all other diagram slugs.
- Provide `diagrams/<slug>.json` files, each conforming to the C4 diagram schema (nodes + edges + optional layout meta).
- Provide `descriptions/<node-id>.md` files — one per unique node id — with free-form Markdown that may embed Mermaid blocks.

## Tech Stack
- Plain `json` + `markdown` files on the local filesystem.
- Accessed via `node:fs/promises` inside the API server; all paths go through a `safeJoin()` guard that rejects traversal attempts outside the configured root.
- Slug pattern `^[a-z0-9]+(-[a-z0-9]+)*$` is enforced before any file lookup, so malformed ids short-circuit to a 404.
