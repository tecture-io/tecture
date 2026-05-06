The three-pane UI surface rendered inside [ArchitectureView](../../packages/web/src/architecture/ArchitectureView.tsx): a left rail listing diagrams, the ReactFlow canvas in the center, and a slide-in detail panel on the right. Together they form the only layout the app ever shows.

## Responsibilities
- Divide the viewport into list / canvas / detail regions without any pane owning layout state of its own
- Accept props from `architecture-view` (currentDiagramId, selectedNodeId) and render; never fetch routing state directly
- Communicate pane-to-pane only through the parent's callbacks (canvas `onSelectNode` → detail panel input)

## Tech Stack
- React 18 functional components under [packages/web/src/architecture/](../../packages/web/src/architecture/)
