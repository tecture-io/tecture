The tiny root component pair at [packages/web/src/main.tsx](packages/web/src/main.tsx) and [packages/web/src/App.tsx](packages/web/src/App.tsx) — mounts React into `#root` and chooses between the Architecture view and the internal Style Guide based on the URL hash.

## Responsibilities
- Subscribe to `hashchange` and parse `#/diagram/<slug>` and `#/style-guide` into a view + diagramId pair.
- Render `<ArchitectureView diagramId={...}/>` for normal traffic; `<StyleGuide/>` for the design-review route.
- Import global styles (ReactFlow stylesheet + Tailwind theme).

## Tech Stack
- React 18, `react-dom/client`
- `window.location.hash` (no router library — the app has only two top-level views)
