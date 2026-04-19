<!-- TODO: replace with a logo at .github/assets/logo.svg once available -->

<h1 align="center">Tecture IO</h1>

<p align="center">
  <strong>Architecture-as-code for humans and agents.</strong><br/>
  Author C4 diagrams as JSON + Markdown in your repo. Explore them in your browser. Commit them with the code they describe.
</p>

<p align="center">
  <a href="#quickstart">Quickstart</a> ·
  <a href="#features">Features</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#for-ai-agents">For AI agents</a> ·
  <a href="#roadmap">Roadmap</a> ·
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@tecture/core"><img alt="npm" src="https://img.shields.io/npm/v/@tecture/core.svg?color=22d3ee&label=npm"></a>
  <a href="https://github.com/tecture-io/tecture/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <img alt="Status: alpha" src="https://img.shields.io/badge/status-alpha-orange.svg">
  <a href="https://github.com/tecture-io/tecture/pulls"><img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg"></a>
</p>

<!-- TODO: replace with a screenshot or GIF at .github/assets/hero.png -->
<p align="center">
  <em>Screenshot coming soon — drill-down C4 navigation with Markdown node descriptions.</em>
</p>

> **Status:** alpha (v0.x). The file format and CLI flags may change before 1.0. Pin your version.

## Why Tecture IO

Architecture documentation rots. Diagrams drift from the code they describe, live in wikis nobody opens, and get rewritten from memory at the next design review. The moment a diagram lives outside your repo, it stops being true.

Tecture IO keeps architecture *in the repo*, *as files* — a small JSON graph plus a Markdown file per node. Humans read it in an interactive browser UI. LLM agents read it with `fs.readFile`. Both edit it through normal pull requests. When the code changes, the architecture can change with it in the same commit.

## Quickstart

```bash
# In any repo that has an ./architecture/ folder
npx @tecture/core
# → Tecture IO running at http://localhost:3000
```

Don't have an `./architecture/` folder yet? Copy [this repo's own one](architecture/) as a starting point — Tecture IO documents itself with Tecture IO.

## Features

- **Zero config.** One command, one port. No database, no auth, no deploy.
- **C4 drill-down.** Navigate System Context → Containers → Components by double-clicking a node.
- **Rich node descriptions.** Every node has a Markdown file. Embed Mermaid sub-diagrams, code blocks, links, tables.
- **Interactive canvas.** ReactFlow + ELK auto-layout, pan, zoom, mini-map, fit-to-view.
- **Deep links.** Hash-based routes (`#/diagram/containers`) — paste a link, land on the exact view.
- **Blueprint dark theme.** Tuned for long reading sessions and architectural reviews.
- **Pure files.** Version-controlled, diff-able, reviewable in PRs. No proprietary DSL.
- **Agent-friendly format.** Flat JSON graph + one Markdown file per node. LLMs can author it without special tools.
- **Single-binary CLI.** The published package is one `tsup`-bundled ESM file plus the built UI.
- **Node 20+.** That's the only requirement.

## How it works

Tecture IO reads a directory that looks like this:

```
architecture/
├── manifest.json               # top-level diagram + list of diagrams
├── diagrams/
│   ├── system-context.json     # nodes + edges for the System Context diagram
│   ├── containers.json         # nodes + edges for the Containers diagram
│   └── ...
└── descriptions/
    ├── api-server.md           # Markdown description for the 'api-server' node
    ├── web-ui.md
    └── ...
```

- A **diagram** is one view at one [C4](https://c4model.com/) level (System Context, Container, or Component).
- A **node** is a system, person, service, database, queue, gateway, frontend, cache, storage, or external dependency.
- An **edge** describes a relationship: `calls`, `reads`, `writes`, `publishes`, `subscribes`, or generic `data-flow`.
- Every node ID in a diagram's JSON corresponds to a `descriptions/<id>.md` file rendered in the side panel.

See [architecture/](architecture/) in this repo for a complete working example.

## For AI agents

The file format is deliberately LLM-friendly: **flat JSON graphs and Markdown** — no proprietary DSL, no binary formats, no vendor lock-in. Agents can read the current architecture with `fs.readFile`, propose changes with `fs.writeFile`, and let humans review the diff as a normal pull request.

A bundled MCP server and an `architecture-files` authoring skill are [on the roadmap](#roadmap) — in the meantime, any agent that can edit files in your repo can already edit your architecture.

## Roadmap

- [x] Read-only viewer with C4 drill-down
- [x] Markdown + Mermaid node descriptions
- [x] Single-port `npx @tecture/core` launch
- [x] Hash-based deep links
- [ ] In-browser editor — author nodes and edges from the UI
- [ ] MCP server for agent-driven architecture authoring
- [ ] Export to PNG / SVG / PDF
- [ ] Live reload on file changes
- [ ] Theme customization
- [ ] JSON schema published for IDE autocompletion

Have a different priority? [Open an issue](https://github.com/tecture-io/tecture/issues/new/choose) or jump into [Discussions](https://github.com/tecture-io/tecture/discussions).

## Development

Requirements: **Node.js ≥ 20** and **pnpm 10** (Corepack installs it automatically).

```bash
pnpm install
pnpm dev
```

`pnpm dev` runs two processes in parallel:

| Process | Port | Purpose                                         |
|---------|------|-------------------------------------------------|
| Vite    | 5173 | React UI with HMR                               |
| Express | 3001 | API; Vite proxies `/api/*` to it                |

Open `http://localhost:5173`.

### Repo layout

```
tecture-io/
├── packages/
│   ├── shared/     # @tecture/shared — TS types (source-only)
│   ├── web/        # @tecture/web    — React + Vite UI (private)
│   └── server/     # @tecture/core   — Express + CLI (published)
├── architecture/   # this project documented in Tecture IO
└── pnpm-workspace.yaml
```

Only `@tecture/core` is published. `@tecture/web` and `@tecture/shared` are bundled into it at build time.

### Scripts

| Script           | What it does                                                    |
|------------------|-----------------------------------------------------------------|
| `pnpm dev`       | Runs web + server in parallel                                   |
| `pnpm build`     | Builds web, then server (bundles UI into `server/dist/public/`) |
| `pnpm start`     | Runs the built CLI locally                                      |
| `pnpm typecheck` | Typechecks every package                                        |
| `pnpm clean`     | Removes all `dist/` folders                                     |

Full contributor workflow — including publishing steps — lives in [CONTRIBUTING.md](CONTRIBUTING.md).

## Contributing

Contributions are very welcome — Tecture IO is early-stage and shaped by the people using it. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the dev loop, and check issues tagged [`good first issue`](https://github.com/tecture-io/tecture/labels/good%20first%20issue) for a gentle on-ramp.

Interested in being a design partner or have feedback on the file format? Email [shanikacj@gmail.com](mailto:shanikacj@gmail.com) or open a thread in [Discussions](https://github.com/tecture-io/tecture/discussions).

All participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © Shanika Wijerathna
