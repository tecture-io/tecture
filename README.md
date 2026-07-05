# Tecture

**Architecture documentation, generated and maintained by your coding agent.**

[![npm](https://img.shields.io/npm/v/@tecture/core.svg?color=22d3ee&label=npm)](https://www.npmjs.com/package/@tecture/core)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Discord](https://img.shields.io/badge/discord-join-5865F2?logo=discord&logoColor=white)](https://discord.gg/pHbmuBkbcp)

Tecture is an architecture documentation format — structured JSON and Markdown — designed for AI coding agents to write and maintain. Install a skill into your coding agent, ask it to map a repo, and get a multi-level architecture map you can navigate visually: system context → containers → components → the files that implement them.

The output is a folder of plain files that lives in the repo alongside the code. As the codebase changes, the agent updates the map the same way it ships any other change — you review the diff like any other PR.

![Tecture interactive architecture explorer](./docs/assets/rendering-tool.png)

## Quickstart

**1. Install Tecture** (works with Claude Code, Cursor, GitHub Copilot, Codex, Windsurf, and other major coding agents) — from the repo you want to map:

```bash
npx @tecture/install@latest
```

One command sets up everything (interactive — pick your agents). Re-run anytime to update; add `--check` to see what's installed, or `--yes` for a non-interactive install. Always use `@latest` so npx doesn't re-run a cached copy. It installs:

- the **architecture-docs skill** into each agent's native skills directory, and
- the **CodeGraph companion** ([`@colbymchenry/codegraph`](https://www.npmjs.com/package/@colbymchenry/codegraph), ~50 MB global npm install): a local code-intelligence index the skill uses for discovery, deep-dives, and drift checking. Its MCP server is configured for agents that support it (Claude Code, Cursor, Codex) and the repo is indexed on the spot.

**CodeGraph is required, not optional** — if its setup fails (offline, npm permissions), the install aborts with the exact commands to finish manually. Skill-only installs remain available via `npx @tecture/skill@latest`, but the skill will stop and ask for CodeGraph at authoring time. The drift check additionally needs Node ≥ 22.5 at run time. Tecture disables CodeGraph's telemetry (`CODEGRAPH_TELEMETRY=0`) for every process it spawns.

**2. Generate the map.** From your project root, either:

- **2.1** — run `/architecture-docs` in your agent's chat, *or*
- **2.2** — ask it in plain language to document your architecture.

The agent writes the map into an `architecture/` folder — a few minutes on a medium repo. Once the initial architecture exists, run a deep-dive on any component you want to explore further: `/architecture-docs deep-dive <component>`.

**3. Visualize it.**

**VS Code** — install the [Tecture extension](https://marketplace.visualstudio.com/items?itemName=Tecture.tecture-vscode) (also on [Open VSX](https://open-vsx.org/extension/tecture/tecture-vscode) for Cursor, Windsurf, and VSCodium). Open the command palette and run **Tecture: Open Architecture**, or use the Tecture sidebar. The extension activates automatically when it detects an `architecture/` folder.

![System Context diagram rendered in VS Code](./packages/vscode/media/screenshots/system-context.png)

**Browser** — if you don't use VS Code, run the standalone viewer:

```bash
npx @tecture/core
# → http://localhost:3000
```

Drill into containers and components to see what's inside. Click any node to read its Markdown description — embedded Mermaid diagrams included — for the context the code itself doesn't tell you.

## What gets generated

```
architecture/
├── manifest.json               # top-level diagram + list of diagrams
├── diagrams/
│   ├── system-context.json     # nodes + edges for one diagram
│   └── containers.json
└── descriptions/
    └── api-server.md           # Markdown description for one node
```

Each diagram is one level of a multi-level architecture view (system → containers → components). Nodes represent systems, services, datastores, and similar building blocks; edges are relationships like `calls`, `reads`, or `publishes`. See [`./architecture`](./architecture) for a worked example — this repo documents itself.

The skill also verifies the map against the code: its bundled evidence script reads the CodeGraph index, checks every node path and declared edge, and writes `architecture/.tecture/drift.json` — rendered by the viewers as a **Drift panel** (plus per-node Evidence sections), and committed so drift deltas show up in PRs.

## How it's different

- **Not a diagram DSL.** Mermaid, PlantUML, and Structurizr expect a human to author and maintain the diagram. Tecture is authored by your coding agent and kept current by the same agent.
- **Not a one-shot wiki.** Tools like DeepWiki produce a snapshot that drifts the moment the code moves. Tecture's output is files in your repo — refineable, version-controlled, regenerable.
- **Not a code-search tool.** Sourcegraph, Cody, and Greptile answer questions about individual files. Tecture produces a structured, navigable map of the whole system — the layer above per-file search.

## Vision

Tecture's goal is to make software architecture legible. Architecture knowledge today tends to live in people's heads, in stale documents, or nowhere at all. We think it should be a maintained, navigable artifact that lives with the code.

Tecture pairs AI coding agents with deterministic structural analysis. The agent writes and maintains the map; the CodeGraph index grounds it — discovery starts from the real symbol/call/import graph, and the evidence check verifies every node path and declared edge against the code, so drift is caught instead of accumulating. The human's role is to review and refine what the agent produces, the same way you'd review any other PR.

## Roadmap

- **Sharper skills.** Specialized skills tuned for specific tech stacks and common reference architectures.
- **Deeper structural analysis.** The CodeGraph integration ships today (index-first discovery, evidence-checked edges, drift reports). Next: derived candidate diagrams — module-boundary aggregation that proposes the C4 structure itself.

A hosted, multi-repo edition for organisations with many services is in design separately.

## Contributing

Contributions welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the dev loop, repo layout, and scripts.

## License

[MIT](./LICENSE) © Tecture.io
