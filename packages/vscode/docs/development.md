# Developing the Tecture VS Code extension

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable`)
- VS Code (for F5 debugging)

## Project structure

```
packages/vscode/
  src/                    Extension host code (TypeScript → CJS via tsup)
    extension.ts          Activation, commands, file watcher
    panel.ts              WebviewPanel manager, CSP, HTML composition
    dataSource.ts         vscode.workspace.fs adapters for ArchitectureDataSource
    messaging.ts          Typed request/response handler
    treeView.ts           Activity Bar diagram list
  webview-entry/          Webview React app entry point
    main.tsx              PostMessage data source + shell
    postMessageDataSource.ts
    styles.css            Tailwind source scan wrapper
  media/
    icons/                Activity Bar SVG + Marketplace PNG
    webview/              Built React bundle (gitignored)
    screenshots/          README screenshots
  test/
    suite/                @vscode/test-cli integration tests
    fixtures/             Sample architecture/ folder for tests
  docs/                   Developer and publishing documentation
```

## Building

```bash
# Full build (webview + host)
pnpm --filter tecture-vscode build

# Webview only (Vite)
pnpm --filter tecture-vscode build:webview

# Host only (tsup)
pnpm --filter tecture-vscode build:host
```

## Running locally

1. Run `pnpm --filter tecture-vscode build`
2. Open `packages/vscode` in VS Code
3. Press **F5** — this launches an Extension Development Host
4. In the host window, open a folder containing `architecture/manifest.json`
5. Run **Cmd+Shift+P → "Tecture: Open Architecture"**

## Running tests

```bash
pnpm --filter tecture-vscode test
```

On first run, `@vscode/test-electron` downloads VS Code (~220 MB) to
`.vscode-test/`. Tests run inside a real Extension Development Host against
the fixture workspace at `test/fixtures/sample-workspace/`.

Tests cover:

- `activation.test.ts` — command registration
- `dataSource.test.ts` — manifest/diagram/description reads, error paths
- `messaging.test.ts` — full request/response protocol round-trips

## Packaging

```bash
pnpm --filter tecture-vscode vscode:package
# → tecture-vscode-<version>.vsix
```

Install locally:

```bash
code --install-extension packages/vscode/tecture-vscode-*.vsix
```

## Architecture

```
Extension host (Node)
  │
  ├── vscode.workspace.fs    reads architecture/ (incl. architecture/.tecture/)
  │
  │   postMessage({ id, type, ... })
  ▼
Webview (React + React Flow + Mermaid)
  │
  │   Reuses @tecture/web components verbatim.
  │   Only the data source layer differs:
  │     createHttpDataSource()        → npx app (fetch)
  │     createPostMessageDataSource() → VS Code extension
  │
  └── Types shared via @tecture/shared
      (TectureRequest, TectureResponse, TectureEvent)
```

## Typecheck

```bash
pnpm --filter tecture-vscode typecheck
```

The webview entry (`webview-entry/`) is excluded from TypeScript and bundled
by Vite separately. Only `src/` and `test/` are typechecked.
