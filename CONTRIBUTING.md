# Contributing to Tecture IO

Thanks for considering a contribution. Tecture IO is early-stage and every issue, PR, and design-partner conversation genuinely shapes where it goes.

This doc covers the dev loop, conventions, and publishing flow. If something here is unclear, that's a bug — please open an issue.

## Ways to contribute

- **Bug reports** — [open an issue](https://github.com/tecture-io/tecture/issues/new/choose) using the bug template. Small reproductions go a long way.
- **Feature ideas** — start a [Discussion](https://github.com/tecture-io/tecture/discussions) before a big PR so we can align on scope.
- **Good first issues** — see [`good first issue`](https://github.com/tecture-io/tecture/labels/good%20first%20issue). These are deliberately scoped to be mergeable in an evening.
- **Docs** — README, this file, Markdown node descriptions in [architecture/](architecture/). Doc PRs are always welcome.
- **Design partner feedback** — if you're using Tecture on a real project and hitting rough edges, email [shanikacj@gmail.com](mailto:shanikacj@gmail.com). That feedback loop is currently the most valuable one.

## Development setup

Requirements:

- **Node.js ≥ 20** (see [.nvmrc](.nvmrc))
- **pnpm 10** — Corepack installs it automatically; otherwise `npm install -g pnpm@10`

```bash
git clone https://github.com/tecture-io/tecture.git
cd tecture
pnpm install
pnpm dev
```

`pnpm dev` starts:

- Vite dev server for the React UI on `http://localhost:5173` (HMR enabled)
- Express API on `http://localhost:3001`

Vite proxies `/api/*` to the Express server, so open the Vite URL — don't open port 3001 directly.

### Repo layout

```
packages/
  shared/    # @tecture/shared — TypeScript types only
  web/       # @tecture/web    — React + Vite UI (private, bundled into the CLI)
  server/    # @tecture/core   — Express + CLI (the published package)
architecture/ # this project's own C4 diagrams — edit to dogfood your change
```

### Before opening a PR

1. `pnpm typecheck` — must pass in every package.
2. `pnpm build` — must produce `packages/server/dist/cli.js` + `dist/public/`.
3. `pnpm start` — open `http://localhost:3000` and verify the diagram you touched still renders.
4. If you changed the file format, update [architecture/](architecture/) in this repo so Tecture keeps dogfooding itself.
5. Update the README/CHANGELOG if your change is user-visible.

There is no test suite yet. If you add one, great — propose the framework in an issue first so we pick something that sticks.

## Commits and PRs

- **Branches** — short, kebab-case: `feat/editor-panel`, `fix/edge-arrow-direction`.
- **Commit messages** — [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`). Keep the subject under 72 characters.
- **PRs** — one focused change per PR. Fill in the PR template. Include a screenshot or GIF for UI changes.
- **Drafts are welcome** — push early, mark as draft, get feedback before polish.

## Publishing `@tecture/core` (maintainers)

```bash
# 1. Bump the version in packages/server/package.json
# 2. Build
pnpm build
# 3. Dry-run — inspect what will ship
pnpm --filter @tecture/core publish --dry-run
# 4. Publish (uses publishConfig.access = "public")
pnpm --filter @tecture/core publish
```

The published tarball contains only `dist/**` and `package.json` — no source, no tests, no lockfile.

## Reporting security issues

Please do **not** report security issues in public GitHub issues. Email [shanikacj@gmail.com](mailto:shanikacj@gmail.com) and we'll coordinate a fix and disclosure timeline.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
