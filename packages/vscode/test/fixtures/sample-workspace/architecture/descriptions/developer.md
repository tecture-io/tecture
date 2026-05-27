Human engineer who installs `@tecture/core`, runs the CLI from their project root, and explores the rendered architecture in the browser. The primary reader of the diagrams — the people writing the code (or reviewing PRs) that the architecture documents.

## Responsibilities
- Run `npx @tecture/core` (or `pnpm start`) from a project that contains an `architecture/` directory.
- Open `http://localhost:3000`, navigate between diagrams, click nodes to read their Markdown descriptions, double-click containers to drill down.
- Review the JSON + Markdown diff in pull requests authored by coding agents.

## Tech Stack
- Browser of choice; no plugins or accounts.
