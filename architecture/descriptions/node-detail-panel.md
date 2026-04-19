`packages/web/src/architecture/NodeDetailPanel.tsx` — the right-side drawer that appears whenever a node is selected in the canvas.

## Responsibilities
- When `selectedNodeId` changes, `GET /api/architecture/nodes/:id` and store the `ApiNodeDetail` in local state.
- Render the node's label, a coloured type badge (driven by `nodeStyles.ts`), its `meta.technology` tag, and the Markdown description via the shared markdown renderer.
- Provide a close button that clears the selection in `ArchitectureView`; escape-key handling is wired from the keyboard-hint layer.
- Show a lightweight skeleton / empty state while the fetch is in flight or when no node is selected.

## Tech Stack
- `react` hooks; no caching layer — descriptions are small, and a repeat click re-hits the API.
- `tailwindcss` utility classes for layout and motion (slide-in transition).
