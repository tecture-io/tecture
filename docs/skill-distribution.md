# Skill Distribution

Tracks where the `tecture` agent skill (sourced from `.claude/skills/tecture/` in this repo, mirrored to [tecture-io/tecture-skill](https://github.com/tecture-io/tecture-skill)) is published and how end users install it.

Last verified: **2026-04-23**.

## Channels

| Channel | Status | Install command | URL |
| --- | --- | --- | --- |
| [skills.sh](https://skills.sh) (Vercel) | ✅ live | `npx skills add tecture-io/tecture-skill` | auto-indexed from the mirror repo |
| [`gh skill`](https://cli.github.com/manual/gh_skill) (GitHub CLI ≥ 2.90.0) | ✅ live | `gh skill install tecture-io/tecture-skill` | auto-indexed from the mirror repo |
| Manual clone (any agent) | ✅ live | `git clone https://github.com/tecture-io/tecture-skill.git <skill-dir>` | see mirror README |
| [tech-leads-club/agent-skills](https://github.com/tech-leads-club/agent-skills) (curated, Snyk-scanned) | ⏳ PR open | `npx @tech-leads-club/agent-skills` (after merge) | [PR #102](https://github.com/tech-leads-club/agent-skills/pull/102) |
| [github/awesome-copilot](https://github.com/github/awesome-copilot) | ◻️ not yet submitted | `gh skill install github/awesome-copilot tecture` (after merge) | — |

Legend: ✅ live / ⏳ pending external action / ◻️ not started.

## Release procedure

When the skill at `.claude/skills/tecture/` ships a meaningful change:

1. **Bump the canonical source** (this repo). Commit to `main`.
2. **Sync the mirror** — copy the updated skill tree into `tecture-io/tecture-skill`, commit, push. skills.sh and `gh skill` auto-pick up the latest commit; no further action needed for those two channels.
3. **Bump the registry PR** — if #102 has merged, cut a follow-up PR to `tech-leads-club/agent-skills` updating the skill under `packages/skills-catalog/skills/(architecture)/tecture/` (run `npm run validate && npm run lint && npm run format` against the fork before pushing).
4. **Tag a release** on the mirror (`vMAJOR.MINOR.PATCH`) if the change is breaking or notable. Tag-protection ruleset blocks deletion/force-push; immutable releases prevent retroactive edits.
5. **Update "Last verified"** at the top of this file.

## Hardening on the mirror repo

[tecture-io/tecture-skill](https://github.com/tecture-io/tecture-skill) has the following supply-chain settings enabled:

- Secret scanning + push protection
- Immutable releases
- Tag-protection ruleset on `v*` (blocks deletion, non-fast-forward, updates)
- CodeQL JavaScript scanning (workflow at `.github/workflows/codeql.yml`)

These satisfy the `gh skill publish` spec recommendations. Do not disable without replacing with equivalent controls.

## Channels deliberately skipped

- **[anthropics/skills](https://github.com/anthropics/skills)** — closed to outside contributions; Anthropic first-party only.
- **[SkillsMP.com](https://skillsmp.com)** — aggregator; no verified install metrics, low ROI.
- **Claude plugin marketplace** — plugins bundle skills + MCP + hooks. Revisit only if the skill grows an MCP component.
