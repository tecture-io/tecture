# Deep-dive — enrich a component's description from its code

A deep-dive takes one component (or several, or all) and rewrites its `descriptions/<id>.md` grounded in the component's real code. The authoring pass (Phases A–C) necessarily writes shallow descriptions — one agent holding the whole map can only spare a sentence or two per node — so on a large or complex repo they read generic. A deep-dive gives a chosen component its own investigator: a sub-agent that reads *that* component's code, traces its actual dependencies through the repo, and returns an evidence-grounded description.

Deep-dive is **on-demand and never automatic.** After authoring, offer it and wait. The user drives what gets deepened, and when — that control is the point.

## Invocation

The user names one or more components, or asks for all:

- `/architecture-docs deep-dive <component>` — or plain English ("deep-dive the auth service", "enrich the realtime component's description", "give every component a deeper writeup").
- *enrich* / *deep-dive* / *investigate* all mean the same thing here.

### Resolving the component name

Match the named component against the node index (case-insensitive, fuzzy on `label` and `id`):

- **Unambiguous match** → that node.
- **Several plausible matches** → ask the user which one; list the candidates by label + diagram.
- **Matches a `person`, `external`, or managed-infra node** → there is nothing in the repo to investigate. Say so, and suggest the nearest code node if there is one.
- **No match** → list the available code nodes so the user can pick.

## What counts as a deep-divable node

Only first-party code you own is worth investigating:

- **Include**: `service`, `frontend`, `gateway`, any L3 component of one, and any node carrying a `path` into the repo.
- **Skip**: `person` actors, `external` SaaS, and managed infra (`database`/`cache`/`queue`/`storage`) — unless the node has a `path`.

## The shared context pack

Even a single-component deep-dive needs to see the whole, so it can describe the component's place and name its inbound/outbound dependencies by sibling. Assemble this once and pass it to every investigator:

- `manifest.json` (name, description, source).
- A **flat node index**: every node across all diagrams — `id`, `label`, `meta.type`, `meta.technology`, `path`, diagram/level. (This is also what you match the component name against above.)
- The **edge list**: `source → target` with labels — the *declared* relationships, so the investigator can confirm or extend them.
- The **repo root** (`git rev-parse --show-toplevel`) so `path` values resolve.

## Mode 1 — one or a few components (the common path)

For each named component, spawn one investigator sub-agent (the Task/Agent tool — independent context, its own file-read tools). If the user named several, run them in parallel. Each gets its target node (id, label, type, path), the shared context pack, and its current description, and returns the rewritten description. **One pass, no reconcile** — the user asked for specific components, so don't fan out across the whole graph.

### Investigator brief (adapt the wording)

> You are documenting one component of a larger architecture. Target: **`<label>`** (`<id>`), which maps to `<path>`. Read its code thoroughly, and read other parts of the repo as needed to learn what it depends on and what depends on it — do not guess; find the import, route, query, or call that proves it. Return the enriched description in the template below, grounded in specific files, functions, routes, tables, and libraries you actually read. Stay within this component's responsibility — describe what it owns, not the whole system. If you find this component is internally complex enough to deserve its own drill-down diagram — 3+ separable parts (modules, routers, layers, workers) with their own interactions, not just a long list of files — add a one-line note after the description naming those sub-parts, so it can be offered as a drill-down. Don't design the diagram; just flag it. Also flag any place the **existing diagram JSON disagrees with the code you actually read** — a wrong `meta.type`, `technology`, `path`, or label; an edge the code doesn't make; a real dependency that has no edge; or a node with no code backing — and quote the evidence. Do not edit any files yourself; just report what you found and return your text.

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

Hold the anti-bloat bar from the main skill: no "Service Layer" filler, no padding to fill a heading. A `## Key files` list with one entry is fine; an empty `## Dependencies` should say "none", not invent one. Include a mermaid block only when a sequence, state machine, or fan-out is genuinely clearer as a picture.

Then **write** each returned description to `descriptions/<id>.md` (the main agent is the sole writer) and **re-run the validator**. Mode 1 skips Mode 2's reconcile pass, but still finishes through **Finalize & report** below if the investigator flagged any JSON discrepancies or a drill-down candidate — those get confirmed with the user there.

## Mode 2 — all components (fan-out → reconcile → finalize)

When the user asks to deep-dive *everything*, investigate every deep-divable node and then reconcile so the descriptions cross-link consistently. Two rounds, with the main agent as the **sole writer and hub** — no sub-agent edits files and none talk to each other, so the whole run stays loop-free and race-free; the only "communication" is the context you pass down and the findings they return up.

