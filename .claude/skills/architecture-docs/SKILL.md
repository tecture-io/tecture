---
name: architecture-docs
description: Author or update a file-based C4 architecture saved under ./architecture (manifest.json + one JSON file per C4 level + one Markdown description per node). Use whenever the user wants to document, diagram, draw, map out, visualize, or generate a picture of how a codebase is built — its services, who uses it, and what it depends on — written to files in the repo. Triggers include "diagram my codebase," "document/visualize the architecture," "generate C4 / system-context / container diagrams," "create the architecture JSON/Markdown," and adding, updating, splitting, or wiring nodes and edges in an existing architecture. First discovers the repo's real frameworks, deployables, datastores, and external dependencies (any stack — monolith, monorepo, microservices, CLI, data pipeline), then maps them onto C4 diagrams and runs the bundled validator. Also use it on demand to deep-dive a single component and enrich its description from the code (e.g. "deep-dive the auth service," "enrich the realtime component"). NOT for creating diagrams via the Tecture MCP server, refactoring code, reviewing a plan's design before coding, merely explaining folder layout in chat, opening the viewer, or drawing in other tools (draw.io, Structurizr DSL).
---

Maintain a file-based C4 architecture at `./architecture/` (relative to the project root). The on-disk layout mirrors the Tecture data model but replaces UUIDs with slugs and moves long-form node descriptions into standalone markdown files.

