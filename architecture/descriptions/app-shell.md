`packages/web/src/App.tsx` — the tiny top-level component that owns client-side routing. Listens to `window.hashchange`, parses the hash, and swaps between the two top-level views.

## Responsibilities
- Maintain a `useHashRoute` state that resubscribes on each mount.
- Parse the hash into one of two routes: `#/style-guide` → the internal design-system page, or `#/diagram/:diagramId` (or empty) → the main `ArchitectureView`.
- Pass the parsed `diagramId` (or `null` when absent) down to `ArchitectureView` so it can fall back to `topDiagram`.

## Tech Stack
- `react` 18 with hooks — no router dependency, hash routing keeps static hosting trivial (the Express SPA fallback only has to serve one `index.html`).
