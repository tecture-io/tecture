# Skill Distribution

The `architecture-docs` agent skill (source of truth: `.claude/skills/architecture-docs/` in this repo) is distributed through **two first-party npm installers** that bundle the same payload:

- [`@tecture/install`](https://www.npmjs.com/package/@tecture/install) — **the primary entry point**: installs the skill *and* the mandatory CodeGraph companion (global `@colbymchenry/codegraph` CLI, MCP config for Claude Code/Cursor/Codex, repo index). Built from [`packages/install`](../packages/install).
- [`@tecture/skill`](https://www.npmjs.com/package/@tecture/skill) — the **pure skill installer** (no child processes, no CodeGraph). Built from [`packages/installer`](../packages/installer); `@tecture/install` reuses its logic as a library and bundles it at build time.

Last verified: **2026-07-06**.

## Install

```bash
npx @tecture/install@latest    # skill + CodeGraph companion (recommended)
npx @tecture/skill@latest      # skill only
```

Both bundle the skill — version-locked to `@tecture/skill`'s package version — and copy it into each agent's *native* skills directory: Claude Code, Cursor, GitHub Copilot, Codex, Windsurf. A skill installed once is immediately visible to the agent (no symlinks, no registry, no network for the skill itself). Re-run to update in place; `--check` reports status; `remove` uninstalls (leaving CodeGraph in place). Agent directories are maintained in [`packages/installer/src/agents.ts`](../packages/installer/src/agents.ts) (verified against each vendor's docs); the agent→CodeGraph MCP target map lives in [`packages/install/src/codegraph.ts`](../packages/install/src/codegraph.ts).

Note the skill itself **hard-requires CodeGraph** at authoring time (discovery, deep-dives, and the evidence/drift check read its index) — a `@tecture/skill`-only install still works, but the skill stops and points at `npx @tecture/install` until the index exists.

## Release procedure

When the skill at `.claude/skills/architecture-docs/` ships a meaningful change:

1. **Bump the canonical source** (this repo). Commit to `main`.
2. **Release `@tecture/skill`** — bump `packages/installer/package.json`, then push a `skill-v<version>` tag. GitHub Actions ([`publish-skill.yml`](../.github/workflows/publish-skill.yml)) bundles the current skill, validates it (validator + evidence self-test), checks the tag matches the version, publishes to npm, and creates a GitHub release. The bundled skill is taken from `.claude/skills/architecture-docs/` at build time, so this is how skill changes reach users.
3. **Release `@tecture/install`** — bump `packages/install/package.json`, then push an `install-v<version>` tag ([`publish-install.yml`](../.github/workflows/publish-install.yml), same gates). It stamps its bundled skill with `@tecture/skill`'s version, so release the skill first when both change.
4. **Update "Last verified"** at the top of this file.

## Decommissioned channels

`@tecture/skill` is the only supported channel. These were retired in favor of it:

- **`gh skill` / manual clone** — served by the mirror repo [tecture-io/architecture-docs](https://github.com/tecture-io/architecture-docs), now **archived** (read-only, with a deprecation note pointing to `@tecture/skill`). The `sync-skill.yml` workflow that fed it has been removed.
- **[skills.sh](https://skills.sh) (`npx skills add`)** — installs to `~/.agents/skills/` without the `~/.claude/skills/` symlink, so the skill is invisible to Claude Code, our primary target ([vercel-labs/skills#744](https://github.com/vercel-labs/skills/issues/744)).
- **[tech-leads-club/agent-skills](https://github.com/tech-leads-club/agent-skills)** — curated registry; PR [#102](https://github.com/tech-leads-club/agent-skills/pull/102) closed.
- **[github/awesome-copilot](https://github.com/github/awesome-copilot)** — not pursued.
- **[anthropics/skills](https://github.com/anthropics/skills)** — closed to outside contributions; Anthropic first-party only.
- **[SkillsMP.com](https://skillsmp.com)** — aggregator; no verified install metrics, low ROI.
- **Claude plugin marketplace** — plugins bundle skills + MCP + hooks. Revisit only if the skill grows an MCP component.
