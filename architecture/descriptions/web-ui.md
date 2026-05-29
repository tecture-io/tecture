The `@tecture/web` React SPA — a ReactFlow canvas, a diagram picker, and a Markdown side panel. It is transport-agnostic: the `App` takes a `WebDataSource` as a prop, so the same UI is bundled into both viewer hosts — into `packages/server/dist/public/` for the CLI (fetching over HTTP) and into `media/webview/` for the VS Code extension (fetching over postMessage). It never touches the filesystem itself.

## Responsibilities
- Parse the hash route (`#/diagram/:slug`) and redirect to the manifest's `topDiagram` when none is selected.
- Load the architecture summary, the current diagram's nodes/edges, and the selected node's description through the injected `WebDataSource` — never assuming a specific backend.
- Lay out the graph with ELK, render it with @xyflow/react, and offer drill-down on double-click plus Markdown (+ Mermaid) rendering in the side panel.
- Optionally call `openInEditor(path)` when the host provides it (VS Code), or link to the repo host when it doesn't (browser).

## Tech Stack
- React 18 + React DOM
- Vite 5 (HMR in dev, static build for prod)
- @xyflow/react 12, elkjs 0.11
- markdown-to-jsx 9, mermaid 11
- Tailwind CSS 4
- `@tecture/shared` for the API + `WebDataSource` types
