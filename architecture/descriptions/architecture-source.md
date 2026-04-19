The developer-authored source of truth: a local directory containing one manifest file, one JSON file per diagram, and one Markdown file per node. Tecture IO is a pure read-only viewer over this directory — there is no write path, no sync, and no server-side cache.

## Responsibilities
- Hold `manifest.json` (name, description, `topDiagram`, list of diagram slugs).
- Hold `diagrams/<slug>.json` — one file per C4 level, each containing nodes and edges.
- Hold `descriptions/<node-id>.md` — one free-form Markdown file per unique node id.

## Tech Stack
- Plain `json` + `markdown` files on the local filesystem.
- Filenames use kebab-case slugs; descriptions may embed Mermaid code blocks.
- Default location is `./architecture` relative to the CLI's working directory, overridable via `--architecture-path`.
