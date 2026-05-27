The `@tecture/web` React SPA — a ReactFlow canvas, a diagram picker, and a Markdown side panel — built with Vite and bundled into `packages/server/dist/public/` at publish time. In production it runs entirely in the developer's browser; the Express process only serves its static assets plus the JSON API it fetches.

## Responsibilities
- Parse the hash route (`#/diagram/:slug`) and redirect to the manifest's `topDiagram` when none is selected.
- Fetch the architecture summary, the current diagram's nodes/edges, and the selected node's description, all from `/api/architecture/*`.
- Lay out the graph with ELK, render it with @xyflow/react, and offer drill-down on double-click and Markdown (+ Mermaid) rendering in the side panel.

## Tech Stack
- React 18 + React DOM
- Vite 5 (HMR on :5173 in dev, static build for prod)
- @xyflow/react 12, elkjs 0.11
- markdown-to-jsx 9, mermaid 11
- Tailwind CSS 4
