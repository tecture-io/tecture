# Tecture

**Architecture maps for complex codebases.**
*Your AI coding agent generates the map; you navigate it to understand the system.*

[![npm](https://img.shields.io/npm/v/@tecture/core.svg?color=22d3ee&label=npm)](https://www.npmjs.com/package/@tecture/core)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Discord](https://img.shields.io/badge/discord-join-5865F2?logo=discord&logoColor=white)](https://discord.gg/pHbmuBkbcp)

Tecture is a code-comprehension tool. Point a coding agent (Claude Code, Cursor, Codex) at any repo, and the agent reads the code and writes a multi-level architectural map — system context → containers → components → the files that implement them. You navigate the result in the browser to learn how the system actually fits together, without paging a senior engineer to walk you through it.

The map is a folder of JSON and Markdown files that lives in the repo. As the code changes, the agent keeps the map current the same way it ships any other change. **You review the diff like any other PR.**

![Tecture interactive architecture explorer](./docs/assets/rendering-tool.png)

## Quickstart

**1. Install the Tecture skill** (one-time — works with Claude Code, Cursor, Copilot, Aider, and other major coding agents)

```bash
npx skills add tecture-io/tecture-skill
```

**2. Generate the map.** From your project root, ask your agent:

> Map this codebase using Tecture

The agent reads your code and writes the architecture into a new `architecture/` folder. Expect a few minutes on a medium repo.

**3. Render it.**

```bash
npx @tecture/core
# → http://localhost:3000
```

Click into any container or component to drill down. Read the Markdown descriptions for the *why* the code doesn't tell you on its own.

## What gets generated

A small folder of plain files your agent writes and updates with normal `fs.writeFile` calls.

```
architecture/
├── manifest.json               # top-level diagram + list of diagrams
├── diagrams/
│   ├── system-context.json     # nodes + edges for one diagram
│   └── containers.json
└── descriptions/
    └── api-server.md           # Markdown description for one node
```

Each diagram is one level of a multi-level architecture view (system → containers → components); each node is a system, service, datastore, etc.; each edge is a relationship like `calls`, `reads`, or `publishes`. See [`./architecture`](./architecture) for a complete worked example — this repo documents itself.

## How it's different

- **Not a diagram DSL.** Mermaid, PlantUML, and Structurizr expect a human to author and maintain the diagram by hand — that's why they go stale. Tecture's diagram is authored by your agent; you read it, the agent keeps it current.
- **Not an auto-generated wiki.** Snapshot wikis like DeepWiki produce a one-shot view you can't edit and that drifts the moment the code moves. Tecture's output is files in your repo — refineable, version-controlled, regenerable.
- **Not a code-search tool.** Sourcegraph, Cody, and Greptile answer questions about individual files. Tecture produces a *structured, navigable map of the whole system* — the layer above per-file Q&A.

## Roadmap

- **VS Code plugin.** Render the map inside the IDE — no separate browser tab, no `npx` step.
- **Sharper skills.** Specialized skills tuned for specific tech stacks, and skills that recognize and apply common reference architectures.

A hosted, multi-repo edition for organisations with many services is in design separately.

## Contributing

Contributions welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the dev loop, repo layout, and scripts.

## License

[MIT](./LICENSE) © Tecture.io
