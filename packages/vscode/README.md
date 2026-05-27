# Tecture

**AI-generated architecture diagrams for complex codebases — rendered inside VS Code.**

Tecture is a code-comprehension tool. Point your AI coding agent at any repo
and it generates a multi-level architecture map (system context, containers,
components) as plain JSON and Markdown files in an `architecture/` folder.
This extension renders those files as interactive diagrams directly in your
editor — no browser or local server needed.

Learn more about the open-source project, how to generate architecture files,
and the CLI renderer at
[github.com/tecture-io/tecture](https://github.com/tecture-io/tecture).

![System Context diagram rendered in VS Code](https://raw.githubusercontent.com/tecture-io/tecture/main/packages/vscode/media/screenshots/system-context.png)

## Quick start

### 1. Install the extension

Search **"Tecture"** in the VS Code Extensions view, or:

```
ext install Tecture.tecture-vscode
```

Also available on [Open VSX](https://open-vsx.org/extension/tecture/tecture-vscode)
for Cursor, Windsurf, and VSCodium.

### 2. Generate architecture files

From your project root, install the Tecture skill and ask your coding agent to
map the codebase:

```bash
npx skills add tecture-io/tecture-skill
```

Then ask your agent:

> Map this codebase using Tecture

The agent reads your code and writes the architecture into an `architecture/`
folder. See the [project README](https://github.com/tecture-io/tecture#quickstart)
for details on supported agents (Claude Code, Cursor, Codex, and others).

### 3. Open the diagrams

Open the command palette (**Cmd+Shift+P** / **Ctrl+Shift+P**) and run
**Tecture: Open Architecture**, or click any diagram in the **Tecture**
sidebar.

## Features

### Multi-level diagram navigation

Browse system context, container, and component diagrams from the Tecture
Activity Bar. Double-click a node to drill into its sub-diagram.

![Component-level diagram with drill-down](https://raw.githubusercontent.com/tecture-io/tecture/main/packages/vscode/media/screenshots/components.png)

### Component descriptions

Select any node to open a detail panel showing its Markdown description,
responsibilities, and tech stack — including rendered Mermaid diagrams.

![Component description panel](https://raw.githubusercontent.com/tecture-io/tecture/main/packages/vscode/media/screenshots/component-descriptions.png)

### Persistent layout

Drag nodes to rearrange the diagram. Positions are saved to
`.tecture/layouts/` in your workspace — version-controllable and shared
across the team.

### Live refresh

Edit any file under `architecture/` or `.tecture/` and the panel reloads
automatically. When the agent updates the map, you see the changes instantly.

## Requirements

- VS Code 1.90+ (or Cursor / Windsurf / VSCodium)
- A workspace containing `architecture/manifest.json`

The extension activates only when that file is present, so it stays
completely inert in unrelated repos.

## Known limitations

- **Multi-root workspaces**: only the first workspace folder is used.
- **Theme**: the panel uses a dark color scheme. Light theme support is
  planned.

## Resources

- [Tecture project](https://github.com/tecture-io/tecture) — how to
  generate architecture files, CLI renderer, and full documentation
- [Report an issue](https://github.com/tecture-io/tecture/issues)
- [Changelog](https://github.com/tecture-io/tecture/blob/main/packages/vscode/CHANGELOG.md)
- [Discord community](https://discord.gg/pHbmuBkbcp)
- [Contributing](https://github.com/tecture-io/tecture/blob/main/packages/vscode/docs/development.md)
