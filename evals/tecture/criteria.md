# Tecture architecture evals

A deterministic rubric for scoring any architecture produced by the Tecture skill under `./architecture/`. This document is **external** to the skill: the skill must not be modified to accommodate it, and the skill should have no knowledge of these criteria. The rubric measures output quality; improvements land in the skill.

Every criterion returns a score in `[0, 1]`. The aggregate is the weighted sum (weights in the table at the end). Release bar: **aggregate ≥ 0.90 AND every `[AUTO]` criterion = 1.0 AND no individual criterion < 0.6**.

Tags:

- `[AUTO]` — purely algorithmic; a script emits the score by reading files in the architecture under test and in the target repo.
- `[LLM]` — an LLM judge (Claude Sonnet 4.6 for F3/H1; Claude Opus 4.7 for J), `temperature=0`, the prompt shown inline. Deterministic per (inputs, prompt, model).
- `[VISION]` — computed from a screenshot of the rendered diagram captured via the `chrome-devtools` MCP against a running Tecture viewer.

Throughout: "Target repo" = the repo whose architecture is under test; "architecture" = the `./architecture/` directory inside it.

**Level derivation** (used by Section C and by any criterion that refers to "L1", "L2", "L3"). The diagram schema's `level` field is optional, so we do not rely on it. Instead, levels are computed from the drill-down graph:

- `level(manifest.topDiagram) = 1` (by skill convention — the top diagram is the System Context).
- For any other diagram `D`, `level(D) = 1 + min{ level(D') : there exists a node in D' whose subDiagramId = D }`.
- Diagrams not reachable from `topDiagram` via `subDiagramId` edges are treated as orphan and excluded from Section C (they produce a warning in the report).

`N_L1`, `N_L2`, `N_L3` are node counts of the diagram(s) at the respective derived level. When multiple diagrams share a level, the section-C criteria are applied per diagram and averaged.

**Coverage-set convention** (used by Section B). When an evidence set `E` is empty (`|E| = 0`), the criterion's score is **1.0 vacuously** — there is nothing to cover, so there is nothing to miss.

---

## A. Structural validity (weight 0.10)

