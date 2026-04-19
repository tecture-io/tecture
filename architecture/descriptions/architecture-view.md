`packages/web/src/architecture/ArchitectureView.tsx` — the orchestrator component. Owns the summary fetch, the currently-selected diagram + node, and wires the canvas, sidebar, top bar, detail panel, and keyboard hints together.

## Responsibilities
- On mount, `GET /api/architecture` once and cache the `ApiArchitectureSummary` in state.
- When no `diagramId` is in the hash, redirect to the manifest's `topDiagram`.
- Track the currently selected node id; clear it whenever the diagram changes.
- Pass the diagram id into `DiagramCanvas` (which fetches the full diagram) and the selected node id into `NodeDetailPanel` (which fetches `ApiNodeDetail`).
- Render loading and error overlays while the summary or diagram is in flight.

## Tech Stack
- `react` hooks (`useState`, `useEffect`) for local state — no global store, the state graph is small.
- Direct `fetch` calls; there is no HTTP client abstraction because the API surface is tiny.
