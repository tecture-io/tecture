The single user persona for Tecture IO — a software engineer or architect who authors a C4 architecture as local files and wants to explore it visually without deploying anything.

## Responsibilities
- Author `manifest.json`, diagram JSON files, and per-node markdown descriptions in a local `architecture/` directory.
- Install and run the CLI from the npm registry: `npx @tecture/core` (optionally `--port` / `--architecture-path`).
- Open the local URL in a browser to pan, drill into sub-diagrams, and read node descriptions.

## Tech Stack
- Any editor or IDE to produce JSON + Markdown.
- Node.js ≥ 20 to execute the bundled CLI.
- A modern browser to run the React UI.