A good architecture is **grounded in the repo** (every node, edge, and technology corresponds to something concrete in the code), **right-sized per level** (L1 hides internals; L3 only appears when there is genuine internal complexity), and **comprehensible in 60 seconds** to a new engineer reading only the L1 diagram. The full quality bar is in the [Quality checklist](#quality-checklist) below — apply it before validation.

## Directory layout

```
<project-root>/
└── architecture/
    ├── manifest.json          # architecture metadata + diagram list
    ├── diagrams/
    │   └── <diagram-slug>.json  # one file per diagram
    ├── descriptions/
    │   └── <node-id>.md       # one file per unique node id
    └── .tecture/              # viewer-managed state (auto-created)
        ├── layouts/<slug>.json  # per-diagram node positions/sizes
        └── drift.json           # evidence report (scripts/evidence.mjs) — COMMIT this one
```

- Slugs are kebab-case (`[a-z0-9]+(-[a-z0-9]+)*`).
- Node ids must be **globally unique across all diagrams** — the description filename is the node id.
- Cross-diagram drill-down uses `subDiagramId = "<other-diagram-slug>"`, not a UUID.
- `architecture/.tecture/` (inside the architecture folder) is written by the Tecture viewer when users drag or resize nodes, and by `scripts/evidence.mjs` (which writes `drift.json`). Authoring agents must not hand-edit it. Deleting it is always safe — ELK auto-layout recomputes positions on the next load, and the evidence script regenerates `drift.json` on its next run. Commit or ignore `layouts/` based on whether your team wants shared canonical layouts; **commit `drift.json`** — it makes drift deltas reviewable in PRs, and the script rewrites it only when findings actually change.

## File formats

### `manifest.json`

```jsonc
{
  "name": "E-Commerce Platform",
  "description": "Plain-text, 2-4 paragraphs separated by \\n\\n. No markdown.",
  "source": "https://github.com/acme/ecommerce",
  "sourceHost": "github",
  "topDiagram": "system-context",
  "diagrams": ["system-context", "containers", "components-api"],
}
```

`source` and `sourceHost` are optional but recommended — they let the viewer link diagram nodes back to their files (see `path` below). Capture them in Phase A from git; omit both if the repo has no remote.

### `diagrams/<slug>.json`

```jsonc
{
  "name": "System Context",
  "level": 1,
  "meta": { "direction": "TB" },
  "nodes": [
    {
      "id": "ecommerce",
      "label": "E-Commerce Platform",
      "subDiagramId": "containers",
      "meta": { "type": "system" },
    },
  ],
  "edges": [
    {
      "id": "e-customer-ecommerce",
      "source": "customer",
      "target": "ecommerce",
      "label": "uses",
      "meta": { "type": "calls" },
    },
  ],
}
```

Nodes omit the `description` field entirely — prose lives in `descriptions/<node.id>.md`.

**Linking a node to its source (`path`).** When a node maps directly to a single file or directory, add a `path` — a repo-root-relative path that lets the viewer open the file in the editor (VS Code) or link to it on the repo host (web). A trailing `/` marks a directory:

```jsonc
{ "id": "order-service", "label": "Order Service", "path": "src/orders/service.ts", "meta": { "type": "service" } },
{ "id": "controllers",   "label": "HTTP Controllers", "path": "src/controllers/", "meta": { "type": "gateway", "isContainer": true } }
```

Rules: relative to the repo root (the directory `manifest.source` points at), no leading `/`, no `..`. Set `path` **only** where a node is exactly one file or directory — omit it for conceptual nodes or anything that spans several files.

### Nesting within a diagram

A node can group 2–4 sibling nodes that share a runtime boundary by using `parentId` and setting `meta.isContainer: true` on the parent. The viewer renders the parent as a labeled container with its children laid out inside.

```jsonc
{
  "nodes": [
    { "id": "controllers", "label": "HTTP Controllers", "meta": { "type": "gateway", "isContainer": true } },
    { "id": "auth-controller",    "label": "Auth Controller",    "parentId": "controllers", "meta": { "type": "service" } },
    { "id": "catalog-controller", "label": "Catalog Controller", "parentId": "controllers", "meta": { "type": "service" } },
    { "id": "order-controller",   "label": "Order Controller",   "parentId": "controllers", "meta": { "type": "service" } },
    { "id": "order-service",      "label": "Order Service",      "meta": { "type": "service" } }
  ]
}
```

Constraints: children must live in the **same diagram** as the parent; the parent must set `meta.isContainer: true`; nesting is **one level deep** (no grandchildren — the validator rejects a grandchild and points you to `subDiagramId` instead).

**Grouping vs. drill-down.** Two mechanisms, one decision:

- **2–4 things share an obvious runtime boundary and belong on the same level?** Use `parentId` (same diagram). Edges into/out of the group still work.
- **3+ things warrant their own page, with edges only the reader at that level should see?** Use `subDiagramId` (separate diagram, next C4 level).
- **Default**: flat. Don't nest if the grouping isn't load-bearing.

### `descriptions/<node-id>.md`

Free-form GitHub-flavored markdown. Phase C seeds each file with a 1–2 sentence summary, then `## Responsibilities` and `## Tech Stack`. An on-demand [deep-dive](#deep-dive) can later deepen any first-party code node into the fuller convention — summary, `## Responsibilities`, `## Key files`, `## Dependencies` (inbound/outbound), `## Tech Stack` — grounded in the component's actual code (see [reference/deep-dive.md](reference/deep-dive.md)).

**Embed mermaid diagrams** with a standard fenced block (```` ```mermaid ````). The viewer renders the block inline as an SVG and lets users click an expand affordance to open a full-screen lightbox — useful for illustrating runtime behavior that the static C4 diagram cannot: request/response sequences, state machines, decision flows, retry/error branches. Any diagram type mermaid supports works (`sequenceDiagram`, `flowchart`, `stateDiagram-v2`, `erDiagram`, `classDiagram`, `gantt`, …).

Use mermaid sparingly — one diagram per description, only when the prose is easier to grasp with a picture. If a description needs several diagrams, that's usually a hint to split the component into smaller nodes.

Example description with a mermaid block:

````markdown
Node.js REST API backing the storefront and admin app.

## Responsibilities
- Authenticate sessions and authorise requests
- Create orders and publish `order.created` to the event bus

## Checkout Sequence

```mermaid
sequenceDiagram
  Storefront->>API Service: POST /orders
  API Service->>Postgres: INSERT order
  API Service->>Event Bus: publish order.created
  API Service-->>Storefront: 201 Created
```
````

Full schema details (all fields, enums, constraints): see [reference/schema.md](reference/schema.md).
Minimal working example: see [reference/example/](reference/example/).
Machine-readable schemas (JSON Schema Draft 2020-12): [schemas/manifest.schema.json](schemas/manifest.schema.json), [schemas/diagram.schema.json](schemas/diagram.schema.json).

## Workflow

Three phases — **Discover → Map → Author**. Do not skip Phase A and dive straight into JSON; the most common failure mode is a generic, template-shaped architecture that names the right C4 levels but misses what makes *this* repo distinctive. (Descriptions can be deepened afterwards, on demand — see [Deep-dive](#deep-dive).)

Stack-specific recipes, an external-system catalog, and a worked example live in [reference/discovery.md](reference/discovery.md). Read it once before authoring an architecture for an unfamiliar repo shape.

### CodeGraph presence gate (hard requirement)

This skill requires **CodeGraph** — the code-intelligence companion installed by `npx @tecture/install` — for discovery, deep-dives, and evidence checking. Before Phase A (and before any update or deep-dive), verify it:

```
codegraph status --json     # expect "initialized": true for this repo
```

If the `codegraph` binary is missing or the repo has no index (no `.codegraph/` directory), **STOP**. Tell the user to run `npx @tecture/install` (it installs the skill, installs CodeGraph globally, wires its MCP server, and indexes the repo), and do not proceed with authoring, updating, or deep-diving until it has. Do **not** fall back to manual grep/read-only discovery — an unverifiable architecture is the failure mode this gate exists to prevent.

### Phase A — Discover (read-only)

**Lead with CodeGraph.** The index already contains the repo's symbols, imports, call graph, routes, and framework wiring — query it before reading files:

- `codegraph explore "<question or symbol names>"` (or the `codegraph_explore` MCP tool when your host has it; agents without the MCP integration — e.g. Copilot, Windsurf — use the CLI) answers "how does X work / what talks to Y" with verbatim source plus call paths.
- `codegraph status --json` reports indexed languages and file/node/edge counts — a fast stack fingerprint.

Then gather evidence for these eight artifacts. **Do not guess** — find the file, dependency, or index entry that proves it.

1. **Repo shape** — single app, monorepo (one or many deployables), microservices, library/SDK, CLI, mobile, data pipeline. Detect from workspace files (`pnpm-workspace.yaml`, `lerna.json`, `turbo.json`, `go.work`, Cargo workspaces), top-level directories (`packages/`, `services/`, `apps/`, `cmd/`), and the count of `Dockerfile`s.
2. **Primary stack** — read every `package.json`, `pyproject.toml`, `requirements*.txt`, `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle`, `Gemfile`, `composer.json`, `mix.exs`. Note the *frameworks* (Next.js, FastAPI, Django, NestJS, Spring Boot, gin, axum), not just the language.
3. **Deployables** — anything that runs as a long-lived process: `Dockerfile`s, `docker-compose.yml` services, `Procfile`, `serverless.yml`, k8s manifests, GitHub Actions deploy jobs, `bin/` entry points, `scripts.start`/`scripts.dev`.
4. **Datastores & infra** — env vars matching `*_URL`/`*_DSN`/`*_HOST`/`*_BUCKET`; ORM configs (`prisma/schema.prisma`, Django `DATABASES`, `alembic.ini`); IaC under `terraform/`/`cdk/`/`pulumi/`.
5. **External SDKs / SaaS** — provider SDK imports (`stripe`, `@sendgrid/*`, `@aws-sdk/*`, `boto3`, `openai`, `@anthropic-ai/sdk`, `@clerk/*`, `@sentry/*`); webhook routes; OAuth providers. Each match is usually an external node.
6. **Actors / personas** — distinct frontends (admin vs end-user), auth roles, public API consumers, CLI users, cron/CI callers. Different behaviors → different person nodes.
7. **Purpose** — top-level README + the `description` field in the package manifest + the primary entry point. This seeds `manifest.description` and the top-system description.
8. **Source repository** — run `git remote get-url origin` (fall back to the first remote from `git remote -v`) and normalize the result for `manifest.source`: strip a trailing `.git`, and convert `git@host:org/repo` → `https://host/org/repo`. Derive `manifest.sourceHost` from the domain (`github.com`→`github`, `gitlab.com`→`gitlab`, `bitbucket.org`→`bitbucket`); for a self-hosted/unrecognized domain, set the closest known host only if the URL path shape makes it obvious, else omit `sourceHost`. Run `git rev-parse --show-toplevel` — node `path` values (next section) are relative to this repo root. If there is no remote, omit both `source` and `sourceHost`.

### Phase B — Map discovery → C4

Translate evidence using the patterns in [reference/discovery.md](reference/discovery.md). Universal rules:

- **L1 (System Context)** — one node for the system + person actors + every external SaaS/datastore that lives outside *your* deployable boundary. **3–5 nodes total. Never name internal services here.**
- **L2 (Containers)** — one node per deployable from A3 + one node per managed datastore/broker from A4 + each external from A5. **4–8 nodes**, edges with concrete labels (`REST`, `gRPC`, `order.created`, `reads/writes`).
- **L3 (Components)** — *optional*. Add only when an L2 container has 3+ separable internal parts that genuinely help a reader (e.g. an API split into auth/catalog/orders controllers + repos). **3–6 nodes**, never just a renamed re-arrangement of L2.

Stack idioms differ — a Next.js + Postgres app, a Django monolith, a FastAPI + Celery service, a microservice mesh, a CLI, a data pipeline each get a different L2 shape. Use the matching recipe in [reference/discovery.md](reference/discovery.md) as a starting prior, then adjust to what is actually in the repo.

### Phase C — Author & self-evaluate

1. **Write child diagrams first** (L3 → L2 → L1) so slugs exist before parents reference them via `subDiagramId`.
2. **For each diagram**, write `diagrams/<slug>.json`, then create `descriptions/<node-id>.md` for **every** node. Lead each description with one sentence of *responsibility* — what this node owns, not a rephrasing of its label. These seed descriptions are deliberately brief; a later [deep-dive](#deep-dive) can enrich any first-party code node on request. Add a `path` to any node that maps to exactly one file or directory (repo-root-relative; trailing `/` for a directory).
3. **Write `manifest.json`** with `name`, `description` (2–4 plain-text paragraphs), `source` + `sourceHost` from Phase A (if a remote exists), `topDiagram` set to the L1 slug, and `diagrams` listing every slug.
4. **Run the [Quality checklist](#quality-checklist)** against the draft. Fix anything that fails.
5. **Validate** (see below). Fix every error before reporting success.
6. **Run the evidence check** (see [Evidence check](#evidence-check-codegraph)) and apply **resolve-or-explain**: fix every `error` finding; for each `warn`, either correct the diagram (add the missing edge, fix the wrong one) or explicitly justify it in your final report (e.g. "unverified: REST boundary, statically invisible"). Never silently ignore a finding. Commit the updated `architecture/.tecture/drift.json` along with the architecture files. Then **offer a [deep-dive](#deep-dive)** to enrich descriptions — a component, several, or all — but don't run it automatically.

## Quality checklist

The validator checks *shape*. This checklist checks *meaning* — apply it before running the validator. Aim for ≥11/13 on a fresh architecture; treat any miss as a real defect, not a stylistic preference.

1. **60-second comprehension** — Read only the L1 diagram + the top-system description. Can a new engineer answer "what does this system do, who uses it, what does it depend on"?
2. **Evidence-grounded** — For each node, name the file or dependency that proves it exists (a `Dockerfile`, a `package.json` entry, an env var, an SDK import). No node should be "I think there's probably one of these."
3. **Right abstraction per level** — L1 hides internals; L2 shows deployables and managed infra; L3 appears only when an L2 container has 3+ meaningfully separable parts.
4. **Boundaries match real seams** — Each node corresponds to a deployable, process, package, or module with its own contract. Could you imagine each node being deployed, replaced, or owned independently?
5. **Edges express runtime relationships** — Every edge label is a verb or protocol (`REST`, `gRPC`, `order.created`, `reads/writes`, `webhook`). No `uses` / `depends on` / `interacts with`.
6. **Technology authenticity** — Every `meta.technology` matches a real entry in a manifest, lockfile, or Dockerfile. Use [Simple Icons](https://simpleicons.org) slugs.
7. **Drill-down adds information** — Each `subDiagramId` exposes structure not visible at the parent level. If removing the sub-diagram costs no understanding, delete it. Use `parentId` grouping when 2–4 nodes share a boundary on the same level; reach for `subDiagramId` only when the inner structure earns its own page.
8. **Descriptions explain why, not what** — Strip the heading from any `descriptions/*.md`; you should still be able to tell which node it describes from the responsibilities. If not, the description is too generic.
9. **Coverage of externals** — Grep for `*_URL`, `*_KEY`, and common SDK imports (`stripe`, `boto3`, `@aws-sdk/*`, `openai`, `@anthropic-ai/sdk`). Every match maps to a node.
10. **Diagrams fit on one screen** — L1: 3–5 nodes; L2: 4–8; L3: 3–6. Anything bigger means split into a deeper level.
11. **Stable, code-derived names** — Labels match what the code calls things (directory names, package names, service names). Don't invent synonyms.
12. **Reusable on update** — When code changes (e.g. "we added a Redis cache"), a focused 1–2 file diff should be enough. If a small change forces a rewrite, the boundaries are wrong.
13. **Source links resolve** — `manifest.source` is the normalized repo URL, and every node `path` points at a real file or directory from the repo root (trailing `/` for directories). `path` appears only on nodes that are genuinely one file or folder, never on conceptual or multi-file nodes.

Common anti-patterns to watch for: "Business Logic" / "Service Layer" nodes; L1 diagrams that name internal services; L3 diagrams that just rename L2; edges labeled `uses`; technologies you didn't grep for. See [reference/discovery.md](reference/discovery.md#anti-patterns-do-not-do-these) for the full list.

## Deep-dive

Phase C descriptions are deliberately brief — one agent, holding the whole map in its head, can only spare a sentence or two per node, which reads generic on a large or complex repo. A **deep-dive** fixes that for a chosen component on demand: it spawns an investigator sub-agent that reads *that* component's code, traces its real dependencies through the repo, and rewrites the description grounded in actual files, calls, and seams.

It is **never automatic.** After authoring, offer it and wait — let the user decide what to deepen, and when.

Invoke it by naming a component (matched to a node id or label):

- `/architecture-docs deep-dive <component>` — or plain English: "deep-dive the auth service", "enrich the realtime component's description". *enrich* / *deep-dive* / *investigate* all mean the same thing here.
- Name **one** component, **several**, or **all** of them.

How it runs:

- **One or a few components** — investigate each independently, one pass: read its code, trace inbound/outbound dependencies (reading siblings as needed), rewrite `descriptions/<id>.md`, re-validate.
- **All** — investigate every first-party code node in parallel batches, then a **reconcile** pass cross-links them (so B's description learns it's called by A) before finalizing.

Only first-party code nodes are worth a deep-dive — `service`/`frontend`/`gateway`/component nodes, or anything with a `path`. There's nothing to investigate in a person, an external SaaS, or managed infra; if asked to deep-dive one, say so. The main agent is the **sole writer** (sub-agents return text, never edit files). A deep-dive rewrites descriptions freely, but it can also **correct the diagram JSON or manifest when they're inaccurate** against the real code (a wrong type/path/technology, an edge the code doesn't make, a missing or spurious node/edge) and **add a drill-down diagram** for a component complex enough to warrant its own page. Every such structural change is **confirmed with you first** — it shows the discrepancy and its evidence, asks, and only then edits and re-validates; it never changes a diagram or the manifest silently.

Full orchestration — component resolution, the shared context pack, the investigator brief, the enriched-description template, the findings contract, and the reconcile pass — is in [reference/deep-dive.md](reference/deep-dive.md). Read it before running a deep-dive.

## Updating an existing architecture

- Adding a node: write the node object, write the description `.md`, add an edge if applicable, then re-validate.
- Renaming a node id: rename the description file to match, update every `parentId`/`subDiagramId`/`source`/`target` reference, then re-validate.
- Removing a diagram: remove the file, remove the slug from `manifest.diagrams`, clear any `subDiagramId` that pointed to it, and delete description `.md`s for nodes that no longer appear anywhere.

Write the complete file each time — do not try to patch JSON by hand with partial objects. The [presence gate](#codegraph-presence-gate-hard-requirement) applies to updates too; after any update, re-run both the validator and the [evidence check](#evidence-check-codegraph) (resolve-or-explain, commit the refreshed `drift.json`).

After an update, offer to [deep-dive](#deep-dive) the **added or changed** first-party code nodes only — not the whole architecture — so new components get the same depth without re-investigating unchanged ones.

## Validation (always run before reporting done)

Run the bundled validator from the project root:

```
node .claude/skills/architecture-docs/scripts/validate.mjs
```

By default it checks `./architecture`. Pass a path to validate a different location: `node .claude/skills/architecture-docs/scripts/validate.mjs path/to/other-arch`.

The validator checks:

- **Shape** — every file matches the JSON Schema (field presence, types, enum values, slug patterns, no unknown fields).
- **Manifest consistency** — `topDiagram` is listed in `diagrams[]`; every listed slug has a matching `diagrams/<slug>.json`; files on disk that aren't listed produce a warning.
- **Node references** — `parentId` points to a same-diagram node whose `meta.isContainer` is true, the `parentId` chain has no cycles, and nesting is at most one level deep (grandchildren are rejected — promote to a child diagram via `subDiagramId`). `subDiagramId` points to an existing diagram slug and is not self-referential.
- **Edge references** — `source` and `target` resolve to nodes in the same diagram.
- **Global node-id uniqueness** — node ids don't collide across diagrams (required because descriptions are keyed by node id).
- **Descriptions** — every node id has a matching `descriptions/<id>.md`; orphan description files produce a warning.
- **Cycles** — the `subDiagramId` drill-down graph is acyclic.

Exit codes: `0` success, `1` validation failure, `2` internal error. Non-zero exit means there is still work to do — fix and re-run.

## Evidence check (CodeGraph)

The validator checks *shape*; the evidence script checks the architecture **against the actual code**, via the CodeGraph index:

```
node .claude/skills/architecture-docs/scripts/evidence.mjs
```

Defaults to `./architecture` and `<repo-root>/.codegraph/codegraph.db` (repo root = the parent of the architecture directory); pass a path and/or `--db <path>` to override. Requires Node ≥ 22.5 (for `node:sqlite`) and an index — no index is a hard error pointing at `npx @tecture/install`.

What it reports:

- `missing-path` (**error**) — a node's `path` matches no indexed file and doesn't exist on disk. Always fix.
- `unverified-edge` (**warn**) — a declared edge with no supporting symbol edges between the two nodes' paths. Legitimate for runtime/HTTP boundaries; still needs an explicit justification in your report (resolve-or-explain).
- `undeclared-dependency` (**warn**) — ≥3 real (non-heuristic) symbol edges cross two nodes with no declared edge. Usually a missing edge in the diagram — add it, or justify why it stays off the map.
- `unmapped-external` (**info**) — a well-known SDK (stripe, openai, pg, …) is imported but no node covers it. Consider an external node.
- `skipped-node` / `skipped-edge` (**info**) — pathless nodes and person/external/datastore edges that static analysis cannot verify. Expected; no action needed.

It writes `architecture/.tecture/drift.json` (the Tecture viewer renders it as the Drift panel and per-node Evidence sections) — but only when findings actually changed, so committing it produces reviewable PR diffs without churn. Exit codes: `0` ran (findings are advisory), `1` hard failure (no index / old schema / Node < 22.5) or — with `--strict` — error-severity findings present, `2` internal error. If it warns about a stale index, run `codegraph sync` and re-run.
