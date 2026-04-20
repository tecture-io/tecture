The top-level architecture page at [packages/web/src/architecture/ArchitectureView.tsx](packages/web/src/architecture/ArchitectureView.tsx). Owns the data the rest of the UI depends on — the architecture summary and the currently-selected node — and composes the three child panels.

## Responsibilities
- Fetch `/api/architecture` once on mount and hold the summary (name + diagram list + `topDiagram`) in state.
- When no diagram is selected, redirect to `#/diagram/<topDiagram>` so the canvas has something to render.
- Render the `DiagramCanvas`, the `DiagramList` sidebar, the `KeyboardHint` overlay, and conditionally the `NodeDetailPanel` when a node is selected.

## Tech Stack
- React 18 (hooks only)
- `fetch` against the local Express API
