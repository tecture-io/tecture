<h1 align="center">Tecture</h1>

<p align="center">
  <strong>Architecture-as-code for the AI era.</strong><br/>
  
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@tecture/core"><img alt="npm" src="https://img.shields.io/npm/v/@tecture/core.svg?color=22d3ee&label=npm"></a>
  <a href="https://github.com/tecture-io/tecture/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
</p>

Coding agents can already read every file in a repo and reason about its structure. Tecture gives them a format to write what they find as living documentation: a structured graph of services, datastores, and their relationships, explained in plain Markdown, rendered as an interactive drill-down explorer in your browser.

The architecture lives in your repo as plain files. Your agent maintains it like any other code.

<p align="center">
  <img src="docs/assets/rendering-tool.png" alt="Tecture IO — interactive architecture explorer with Markdown node descriptions" width="100%">
</p>

## Quickstart

**1. Install the Tecture skill** (one-time)

```bash
npx skills add tecture-io/tecture-skill
```

The [skills.sh](https://skills.sh) CLI auto-detects your installed agents (Claude Code, Copilot, Cursor, Cline, …) and wires the skill into the right directory. Prefer `git clone` or `gh skill install`? See the [mirror README](https://github.com/tecture-io/tecture-skill#install) for alternates.

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

Each diagram is one level of a multi-level architecture view (system → containers → components); each node is a system/service/datastore/etc.; each edge is a relationship like `calls`, `reads`, or `publishes`. See [architecture/](architecture/) for a complete worked example — this repo documents itself.

## Contributing

Contributions welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the dev loop, repo layout, and scripts.

## License

[MIT](LICENSE) © Tecture.io
