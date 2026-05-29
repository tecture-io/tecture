The concrete on-disk view of the architecture root — the directory both viewer hosts read at request time. For the CLI it's whatever `--architecture-path` resolves to (default `./architecture`); for the VS Code extension it's the `tecture.architecturePath` setting resolved against the workspace folder. Same data as the `architecture-files` node at the system-context level, shown here as the physical storage the hosts read and write.

## Responsibilities
- Hold `manifest.json`, `diagrams/*.json`, and `descriptions/*.md` so either loader can serve them verbatim.
- Hold the optional `.tecture/layouts/*.json` node-position files that both `LayoutStore` implementations write back when a user drags or resizes nodes.
- Anchor each host's path guard — every read resolves relative to this root and rejects anything that escapes it (`safeJoin` in the CLI, the URI + `SLUG_RE` checks in the extension).

## Tech Stack
- POSIX filesystem, accessed via `node:fs/promises` (CLI) or `vscode.workspace.fs` (extension)
- UTF-8 JSON + Markdown, no indexing or caching layer
