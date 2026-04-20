The collapsible top-left sidebar at [packages/web/src/architecture/DiagramList.tsx](packages/web/src/architecture/DiagramList.tsx). The only affordance for jumping directly to a diagram without drilling down through parents.

## Responsibilities
- Render the architecture name + the flat list of diagrams returned by `/api/architecture`, grouped by C4 level.
- Call `onSelect(slug)` when a diagram is picked and `onGoHome()` to return to the manifest's `topDiagram`.
- Highlight the currently-open diagram and expose a collapse/expand toggle so the canvas has more room on small screens.

## Tech Stack
- React 18
- Tailwind CSS 4 (blueprint dark theme tokens)
