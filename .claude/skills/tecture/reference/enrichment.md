# Phase D — Enrich descriptions (per-component investigation)

Phase C descriptions are necessarily shallow. The authoring agent is holding the whole architecture in its head and can only spare a sentence or two per node, so on a large or complex repo the descriptions read generic — they name the component but don't capture what it actually does, what it depends on, or where its real seams are. Phase D fixes that by giving every first-party code node its own investigator: a sub-agent that reads *only* that component's code (plus whatever else it needs to understand the dependencies) and rewrites the description grounded in real evidence.

Phase D runs automatically once Phase C validation passes. On a small architecture it's a handful of quick sub-agents; on a giant one it's the difference between a useful map and a generic one.

## The shape: fan-out → reconcile → finalize

Two rounds, with the **main agent as the single writer and hub**. No sub-agent edits files — they return drafts and findings; the main agent reconciles and writes. That keeps the whole phase loop-free and race-free no matter how many agents are in flight: investigators never message each other or the orchestrator mid-run (Claude Code sub-agents are one-shot), so the only "communication" is the context you pass down and the findings they return up.

1. **Round 1 — Investigate**: one sub-agent per internal node, in parallel batches.
2. **Reconcile** (main agent): merge findings into a dependency map + shared-facts digest; detect cross-links and inconsistencies; collect suspected structural gaps.
3. **Round 2 — Refine**: only the nodes whose description changes given sibling findings.
4. **Finalize**: write every `descriptions/<id>.md`, re-validate, report gaps.

## 1. Select which nodes to investigate

Investigate the nodes that map to first-party code you own — the ones a reader would open the repo to understand:

- **Include**: nodes whose `meta.type` is `service`, `frontend`, or `gateway`, any L3 component of one, and any node carrying a `path` into the repo.
- **Skip**: `person` actors, `external` SaaS, and managed infra (`database`, `cache`, `queue`, `storage`) — *unless* the node has a `path` (i.e. it's self-hosted/owned code). There is nothing to investigate inside "Stripe" or "the customer".

If selection leaves zero nodes (e.g. a one-box CLI), there's nothing to enrich — keep the Phase C descriptions and stop.

## 2. Assemble the shared context pack

Every investigator needs to see the whole in order to place its part. Build this once and pass it to each sub-agent:

- `manifest.json` (name, description, source).
- A **flat node index**: for every node across all diagrams — `id`, `label`, `meta.type`, `meta.technology`, `path`, and which diagram/level it sits on.
- The **edge list**: `source → target` with labels, so an investigator knows the *declared* relationships before it goes looking for the real ones.
- The **repo root** (`git rev-parse --show-toplevel`) so `path` values resolve.

## 3. Round 1 — Investigate (parallel)

Spawn one sub-agent per selected node (the Task/Agent tool — independent context, its own file-read tools). Run them in **batches** (≈6 concurrent is a sane default) so a giant project doesn't overwhelm the host. Process *every* selected node — if you ever need to bound the count, tell the user which nodes you skipped; never cap silently.

Give each investigator its target node (id, label, type, path), the shared context pack, and its current Phase C description as a starting point. A brief like this (adapt the wording):

> You are documenting one component of a larger architecture. Target: **`<label>`** (`<id>`), which maps to `<path>`. Read its code thoroughly, and read other parts of the repo as needed to learn what it depends on and what depends on it — do not guess; find the import, route, query, or call that proves it. Return (1) an enriched description in the template below, grounded in specific files, functions, routes, tables, and libraries you actually read, and (2) the structured findings below so the orchestrator can cross-link components. Stay within this component's responsibility — describe what it owns, not the whole system. Do not edit any files; return your text.

### Enriched description template

```markdown
<2–3 sentences: what this component is and the single responsibility it owns — concrete, not "handles X-related logic".>

## Responsibilities
- <verb-led and specific: "Verifies Stripe webhook signatures and reconciles payment state", not "manages payments">

## Key files
- `path/to/entry.ts` — <what lives here>
- `path/to/...` — <...>

## Dependencies
- **Inbound** — <who calls or uses this; name the sibling node where known>
- **Outbound** — <what this calls: datastores, sibling services, external SaaS — name the protocol/table/topic>

## Tech Stack
- <frameworks and libraries actually imported here>
```

Hold the anti-bloat bar from the main skill: no "Service Layer" filler, no padding to fill a heading. A `## Key files` list with one entry is fine; an empty `## Dependencies` should say "none", not invent one. Include a mermaid block only when a sequence, state machine, or fan-out is genuinely clearer as a picture — same rule as the base skill.

### Findings contract (returned alongside the markdown)

So the orchestrator can reconcile, each investigator also returns:

- `outbound`: list of `{ to: <node-id or external label>, nature: "REST" | "reads table X" | "publishes topic Y" | "imports shared lib Z" | … }`.
- `inbound`: who this component appears to be called by, as far as the code shows (node id/label + how).
- `shared_facts`: cross-cutting facts other investigators would benefit from (e.g. "all services use the `@acme/db` client and the `requireAuth` middleware in `packages/auth`").
- `structural_gaps`: suspected missing nodes or edges — **report only** (e.g. "found a `notifications` worker under `apps/notify/` with no matching node").

### Return format

A sub-agent's reply *is* its return value (it can't write files), so pin the envelope so you can split the two outputs reliably: the enriched description as one fenced ```` ```markdown ```` block, then the findings as one fenced ```` ```json ```` block matching the contract above. Ask for nothing else — no preamble, no commentary — so parsing is trivial.

