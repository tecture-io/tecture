The right-hand Markdown side panel at [packages/web/src/architecture/NodeDetailPanel.tsx](packages/web/src/architecture/NodeDetailPanel.tsx), paired with [MarkdownContent.tsx](packages/web/src/architecture/MarkdownContent.tsx) and [MermaidBlock.tsx](packages/web/src/architecture/MermaidBlock.tsx). Opens when a node is selected and renders the node's `descriptions/<id>.md` — including any fenced ```mermaid sub-diagrams — as HTML.

## Responsibilities
- Fetch `/api/architecture/nodes/:id` whenever the selected node changes; show loading/error states on failure.
- Render the node's label, technology tag, and Markdown body using `markdown-to-jsx`.
- Intercept ```` ```mermaid ```` fenced blocks and render them inline via `MermaidBlock`, with a click-to-expand full-screen lightbox.

## Tech Stack
- React 18
- markdown-to-jsx 9
- mermaid 11
