# Tecture

**Navigate your codebase's architecture — right inside VS Code.**

[Tecture](https://github.com/tecture-io/tecture) is an architecture documentation format (structured JSON and Markdown) that AI coding agents know how to write and maintain using a skill. This extension renders those files as interactive, navigable diagrams in your editor.

If your repo already has an `architecture/` folder, the extension activates automatically. If not, the setup below takes a couple of minutes.

![System Context diagram rendered in VS Code](https://raw.githubusercontent.com/tecture-io/tecture/main/packages/vscode/media/screenshots/system-context.png)

## Getting started

### 1. Install the Tecture skill into your coding agent

The skill teaches your agent how to read a codebase and write architecture files in the Tecture format. Works with Claude Code, Cursor, Copilot, Aider, and other major coding agents.

```bash
npx skills add tecture-io/tecture-skill
```

### 2. Generate the architecture map

From your project root, ask your agent:

> Map this codebase using Tecture

The agent reads the code and writes the architecture into an `architecture/` folder. Expect a few minutes on a medium repo.

### 3. Open the diagrams

Once the `architecture/` folder exists, the extension activates. Open the command palette (**Cmd+Shift+P** / **Ctrl+Shift+P**) and run **Tecture: Open Architecture**, or click any diagram in the **Tecture** sidebar.

## Features

### Multi-level diagram navigation

Browse system context, container, and component diagrams from the Tecture Activity Bar. Double-click a node to drill into its sub-diagram.

![Component-level diagram with drill-down](https://raw.githubusercontent.com/tecture-io/tecture/main/packages/vscode/media/screenshots/components.png)

### Component descriptions

Select any node to open a detail panel showing its Markdown description, responsibilities, and tech stack — including rendered Mermaid diagrams.

![Component description panel](https://raw.githubusercontent.com/tecture-io/tecture/main/packages/vscode/media/screenshots/component-descriptions.png)

### Persistent layout

Drag nodes to rearrange the diagram. Positions are saved to `architecture/.tecture/layouts/` in your workspace — version-controllable and shared across the team.

### Live refresh

Edit any file under `architecture/` (including `architecture/.tecture/`) and the panel reloads automatically. When the agent updates the map, you see the changes instantly.

## Requirements

- VS Code 1.90+ (or Cursor / Windsurf / VSCodium via [Open VSX](https://open-vsx.org/extension/tecture/tecture-vscode))
- A workspace containing `architecture/manifest.json`

The extension stays completely inert in repos without architecture files.

## Known limitations

- **Multi-root workspaces**: only the first workspace folder is used.
- **Theme**: the panel uses a dark color scheme. Light theme support is planned.

## Resources

- [Tecture project](https://github.com/tecture-io/tecture) — full documentation and browser-based viewer
- [Report an issue](https://github.com/tecture-io/tecture/issues)
- [Changelog](https://github.com/tecture-io/tecture/blob/main/packages/vscode/CHANGELOG.md)
- [Discord community](https://discord.gg/pHbmuBkbcp)
