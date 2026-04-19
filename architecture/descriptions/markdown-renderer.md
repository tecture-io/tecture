`packages/web/src/architecture/MarkdownContent.tsx` + `MermaidBlock.tsx` — a thin wrapper over `markdown-to-jsx` that turns the raw Markdown returned by the API into a styled React tree, with two small customisations.

## Responsibilities
- Render GitHub-flavored Markdown using `markdown-to-jsx`.
- Override the `<a>` component so any link with an absolute `http(s)://` target opens in a new tab with `rel="noopener noreferrer"`.
- Override the `<pre>` component so that fenced code blocks with `language-mermaid` are diverted into `MermaidBlock`, which initialises `mermaid` lazily and renders the diagram inline as SVG, with a click-to-expand lightbox for larger views.
- Fall back to a plain `<pre><code>` for every other language (syntax highlighting is intentionally out of scope).

## Tech Stack
- `markdown-to-jsx` 9 for parsing.
- `mermaid` 11 for inline diagrams, loaded once and reused across blocks.
- Styling via `tailwindcss` prose utilities plus a few overrides in `styles.css`.
