The interactive graph surface at [packages/web/src/architecture/DiagramCanvas.tsx](packages/web/src/architecture/DiagramCanvas.tsx). Given a `diagramId`, it fetches the diagram, runs ELK layout, and hands the positioned nodes + edges to @xyflow/react for rendering, zoom, pan, and minimap.

## Responsibilities
- Fetch `/api/architecture/diagrams/:id`, transform the Tecture node/edge shape into ReactFlow's `Node`/`Edge` types (`diagramToFlow`), and drop edges whose source or target is missing.
- Await `layoutDiagram()` — an ELK layered, orthogonal-routing pass — before making the canvas visible (fade-in once positions are resolved).
- Handle click → `onSelectNode(id)` and double-click → `onDrillIn(subDiagramId)` to drive selection and drill-down in the parent view.

## Tech Stack
- @xyflow/react 12 (ReactFlow)
- elkjs 0.11 (`layered`, `ORTHOGONAL` edge routing)
- Custom `ArchitectureNode` node type and `FloatingEdge` edge type
