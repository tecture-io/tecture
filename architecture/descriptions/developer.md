Human engineer who reads the rendered architecture — either by running `npx @tecture/core` and opening the browser viewer, or by installing the Tecture VS Code extension and viewing diagrams in-editor. The primary reader of the diagrams: the people writing the code (or reviewing PRs) that the architecture documents.

## Responsibilities
- View the architecture in whichever host they prefer: the local web server on `http://localhost:3000`, or the VS Code panel + sidebar tree.
- Navigate between diagrams, click nodes to read their Markdown descriptions, double-click containers to drill down, and (in VS Code) jump from a node to its source file.
- Review the JSON + Markdown diff in pull requests authored by coding agents.

## Tech Stack
- A browser, or VS Code / Cursor / Windsurf / VSCodium with the Tecture extension. No accounts.