1. **Round 1 — Investigate** — one sub-agent per node, in parallel **batches** (≈6 concurrent is a sane default). Process *every* node — if you must bound the count, tell the user which you skipped; never cap silently. Each returns the enriched description **plus** the findings contract below.
2. **Reconcile** (main agent) — merge all findings into a dependency map + shared-facts digest; detect cross-links (A says it calls B, but B's draft never mentions A); collect the `json_discrepancies` and `drilldown_candidate`s to confirm with the user at Finalize.
3. **Round 2 — Refine** — only the nodes whose description changes given reconciliation get a second pass (their Round 1 draft + the specific reconciled facts that apply). Nodes with nothing to add keep their Round 1 draft. Stop at two rounds.
4. **Finalize** — as below.

### Findings contract (Mode 2 — returned alongside the markdown)

So the orchestrator can reconcile, each investigator also returns:

- `outbound`: list of `{ to: <node-id or external label>, nature: "REST" | "reads table X" | "publishes topic Y" | "imports shared lib Z" | … }`.
- `inbound`: who this component appears to be called by (node id/label + how).
- `shared_facts`: cross-cutting facts other investigators would benefit from (e.g. "all services use the `@acme/db` client and the `requireAuth` middleware in `packages/auth`").
- `json_discrepancies`: places the existing diagram JSON or manifest disagrees with the code — a missing or spurious node/edge, or a wrong `meta.type`/`technology`/`path`/label — each with the evidence and a suggested fix. (The main agent confirms each with the user before changing anything.)
- `drilldown_candidate`: if this component is internally complex enough to deserve its own diagram (3+ separable parts with their own interactions), a one-line note of what the sub-nodes would be.

### Return format

A sub-agent's reply *is* its return value (it can't write files), so pin the envelope so you can split the outputs reliably: the enriched description as one fenced ```` ```markdown ```` block, then — in Mode 2 — the findings as one fenced ```` ```json ```` block matching the contract above. No preamble, no commentary, so parsing is trivial.

## Finalize & report

- Write every final description to `descriptions/<id>.md` — you are the sole writer.
- **Re-run the validator** (`node .claude/skills/architecture-docs/scripts/validate.mjs`). Descriptions are keyed by node id, so a mistyped id orphans a file.
- **Confirm and apply JSON corrections.** If the investigation surfaced `json_discrepancies` — places the diagram JSON or `manifest.json` is inaccurate against the real code — do **not** change them silently. Show the user each one (what the JSON says vs. what the code shows, with the evidence) and **ask whether to correct it**; group related ones so it's a few clear questions, not a flood. Apply only what the user confirms — edit the relevant `diagrams/<slug>.json` (or `manifest.json`), rewriting the whole file, then **re-run the validator**. Leave anything they decline exactly as it was, and just report it.
- **Report briefly**: which components were deepened; which JSON corrections were applied vs. left as-is; and any node where investigation failed and the prior description was kept.
- **Suggest drill-downs.** If a deep-dive flagged a component as internally complex (a `drilldown_candidate`, or the Mode 1 note), suggest giving it its own diagram — a `subDiagramId` drill-down to a new level whose nodes are the sub-parts the investigation surfaced. This is a structural change, so don't create it unprompted: name the candidate component, sketch what the sub-diagram would contain (the sub-nodes and the edges between them), and offer to author it. If the user accepts, author it the normal way — write the new `diagrams/<slug>.json` and a `descriptions/<id>.md` per new node, set `subDiagramId` on the parent node, add the slug to `manifest.diagrams`, then re-validate. Only suggest it when the inner structure genuinely earns its own page; see [Grouping vs. drill-down](../SKILL.md#nesting-within-a-diagram) for the bar (and `parentId` grouping as the lighter alternative when 2–4 parts share one boundary).

## Cost & safety

- A single deep-dive is one sub-agent; "all" on a giant repo is one per internal node (Round 1) plus the subset that changed (Round 2). Batch the parallelism, and before a very large "all" run, tell the user the scale so they can scope it down.
- Single writer, bounded rounds, no agent-to-agent messaging — keep it that way. Don't add a third reconcile round, and don't let sub-agents write files.
- **Confirm before changing structure.** Descriptions a deep-dive rewrites freely — that's the point. But it may also *correct* the diagram JSON or `manifest.json` when they're inaccurate against the code, and *add* a drill-down diagram — and those structural changes happen **only after the user confirms the specific change**. Never edit a diagram or the manifest silently: present the discrepancy with its evidence, ask, then apply and re-validate.