### A1. Validator clean run — `[AUTO]`
Run `node .claude/skills/tecture/scripts/validate.mjs` against `./architecture/`. (The validator is a published, black-box behavior of the skill's output format; we invoke it as a tool.)
- **Score:** `1.0` if exit code `0` and zero warnings; `0.5` if exit code `0` with ≥1 warning; `0.0` otherwise.

### A2. Description-file integrity — `[AUTO]`
Let `D` = count of `.md` files under `descriptions/`; `U` = count of unique node ids across all diagrams.
- **Score:** `1.0` iff `D == U`; else `1 - abs(D - U) / U`, floored at `0`.

---

## B. Coverage of the target repository (weight 0.20)

The harness scans the target repo once to build evidence sets. Each criterion is a *recall* ratio.

### B1. Deployable coverage — `[AUTO]`
`E_deploy` = union of: every directory containing a `Dockerfile`; every service in `docker-compose.yml`; every `cmd/<name>` in Go; every workspace package with a `bin` or `start` npm script; every `serverless.yml` function; every k8s `Deployment`/`StatefulSet`/`CronJob`.

Target node set = L2 nodes whose `meta.type` is in `{service, frontend, gateway, queue, database, cache, storage}` — i.e. anything that could legitimately represent a runnable process or a container an operator stands up. Infrastructure-type containers (e.g. a `postgres` service in `docker-compose.yml` modeled at L2 as a `database` node) count as covered.
- **Score:** `|E_deploy ∩ target_nodes| / |E_deploy|`. Match is slug-normalized substring equality between evidence name and node id/label.

### B2. Managed-datastore coverage — `[AUTO]`
`E_db` = distinct datastores from env vars matching `(DB|DATABASE|POSTGRES|MYSQL|MONGO|REDIS|KAFKA|RABBIT|SQS|S3|GCS|ELASTIC|MEILI)_(URL|DSN|HOST|BUCKET|QUEUE|BROKER)` in `.env*`/`docker-compose.yml`/k8s manifests, plus `aws_db_instance` / equivalents in terraform.
- **Score:** `|E_db ∩ nodes_with_type_in_{database,cache,queue,storage}| / |E_db|`.

### B3. External-SDK coverage — `[AUTO]`
`E_ext` = distinct providers (not raw package names) inferred from dependencies in any package manifest that match entries in [catalogs/sdk-providers.json](catalogs/sdk-providers.json).

Target node set = nodes whose `meta.type` is in `{external, database, cache, queue, storage}`. A managed SaaS may legitimately be modeled under any of those types — e.g. `@aws-sdk/client-s3` → a `storage` node, a managed Postgres → a `database` node, Stripe → an `external` node.
- **Score:** `|E_ext ∩ target_nodes| / |E_ext|`. Match is by provider slug against node id/label/`meta.technology`.

### B4. Description evidence — `[AUTO]`
Every node id has a `descriptions/<id>.md` of **≥ 40 words** whose body contains **≥ 1 evidence marker**: a file path that resolves inside the target repo, a dependency name from a manifest, an env var name, or a CLI-flag token (`--foo`). Each marker is verified by filesystem check or manifest lookup.
- **Score:** fraction of nodes satisfying both conditions.

---

## C. Right-sizing per C4 level (weight 0.10)

### C1. L1 size — `[AUTO]`
- **Score:** `1.0` if `3 ≤ N_L1 ≤ 5`; `0.5` if `N_L1 ∈ {2, 6, 7}`; else `0.0`.

### C2. L2 size — `[AUTO]`
- **Score:** `1.0` if `4 ≤ N_L2 ≤ 8`; `0.5` if `N_L2 ∈ {3, 9, 10}`; else `0.0`.

### C3. L3 size (when present) — `[AUTO]`
Per L3 diagram: `1.0` if `3 ≤ nodes ≤ 6`; `0.5` if `nodes ∈ {2, 7, 8}`; else `0.0`. Criterion score = mean across L3s (or `1.0` if none).

### C4. Edge connectivity — `[AUTO]`
Every non-`person` node must be incident to ≥ 1 edge in its own diagram.
- **Score:** `1 - isolated_non_person_nodes / total_non_person_nodes`.

---

## D. Edge-label quality (weight 0.10)

### D1. Banned generic verbs — `[AUTO]`
Case-insensitive regex over `edge.label`:
`^(uses|use|depends on|depends|interacts with|talks to|communicates with|integrates with|works with|connects to|accesses)\.?$`
- **Score:** `max(0, 1 - matches / total_edges)`.

### D2. Every edge has a label — `[AUTO]`
`edge.label` is optional in the schema. Unlabeled edges convey no information about the relationship; the direction alone is ambiguous.
- **Score:** fraction of edges whose `label.trim()` is non-empty and has length ≥ 3 characters.

---

## E. Technology authenticity (weight 0.05)

`meta.technology` is a free-form label shown as a subtitle under the node; it does not drive rendering (the node's icon and colour come from `meta.type`, which is enum-constrained by the schema). The only meaningful quality check is that a declared technology corresponds to something real in the target repo — a guard against hallucinated tech.

### E1. Every `meta.technology` has evidence — `[AUTO]`
For each unique `meta.technology` slug, confirm a match (as a dependency name, substring match, or explicit tag) in at least one of: a package manifest, a `Dockerfile` `FROM` line, or a `docker-compose.yml` `image:` line.
- **Score:** fraction of unique slugs with ≥ 1 match.

---

## F. Description quality (weight 0.15)

Applied per `descriptions/*.md`; criterion score = mean across files.

### F1. Length — `[AUTO]`
- **Score:** `1.0` if `40 ≤ words ≤ 300`; linear decay to `0` outside `[20, 500]`.

### F2. Required sections — `[AUTO]`
Must contain both `## Responsibilities` and `## Tech Stack` headings.
- **Score:** `1.0` iff both; `0.5` if one; `0.0` if neither.

### F3. Not a label rephrase — `[LLM]` (Claude Sonnet 4.6, temp 0)
Judge prompt (verbatim):

> You are given a node label and the first 60 words of its description. Reply with exactly one token: `PASS` if the description explains *what this specific node is responsible for* with concrete evidence (file paths, technologies, verbs of behavior), or `FAIL` if it is a generic rephrase of the label ("X handles X-related things", "The X component manages X"). No other output.

- **Score:** fraction `PASS`.

### F4. Concrete references — `[AUTO]`
Body must contain ≥ 1 of: a Markdown link whose target resolves to a real file in the target repo, a fenced code block, an `@scoped/package` mention, or a CLI-flag token. Verified by filesystem + manifest lookup.
- **Score:** fraction satisfying.

---

## G. Anti-patterns (weight 0.05)

### G1. Banned node labels — `[AUTO]`
Regex over `node.label` (case-insensitive, whole-label match):
`^(business logic|service layer|helpers?|utils?|common|core|shared|misc|backend|frontend)$`
- **Score:** `1.0` iff zero matches; else `0`.

### G2. L1 does not leak internal service names — `[AUTO]`
Let `internal = L2_labels \ L1_labels`. If any L1 label (other than the designated system node) appears in `internal`, the L1 is leaking.
- **Score:** `1.0` iff no leak; else `0`.

### G3. Drill-down adds information — `[AUTO]`
For each node `N` whose `subDiagramId` resolves to a diagram `D`:
- `D` must contain at least **3 nodes** (a drill-down to a 1–2 node diagram adds nothing over a single node at the parent level).
- No node in `D` may have a label that is exactly equal to `N.label` (case-insensitive, whitespace-normalized) — a child labeled the same as the parent is a rename, not a decomposition.
- **Score:** fraction of drill-downs satisfying both.

---

## H. Agent-consumer usability (weight 0.10)

How well a downstream coding agent can reuse the architecture as context.

### H1. Self-contained descriptions — `[LLM]` (Claude Sonnet 4.6, temp 0)
Judge prompt:

> You will read ONE node description in isolation (no other files, no diagram context). Reply `PASS` if you can state, in one sentence, what this node does and what technology it is built with. Reply `FAIL` if the description assumes context you don't have ("this module", "the above component", "as mentioned earlier") or omits either the what or the tech.

- **Score:** fraction `PASS`.

### H2. Machine-extractable responsibilities — `[AUTO]`
Under `## Responsibilities`, ≥ 2 Markdown bullets, each ≥ 4 words, each starting with a verb.
- **Score:** fraction of descriptions satisfying.

### H3. Stable node ids — `[AUTO]`
Every node id is kebab-case and appears in at most one diagram. (Both already enforced by the skill's validator; this is re-checked here as a named line-item so the eval report surfaces the guarantee even if the skill regresses.)
- **Score:** `1.0` iff conditions hold; else `0`.

---

## I. Visual quality of the rendered canvas (weight 0.10)

Harness procedure:

1. In a sandbox copy of the target repo, build & start the Tecture viewer (`pnpm build && pnpm start`, or `npx @tecture/core`) on port `3000`.
2. For each diagram slug, navigate to `http://localhost:3000/#/diagram/<slug>` via `mcp__chrome-devtools__navigate_page`; wait for `.react-flow__node` via `mcp__chrome-devtools__wait_for`; capture `mcp__chrome-devtools__take_screenshot` at viewport `1440×900`.
3. Capture a DOM snapshot via `mcp__chrome-devtools__take_snapshot` for geometry and text extraction.

### I1. All nodes on-screen at fit-view — `[VISION]`
From the DOM snapshot, every `.react-flow__node` bbox must intersect the `.react-flow__viewport` bbox with ≥ 95 % of its own area.
- **Score:** fraction of nodes on-screen.

### I2. Label OCR fidelity — `[VISION]`
OCR (Tesseract) on the screenshot; Levenshtein-match detected strings against `node.label`s.
- **Score:** fraction of labels with a match at edit distance ≤ 2.

### I3. No overlapping nodes — `[VISION]`
All pairs of node bboxes: intersection area must be `0` for pairs not in a parent/child (`parentId`) relationship.
- **Score:** `1 - overlapping_pairs / total_pairs`.

### I4. Edge-crossing budget — `[VISION]`
Count crossings from edge SVG paths in the DOM snapshot.
- **Score:** `1.0` if `crossings ≤ max(0, edges - nodes)`; linear decay to `0` at `2 × (edges - nodes)`.

### I5. Contrast — `[VISION]`
For every rendered node label, sample 5 label pixels and 5 node-fill pixels; compute WCAG contrast.
- **Score:** `1.0` iff every sampled pair ≥ 4.5:1.

---

## J. 60-second comprehension (weight 0.15)

Headline human-usability eval. Judge (Claude Opus 4.7, `temperature=0`) receives **only**:

- `manifest.name`
- `manifest.description`
- The L1 diagram JSON
- `descriptions/<id>.md` for every node in the L1 diagram

No other files. Prompt (verbatim):

> You are a senior engineer joining this project. Answer each question in ≤ 15 words. If the provided material does not answer a question, write `INSUFFICIENT`.
> 1. What does this system do, in one sentence?
> 2. Who uses it, and how?
> 3. What external systems, datastores, or services does it depend on?

A second pass gives the judge a reference-answer file (human-authored per target repo, stored at `fixtures/<repo-slug>/reference.json`) and asks the judge to grade each response `{EXACT | EQUIVALENT | PARTIAL | WRONG | INSUFFICIENT}`.

- **Mapping:** `EXACT | EQUIVALENT = 1.0`; `PARTIAL = 0.5`; else `0.0`.
- **Criterion score:** mean across the three questions.

If no reference fixture exists for the target repo, the criterion is **skipped** (weight redistributed uniformly across remaining sections). Required for release gating; optional for exploratory runs.

---

## Weights & aggregate

| Section | Weight |
|---|---|
| A. Structural validity | 0.10 |
| B. Coverage of target repo | 0.20 |
| C. Right-sizing per level | 0.10 |
| D. Edge-label quality | 0.10 |
| E. Technology authenticity | 0.05 |
| F. Description quality | 0.15 |
| G. Anti-patterns | 0.05 |
| H. Agent-consumer usability | 0.10 |
| I. Visual quality | 0.10 |
| J. 60-second comprehension | 0.15 |
| **Aggregate** | **1.00** |

Within a section, per-criterion scores are averaged uniformly unless stated otherwise.

**Release bar:** aggregate `≥ 0.90` AND every `[AUTO]` criterion = `1.0` AND no criterion `< 0.6`.

## Report format (what a future runner emits)

`runs/<timestamp>.json`:

```json
{
  "timestamp": "2026-04-20T18:40:11Z",
  "target_repo": "tecture-for-agents/tecture-io",
  "architecture_commit": "f53df6a…",
  "aggregate": 0.93,
  "sections": {
    "A": { "score": 1.0, "criteria": { "A1": 1.0, "A2": 1.0 } },
    "B": { "score": 0.95, "criteria": { "B1": 1.0, "B2": 1.0, "B3": 1.0, "B4": 0.80 } }
  },
  "failures": [
    { "id": "B4", "message": "2/18 descriptions have no evidence marker", "nodes": ["app-shell", "diagram-list"] }
  ],
  "passes_release_bar": true
}
```

A human-readable `runs/<timestamp>.md` is emitted alongside for PR comments.

## Self-improvement loop (informative)

The intended loop:

1. Author / re-author the architecture using the skill.
2. Run the eval harness → score + failure list.
3. Inspect failures, identify skill-level root causes (prompt weakness, missing discovery heuristic, etc.).
4. **Modify the skill** (SKILL.md, discovery reference, or validator) — not this rubric — to address the root cause.
5. Re-run on a suite of target repos; confirm no regressions.

The rubric changes only when the definition of "good architecture" itself changes — which is rare, and is done via a separate PR that does not also change the skill.
