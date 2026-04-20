LLM-backed coding agent (Claude Code, Cursor, Copilot Workspace, Aider, CI bots) that authors and updates the `architecture/` directory with the same file-editing tools it uses for source code. The *writer* of the diagrams — the reason the Tecture file format is flat JSON + Markdown rather than a binary or DSL.

## Responsibilities
- Read the repo, run the Tecture skill (or follow the file-format reference), and emit `manifest.json` + `diagrams/*.json` + `descriptions/*.md`.
- Keep the architecture in sync with the code in the same commit as the feature being documented.
- Run the bundled validator before reporting success.

## Tech Stack
- Any agent with `fs.writeFile` and a shell — no MCP server or plugin required.
