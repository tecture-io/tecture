Zero-configuration viewer for file-based architecture diagrams authored by coding agents. A single-binary Node CLI (`@tecture/core`) that boots an Express process on port 3000 and serves both a REST API over the user's `architecture/` directory and a bundled React UI that renders the diagrams.

## Responsibilities
- Accept `--port` and `--architecture-path` flags, resolve the architecture root, and start listening.
- Expose a read-only HTTP API backed by the filesystem — no database, no auth, no deploy surface.
- Render the graph as an interactive, drill-down ReactFlow canvas with a per-node Markdown side panel.

## Tech Stack
- Node 20+
- Express 4, TypeScript (bundled with tsup)
- React 18 + Vite 5, @xyflow/react, elkjs, markdown-to-jsx, mermaid
- Distributed on npm as `@tecture/core`
