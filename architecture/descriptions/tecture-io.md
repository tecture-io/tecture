Tecture renders file-based architecture diagrams that coding agents author into an `architecture/` directory in the repo. The same diagrams are viewable two ways — a zero-config CLI that serves them in a browser, and a VS Code extension that renders them in an editor panel — both reading the identical JSON + Markdown tree.

## Responsibilities
- Read a developer's `architecture/` directory (manifest + per-level diagrams + per-node Markdown) and render it as an interactive, drill-down graph with a per-node description panel.
- Offer the choice of host: `npx @tecture/core` for a local web viewer on port 3000, or the Tecture VS Code extension for an in-editor panel plus sidebar tree.
- Persist optional node-layout positions back to `architecture/.tecture` so manual arrangements survive reloads.
- Keep the two hosts behaviourally identical by sharing one UI and one data contract — only the transport (HTTP vs. webview postMessage) and the filesystem API (`node:fs` vs. `vscode.workspace.fs`) differ.
- Distribute the architecture-docs authoring skill to coding agents via the `npx @tecture/skill` installer — the channel that gets the skill writing the `architecture/` tree in the first place.
- Report anonymous, opt-out usage telemetry (C4 level + counts only, never content) to a single PostHog project from each deployable.

## Tech Stack
- pnpm monorepo, TypeScript 5.6, Node 20+
- React 18 + Vite 5, @xyflow/react, elkjs, markdown-to-jsx, mermaid (the shared UI)
- Express 4 (CLI host) and the VS Code Extension API (editor host)
- Distributed as `@tecture/core` on npm, `tecture-vscode` on the VS Code Marketplace / Open VSX, and `@tecture/skill` on npm (skill installer)
- PostHog Cloud for anonymous, opt-out telemetry
