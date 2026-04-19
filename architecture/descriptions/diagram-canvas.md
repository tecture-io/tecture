`packages/web/src/architecture/DiagramCanvas.tsx` — the interactive graph renderer. Fetches one diagram by slug, hands it through a layout pipeline, and renders it with ReactFlow plus a custom node type and floating-edge type.

## Responsibilities
- Fetch `/api/architecture/diagrams/:diagramId` whenever the selected slug changes.
- Run the response through `diagramToFlow()` (in `transform.ts`) to produce ReactFlow nodes and edges with the right custom types.
- Run those through `layoutNodes()` (in `layout.ts`), which calls out to **ELK** for a layered hierarchical layout that respects the diagram's `TB` / `LR` direction.
- Expose pan/zoom, a mini-map, and custom node/edge renderers.
- Fire `onNodeSelect(id)` on a single click and, if a node has a `subDiagramId`, navigate the hash router to that sub-diagram on double click (the drill-down interaction).
- Show a loading overlay while the fetch + layout are in flight and an error overlay on failure.

## Tech Stack
- `@xyflow/react` (ReactFlow 12) for the interactive graph.
- `elkjs` via web-worker-free in-process layered algorithm (`layered`, orthogonal routing).
- `nodeStyles.ts` maps each `meta.type` (`service`, `database`, `frontend`, …) to a colour, border, and SVG icon; `edgeStyles.ts` maps each edge `meta.type` (`calls`, `reads`, `publishes`, …) to a colour and dashed/animated flag.
