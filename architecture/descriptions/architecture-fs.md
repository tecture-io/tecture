The concrete on-disk view of the architecture root — the directory the CLI's `--architecture-path` flag resolves to (default: `./architecture` under the current working directory). Same data as the `architecture-files` node at the system-context level, shown here as the physical storage that `cli-server` reads at request time.

## Responsibilities
- Hold `manifest.json`, `diagrams/*.json`, and `descriptions/*.md` so the loader can serve them verbatim.
- Anchor the `safeJoin` path guard — every loader call resolves paths relative to this root and rejects anything that escapes it.

## Tech Stack
- POSIX filesystem
- UTF-8 JSON + Markdown, no indexing or caching layer
