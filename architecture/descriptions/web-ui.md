The browser-side single-page application that renders interactive C4 diagrams. Built with React 18 + Vite, shipped as static assets inside the server bundle (`dist/public/`). In production it is delivered by the same Express server that hosts the API, so the UI always talks to the same origin.

## Responsibilities
- Fetch `/api/architecture` on startup and navigate to the manifest's `topDiagram` if the URL hash is empty.
- Render each diagram as an interactive node graph (pan / zoom / mini-map) using ReactFlow, with an ELK-driven layered layout that respects the diagram's `TB` or `LR` direction.
- Handle drill-down: double-clicking a node that has `subDiagramId` navigates the hash router to that child diagram.
- Show a right-side detail panel with the node's label, type badge, technology, and Markdown description (including inline Mermaid diagrams).
- Let the user switch diagrams via a sidebar list grouped by C4 level.

## Tech Stack
- `react` 18 + `typescript` in strict mode.
- `vite` 5 dev server with HMR in development; in production the compiled bundle is served statically by Express.
- `@xyflow/react` (ReactFlow) for graphs, `elkjs` for layered layout.
- `markdown-to-jsx` for descriptions, `mermaid` for inline diagrams.
- `tailwindcss` v4 via `@tailwindcss/vite` for styling; the visual language is a "blueprint" dark theme with cyan accents.
- Drill into [components-web](components-web) for the internal component breakdown.
