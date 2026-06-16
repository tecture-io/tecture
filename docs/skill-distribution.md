# Skill Distribution

The `architecture-docs` agent skill (source of truth: `.claude/skills/architecture-docs/` in this repo) is distributed through a **single channel**: the first-party [`@tecture/skill`](https://www.npmjs.com/package/@tecture/skill) npm installer.

Last verified: **2026-06-17**.

## Install

```bash
npx @tecture/skill@latest
```

The installer (built from [`packages/installer`](../packages/installer)) bundles the skill — version-locked to the package version — and copies it into each agent's *native* skills directory: Claude Code, Cursor, GitHub Copilot, Codex, Windsurf. A skill installed once is immediately visible to the agent (no symlinks, no registry, no network). Re-run to update in place; `--check` reports status; `remove` uninstalls. Agent directories are maintained in [`packages/installer/src/agents.ts`](../packages/installer/src/agents.ts) (verified against each vendor's docs).

## Release procedure

When the skill at `.claude/skills/architecture-docs/` ships a meaningful change:

1. **Bump the canonical source** (this repo). Commit to `main`.
2. **Release `@tecture/skill`** — bump `packages/installer/package.json`, then push a `skill-v<version>` tag. GitHub Actions ([`publish-skill.yml`](../.github/workflows/publish-skill.yml)) bundles the current skill, validates it, checks the tag matches the version, publishes to npm, and creates a GitHub release. The bundled skill is taken from `.claude/skills/architecture-docs/` at build time, so this is how skill changes reach users.
3. **Update "Last verified"** at the top of this file.

## Decommissioned channels

`@tecture/skill` is the only supported channel. These were retired in favor of it:

- **`gh skill` / manual clone** — served by the mirror repo [tecture-io/architecture-docs](https://github.com/tecture-io/architecture-docs), now **archived** (read-only, with a deprecation note pointing to `@tecture/skill`). The `sync-skill.yml` workflow that fed it has been removed.
- **[skills.sh](https://skills.sh) (`npx skills add`)** — installs to `~/.agents/skills/` without the `~/.claude/skills/` symlink, so the skill is invisible to Claude Code, our primary target ([vercel-labs/skills#744](https://github.com/vercel-labs/skills/issues/744)).
- **[tech-leads-club/agent-skills](https://github.com/tech-leads-club/agent-skills)** — curated registry; PR [#102](https://github.com/tech-leads-club/agent-skills/pull/102) closed.
- **[github/awesome-copilot](https://github.com/github/awesome-copilot)** — not pursued.
- **[anthropics/skills](https://github.com/anthropics/skills)** — closed to outside contributions; Anthropic first-party only.
- **[SkillsMP.com](https://skillsmp.com)** — aggregator; no verified install metrics, low ROI.
- **Claude plugin marketplace** — plugins bundle skills + MCP + hooks. Revisit only if the skill grows an MCP component.