## 4. Reconcile (main agent, between rounds)

You now hold every investigator's draft + findings. Before finalizing:

- **Build a dependency map** by merging all `outbound`/`inbound`. Where A says it calls B but B's draft never mentions being called by A, that cross-link gets added to B in Round 2.
- **Build a shared-facts digest** from all `shared_facts` (dedupe; keep what recurs or matters).
- **Resolve inconsistencies** — if A and B describe the same edge differently, pick the version the code supports.
- **Collect `structural_gaps`** for the final report.

This reconciliation *is* the shared-information channel the design calls for: investigators never talk to each other directly; you are the hub that gathers what each found and hands the relevant pieces back down.

## 5. Round 2 — Refine (selective)

Re-spawn (or inline-edit) **only** the nodes whose description should change given reconciliation — typically those gaining an inbound cross-link, or where a shared fact replaces a vaguer line. Give the round-2 agent its Round 1 draft + the specific reconciled facts that apply to it + the shared-facts digest, and ask for the final description. Nodes with nothing to add keep their Round 1 draft — don't spend an agent to confirm "no change".

Stop at two rounds. If two passes didn't converge on some inconsistency, hand it to the user rather than spawning a third round.

## 6. Finalize

- Write every final description to `descriptions/<id>.md` — you are the sole writer.
- **Re-run the validator** (`node .claude/skills/tecture/scripts/validate.mjs`). Descriptions are keyed by node id, so a mistyped id orphans a file.
- **Report to the user**, briefly: how many nodes were enriched; any `structural_gaps` you did *not* apply (enrichment is prose-only by default — let the user decide whether to add the node/edge); and any node where investigation failed and the Phase C description was kept.

## Cost & safety

- **Scale**: a giant repo can have dozens of internal nodes. Round 1 is one agent per node; Round 2 is only the subset that changed. Batch the parallelism, and for a very large fan-out tell the user the scale as you start so they can scope it down if they want.
- **No loops, no races**: single writer, bounded rounds, no agent-to-agent messaging. That is deliberate — don't add a third "re-reconcile" round or let sub-agents write files.
- **Prose-only**: never add or remove nodes/edges during enrichment. Structural change is a separate, user-approved step.
