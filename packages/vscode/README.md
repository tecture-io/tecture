# Tecture for VS Code

Render file-based architecture diagrams (`./architecture`) inside VS Code.

This extension is the editor-integrated counterpart to the `npx @tecture/core`
web app. It reuses the same React Flow + Mermaid renderer; the only difference
is that diagram JSON/Markdown is read via `vscode.workspace.fs` and the panel
lives inside an editor tab instead of a browser.

## Features (v1)

- **Open Architecture** command renders the workspace's `architecture/` folder
  in a webview panel.
- **Tecture Activity Bar** lists every diagram in the manifest; clicking opens
  the panel and selects that diagram.
- **Layout persistence**: dragging a node writes positions to
  `<workspace>/.tecture/layouts/<slug>.json` (version-controllable).
- **Live refresh**: editing any file under `architecture/` or `.tecture/`
  reloads the panel.

## Requirements

- A workspace that contains `architecture/manifest.json`. The extension
  activates only when that file is present, so it stays inert in unrelated
  repos.

## Local development

Build the webview bundle, then the host:

```bash
pnpm --filter tecture-vscode build
```

Open `packages/vscode` in VS Code and hit **F5** — this launches an Extension
Development Host with the extension loaded. Open this repo as the host's
workspace folder and run **"Tecture: Open Architecture"**.

## Running integration tests

```bash
pnpm --filter tecture-vscode test
```

Uses [`@vscode/test-cli`](https://github.com/microsoft/vscode-test-cli). On
first run, downloads VS Code Insiders (~220 MB) to `./.vscode-test/`. Tests
cover `VscodeFsArchitectureDataSource`, `VscodeFsLayoutStore`, the message
protocol handler, and command registration.

## Packaging + manual install

```bash
pnpm --filter tecture-vscode vscode:package
# produces packages/vscode/tecture-vscode-0.0.1.vsix

code --install-extension packages/vscode/tecture-vscode-0.0.1.vsix
```

Then open any folder containing `architecture/manifest.json` and run
**Cmd+Shift+P → "Tecture: Open Architecture"**.

## Architecture

```
extension host (Node) ──┐
                        ├──→ vscode.workspace.fs (architecture/, .tecture/)
                        │
                        │ postMessage(TectureRequest)
                        ▼
            webview (React + React Flow + Mermaid)
                        │
                        │ same @tecture/web components as the npx app —
                        │ only the data source layer differs.
```

The message protocol (`TectureRequest`, `TectureResponse`, `TectureEvent`)
lives in `@tecture/shared` so both sides share types.

## Known limitations (v1)

- Multi-root workspaces: only the first folder is used.
- Theme: panel is dark-only. VS Code light theme support is planned.

## Publishing

The extension publishes to both registries from a single GitHub Actions
workflow at [.github/workflows/publish-vscode.yml](../../.github/workflows/publish-vscode.yml).

### One-time setup

1. **Create the publisher account on the VS Code Marketplace**
   - Sign in to <https://dev.azure.com/> with a Microsoft account and create
     a free organisation (any name — it's only used to host the PAT).
   - Visit <https://marketplace.visualstudio.com/manage> and click
     **Create publisher**. Use ID `tecture` to match the `publisher`
     field in `package.json` (or change `package.json` to match your ID).
     If `tecture` is taken, common fallbacks are `tecture-app` or
     `shanika-tecture` — update `package.json` to whatever you claim.
   - Fill in display name, logo, and email.
2. **Generate a Marketplace Personal Access Token**
   - In Azure DevOps: top-right user menu → **Personal access tokens** →
     **+ New Token**.
   - **Organization**: *All accessible organizations* (required — Marketplace
     is global, not tied to one Azure org).
   - **Scopes**: *Custom defined* → expand **Marketplace** → check **Manage**.
   - Set expiry to the maximum (1 year). Copy the token immediately;
     it's only shown once.
3. **Create an Open VSX namespace + token** (skip if you want Marketplace-only)
   - Sign in to <https://open-vsx.org/> with GitHub.
   - Open your profile → **Namespaces** → claim `tecture` (must match
     the publisher in `package.json`).
   - Profile → **Access Tokens** → create a token. Copy it.
4. **Add the tokens as GitHub secrets**
   - Repo → **Settings → Secrets and variables → Actions → New repository secret**.
   - `VSCE_PAT` = the Azure DevOps token from step 2.
   - `OVSX_PAT` = the Open VSX token from step 3.

### Releasing a new version

```bash
# 1. bump the version in packages/vscode/package.json and add a CHANGELOG entry
# 2. commit + push to main
git tag vscode-v0.0.2
git push origin vscode-v0.0.2
```

The workflow:

- typechecks + builds the extension,
- verifies the tag matches `package.json` version,
- packages a `.vsix`,
- publishes to **VS Code Marketplace** (uses `VSCE_PAT`),
- publishes to **Open VSX** (uses `OVSX_PAT`),
- creates a GitHub Release with the `.vsix` attached.

### Manual run

In the GitHub UI: **Actions → Publish VS Code extension → Run workflow**.
Inputs:

- `dry-run: true` — builds, packages, uploads the `.vsix` as an artifact,
  publishes nothing. Use this to sanity-check before tagging.
- `skip-marketplace: true` / `skip-openvsx: true` — single-registry runs.

### Publishing manually from a local machine

```bash
cd packages/vscode
pnpm build
VSCE_PAT=… pnpm publish:marketplace
OVSX_PAT=… pnpm publish:openvsx
```

