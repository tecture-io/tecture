# `evals/tecture/`

External quality rubric for architectures produced by the Tecture skill at [.claude/skills/tecture/](../../.claude/skills/tecture/).

**Do not reference this directory from the skill.** These evals exist to grade the skill from the outside so we can run a self-improvement loop without the skill learning to game its own graders.

## Contents

| Path | What it is |
|---|---|
| [criteria.md](criteria.md) | The authoritative rubric — 24 criteria across 10 sections, each emitting a deterministic `[0, 1]` score. |
| [catalogs/sdk-providers.json](catalogs/sdk-providers.json) | Standalone map of dependency names to the external provider each one implies. Used by criterion B3. |
| `fixtures/<repo-slug>/reference.json` | Per-target-repo reference answers for criterion J (60-second comprehension). Optional; required only for release gating. |
| `runs/<timestamp>.json` and `.md` | Output of the eval harness. Machine- and human-readable. |

## Intended use

The rubric is designed to power a self-improvement loop:

1. Run the Tecture skill on a target repo to produce `./architecture/`.
2. Run the eval harness (future work — `scripts/evaluate.mjs`) to score the output.
3. Inspect failures; identify skill-level root causes.
4. **Change the skill** — SKILL.md prompts, discovery heuristics, validator rules — never the rubric.
5. Re-run on a suite of target repos; confirm no regressions.

The rubric changes only when the definition of "good architecture" changes — a separate concern, handled in a separate PR that does not also change the skill.

## Grading modes

Every criterion is tagged one of:

- `[AUTO]` — a script reads files; deterministic.
- `[LLM]` — a pinned judge model at `temperature=0` applies a fixed prompt.
- `[VISION]` — computed from a screenshot captured via the `chrome-devtools` MCP against a running Tecture viewer.

## Release bar

- Aggregate score `≥ 0.90`, **and**
- every `[AUTO]` criterion at `1.0`, **and**
- no individual criterion `< 0.6`.

## Contributing new criteria

When adding a criterion:

1. Append it to the relevant section in `criteria.md`.
2. Specify the grading mode tag, the exact score formula, and — for `[LLM]` — the verbatim judge prompt.
3. Update the weights table if the section weight changes; weights must still sum to `1.00`.
4. The criterion must produce the same score on the same input every time it runs.
