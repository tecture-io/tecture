# Publishing the Tecture VS Code extension

The extension publishes to both the VS Code Marketplace and Open VSX from a
single GitHub Actions workflow at
[`.github/workflows/publish-vscode.yml`](../../../.github/workflows/publish-vscode.yml).

## One-time setup

### 1. VS Code Marketplace publisher

- Sign in to <https://dev.azure.com/> with a Microsoft account. Create a free
  Azure DevOps organisation if you don't have one (any name — it only hosts
  the PAT).
- Visit <https://marketplace.visualstudio.com/manage> and click **Create
  publisher**. The publisher ID must match the `publisher` field in
  `packages/vscode/package.json` exactly (case-sensitive).
- Fill in display name, logo, and email.

### 2. Marketplace Personal Access Token

- In Azure DevOps: top-right user menu → **Personal access tokens** →
  **+ New Token**.
- **Organization**: *All accessible organizations*.
- **Scopes**: *Custom defined* → expand **Marketplace** → check **Manage**.
- Set expiry to the maximum allowed. Copy the token immediately — it's shown
  once.

### 3. Open VSX namespace + token

- Sign in to <https://open-vsx.org/> with GitHub.
- Link an Eclipse Foundation account from the Profile tab and sign the
  Publisher Agreement.
- Go to **Namespaces** → **Create namespace** → enter the publisher name
  (matches `package.json`).
- Go to **Access Tokens** → **Generate new token**. Copy it.

### 4. GitHub secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Source |
|---|---|
| `VSCE_PAT` | Azure DevOps token from step 2 |
| `OVSX_PAT` | Open VSX token from step 3 |

## Releasing a new version

```bash
# 1. Bump version in packages/vscode/package.json
# 2. Add a CHANGELOG.md entry
# 3. Commit and push to main
git tag vscode-v<version>
git push origin vscode-v<version>
```

The workflow:

1. Typechecks and builds the extension
2. Verifies the tag matches the `package.json` version
3. Packages a `.vsix`
4. Publishes to **VS Code Marketplace** (uses `VSCE_PAT`)
5. Publishes to **Open VSX** (uses `OVSX_PAT`)
6. Creates a **GitHub Release** with the `.vsix` attached

## Manual workflow run

In the GitHub UI: **Actions → Publish VS Code extension → Run workflow**.

| Input | Effect |
|---|---|
| `dry-run: true` | Builds and uploads the `.vsix` artifact; publishes nothing |
| `skip-marketplace: true` | Skips the Marketplace publish step |
| `skip-openvsx: true` | Skips the Open VSX publish step |

## Publishing from a local machine

```bash
cd packages/vscode
pnpm build
VSCE_PAT=… pnpm publish:marketplace
OVSX_PAT=… pnpm publish:openvsx
```

## Token maintenance

- **VSCE_PAT** expires after 90 days (max Azure DevOps preset). Regenerate at
  <https://dev.azure.com/shanikawijerathna/_usersSettings/tokens> and update
  the GitHub secret before it lapses.
- **OVSX_PAT** does not expire unless revoked.
- Microsoft is deprecating "all accessible organizations" PATs on
  **December 1, 2026**. When that happens, create an org-scoped PAT and
  update the secret.
