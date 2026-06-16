# Skill Distribution

Tracks where the `architecture-docs` agent skill (sourced from `.claude/skills/architecture-docs/` in this repo, mirrored to [tecture-io/architecture-docs](https://github.com/tecture-io/architecture-docs)) is published and how end users install it.

Last verified: **2026-06-17**.

## Channels

| Channel | Status | Install command | URL |
| --- | --- | --- | --- |
| **[`@tecture/skill`](https://www.npmjs.com/package/@tecture/skill)** (first-party installer) | ✅ live | `npx @tecture/skill@latest` | built from [`packages/installer`](../packages/installer); skill bundled & version-locked |
| [`gh skill`](https://cli.github.com/manual/gh_skill) (GitHub CLI ≥ 2.90.0) | ✅ live | `gh skill install tecture-io/architecture-docs` | auto-indexed from the mirror repo |
| Manual clone (any agent) | ✅ live | `git clone https://github.com/tecture-io/architecture-docs.git <skill-dir>` | see mirror README |
| [skills.sh](https://skills.sh) (Vercel) | ⚠️ broken for Claude Code | `npx skills add tecture-io/architecture-docs` | installs to `~/.agents/skills/` without the `~/.claude/skills/` symlink, so Claude Code can't see it ([vercel-labs/skills#744](https://github.com/vercel-labs/skills/issues/744)) |
| [tech-leads-club/agent-skills](https://github.com/tech-leads-club/agent-skills) (curated, Snyk-scanned) | ⏳ PR open | `npx @tech-leads-club/agent-skills` (after merge) | [PR #102](https://github.com/tech-leads-club/agent-skills/pull/102) |
| [github/awesome-copilot](https://github.com/github/awesome-copilot) | ◻️ not yet submitted | `gh skill install github/awesome-copilot architecture-docs` (after merge) | — |

Legend: ✅ live / ⚠️ degraded / ⏳ pending external action / ◻️ not started.

**`@tecture/skill` is the recommended channel.** It copies the skill into each agent's *native* skills directory (Claude Code, Cursor, GitHub Copilot, Codex, Windsurf), so it sidesteps the symlink bug that makes `skills.sh` invisible to Claude Code. The skill is bundled into the package and stamped with the package version, so installs are reproducible and offline. Re-running `npx @tecture/skill@latest` updates in place; `--check` reports status; `remove` uninstalls. Agent directories are maintained in [`packages/installer/src/agents.ts`](../packages/installer/src/agents.ts) (verified against each vendor's docs — note they differ from asm's, which routes Cursor/Windsurf through their legacy "rules" trees).

## Release procedure

When the skill at `.claude/skills/architecture-docs/` ships a meaningful change:

1. **Bump the canonical source** (this repo). Commit to `main`.
2. **Release `@tecture/skill`** — bump `packages/installer/package.json`, then push a `skill-v<version>` tag. GitHub Actions ([`publish-skill.yml`](../.github/workflows/publish-skill.yml)) bundles the current skill, validates it, checks the tag matches the version, and publishes to npm. The bundled skill is taken from `.claude/skills/architecture-docs/` at build time, so this is how skill changes reach the first-party channel.
3. **Sync the mirror** — copy the updated skill tree into `tecture-io/architecture-docs`, commit, push. `gh skill` (and skills.sh, where it works) auto-pick up the latest commit; no further action needed for those channels.
4. **Bump the registry PR** — if #102 has merged, cut a follow-up PR to `tech-leads-club/agent-skills` updating the skill under `packages/skills-catalog/skills/(architecture)/tecture/` (run `npm run validate && npm run lint && npm run format` against the fork before pushing).
5. **Tag a release** on the mirror (`vMAJOR.MINOR.PATCH`) if the change is breaking or notable. Tag-protection ruleset blocks deletion/force-push; immutable releases prevent retroactive edits.
6. **Update "Last verified"** at the top of this file.

## Hardening on the mirror repo

[tecture-io/architecture-docs](https://github.com/tecture-io/architecture-docs) has the following supply-chain settings enabled:

- Secret scanning + push protection
- Immutable releases
- Tag-protection ruleset on `v*` (blocks deletion, non-fast-forward, updates)
- CodeQL JavaScript scanning (workflow at `.github/workflows/codeql.yml`)

These satisfy the `gh skill publish` spec recommendations. Do not disable without replacing with equivalent controls.

## Channels deliberately skipped

- **[anthropics/skills](https://github.com/anthropics/skills)** — closed to outside contributions; Anthropic first-party only.
- **[SkillsMP.com](https://skillsmp.com)** — aggregator; no verified install metrics, low ROI.
- **Claude plugin marketplace** — plugins bundle skills + MCP + hooks. Revisit only if the skill grows an MCP component.
