# Tecture

**Architecture-as-code for the AI era.**

[![npm](https://img.shields.io/npm/v/@tecture/core.svg?color=22d3ee&label=npm)](https://www.npmjs.com/package/@tecture/core)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Tecture's goal is to give humans and coding agents a common understanding of software architecture.

It's a new way to document hierarchical software architecture — JSON and Markdown files that live alongside your code, plus a visualization tool that renders them. Agents read and write the JSON and Markdown directly; humans drill through it as a multi-level diagram in the browser-based visualization tool. Same model, two readers.

Because the model lives in your repo, your agent can keep it current as the system evolves. **You review changes like any other PR.**

Existing diagrams-as-code tools were built for a person to hand-write one diagram in a DSL — the wrong shape for AI authoring, and the wrong shape for understanding a real system. A useful architecture isn't a single picture; it's a navigable model.

![Tecture interactive architecture explorer](./docs/assets/rendering-tool.png)

## Quickstart

**1. Install the Tecture skill for Claude Code** (one-time)

```bash
npx skills add tecture-io/tecture-skill
```

**2. Generate the architecture.** In Claude Code, from your project root:

> Document this codebase architecture using tecture

**3. Render it.**

```bash
npx @tecture/core
# → http://localhost:3000
```

## What it generates

A small folder of plain files your agent writes and updates with normal `fs.writeFile` calls. The [Tecture Skill](https://github.com/tecture-io/tecture-skill) packages the format and conventions as reusable instructions for Claude Code; other file-editing agents (Cursor, Copilot, Aider, …) can follow the same instructions directly — no plugin or DSL required.

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

## Roadmap

- **Sharper skills.** Specialized skills tuned for specific tech stacks, and skills that recognize and apply common reference architectures.
- **ADRs as part of the model.** Architecture Decision Records authored and maintained by agents as Markdown, linked into the relevant nodes — so the *why* lives next to the *what*.
- **Org-wide architecture repos.** Aggregate Tecture models across many repositories into a single browsable view of an entire organization's systems.

## Contributing

Contributions welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the dev loop, repo layout, and scripts.

## License

[MIT](./LICENSE) © Tecture.io
