The user's local `architecture/` directory — the only durable state Tecture IO has. A flat tree of `manifest.json`, `diagrams/<slug>.json`, and `descriptions/<node-id>.md` files that lives in the same Git repository as the code it describes.

## Responsibilities
- Hold the architecture as plain text so it diffs cleanly in pull requests and survives refactors by coding agents.
- Serve as the single source of truth for every diagram, node, and description the viewer renders.

## Tech Stack
- JSON (shape validated against `.claude/skills/tecture/schemas/*.schema.json`)
- GitHub-flavored Markdown with optional fenced Mermaid blocks
- Read via `node:fs/promises` by the CLI server
