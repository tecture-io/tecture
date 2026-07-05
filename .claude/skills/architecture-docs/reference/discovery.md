# Discovery & mapping reference

How to go from "here is a repo" to "here is an architecture" without producing a generic, template-shaped diagram. Read this **before** authoring the first JSON file.

The goal is not to inventory every directory — it is to build the smallest set of nodes and edges that lets a new engineer answer three questions in 60 seconds:

1. What does this system do, and who uses it?
2. What does it depend on (datastores, brokers, external SaaS)?
3. Where would I make a change of type X?

Everything below serves that goal.

## Phase A — Discover (read-only)

Before writing any JSON, gather evidence for eight artifacts. Treat this as a checklist; if you cannot fill in an artifact, *find it* — do not guess.

### A0. Query CodeGraph first

The presence gate in [SKILL.md](../SKILL.md#codegraph-presence-gate-hard-requirement) applies: no `codegraph` binary or no `.codegraph/` index → **stop** and point the user at `npx @tecture/install`; never fall back to grep-only discovery.

With the index present, CodeGraph answers the code-shaped half of this checklist in a few calls — `codegraph explore "<question or symbol names>"` (or the `codegraph_explore` MCP tool; Copilot and Windsurf have no CodeGraph MCP integration, so use the CLI there) and `codegraph status --json`:

| Artifact | CodeGraph gives you | Still manual |
|---|---|---|
| A1 repo shape | indexed languages + file/node/edge counts (`status --json`) | workspace files, `Dockerfile` count |
| A2 stack | frameworks *as wired*: route/component nodes prove Express/FastAPI/React/… is actually used, not just installed | manifest versions |
| A3 deployables | entry points: files with many outbound imports and none inbound (`explore` on suspected entries) | Dockerfiles, compose services, Procfile, k8s, CI deploy jobs |
| A4 datastores & infra | ORM/driver usage sites; Terraform resources where indexed | env vars, compose, un-indexed IaC |
| A5 external SDKs | every third-party import in the graph — `evidence.mjs` later cross-checks the well-known ones against your nodes | webhook routes, OAuth config |
| A6 actors | route groups/prefixes hint at distinct API surfaces (admin vs public) | auth roles, frontends in other repos |
| A7 purpose | — | README, manifest description |
| A8 source repo | — | `git remote get-url origin` |

Dockerfiles, compose/k8s manifests, env files, and CI config are not in the code graph — those artifacts stay file-reading work.

### A1. Repo shape

Pick one. Determines L2 granularity.

| Shape | Signals |
|---|---|
| **Single app** | One `package.json` / `pyproject.toml`; one `Dockerfile` (or none); no workspace files |
| **Monorepo (libraries + 1 app)** | `pnpm-workspace.yaml` / `lerna.json` / `turbo.json` / `nx.json` / `go.work` / Cargo workspace, but only one `packages/*` or `apps/*` is a deployable |
| **Monorepo (multiple deployables)** | Workspace files **and** multiple deployables (multiple `Dockerfile`s, multiple `apps/*`, multiple `cmd/*`) |
| **Microservices** | `services/*` or `cmd/*` directories, each with its own `Dockerfile`/manifest, often a shared infra/proto directory |
| **Library / SDK** | A single `package.json` whose `main`/`exports` ships code for *consumption*; no `bin`/server entry point; tests but no Dockerfile |
| **CLI tool** | `bin` field in `package.json`, or `cmd/main.go`, or `[project.scripts]` in `pyproject.toml`; no long-running server |
| **Mobile app** | `ios/`, `android/`, `App.tsx` + React Native deps, or Flutter `pubspec.yaml` |
| **Data pipeline** | Airflow `dags/`, dbt `models/`, Spark/Beam jobs, scheduled GitHub Actions, no HTTP server |

### A2. Primary stack

Read every package manifest at the repo root and one level down. Note frameworks, not just languages:

- Node: `package.json` → `dependencies`. Note React/Next/Vue/Svelte (frontend), Express/Fastify/NestJS/Hono (server), Prisma/Drizzle/TypeORM (ORM), bullmq/inngest (jobs).
- Python: `pyproject.toml` / `requirements*.txt`. Note Django/Flask/FastAPI/Starlette (web), SQLAlchemy/Django ORM, Celery/RQ (workers), pandas/polars/spark (data).
- Go: `go.mod`. Note gin/echo/chi (web), gRPC, sqlx/gorm (DB).
- Rust: `Cargo.toml`. Note axum/actix/rocket (web), sqlx/diesel.
- JVM: `pom.xml`/`build.gradle`. Note Spring Boot, Quarkus.
- Ruby: `Gemfile`. Note Rails, Sidekiq.
- PHP: `composer.json`. Note Laravel, Symfony.

The stack determines L3 idioms (Phase B).

### A3. Deployables / long-running processes

What actually runs in production? Each one is a candidate L2 container.

- `Dockerfile` files (count and per-directory).
- `docker-compose.yml` services (each service is usually a container).
- `Procfile` entries.
- `serverless.yml` / `template.yaml` (SAM) functions.
- Kubernetes manifests (`Deployment`, `StatefulSet`, `CronJob`).
- GitHub Actions deploy jobs (look in `.github/workflows/*.yml` for `deploy`/`publish` jobs).
- `package.json` scripts: `start`, `dev`, `serve`, `worker`, `consumer`.
- `bin/` entry points and shebang scripts.

### A4. Datastores & infra

- Env vars in `.env*`, `.env.example`, `docker-compose.yml`, k8s configmaps. Watch for `*_URL`, `*_DSN`, `*_HOST`, `*_BUCKET`, `*_QUEUE`.
- ORM configs: `prisma/schema.prisma`, Django `DATABASES` setting, `alembic.ini`, `sqlalchemy.url`, `knexfile.js`.
- Queues: `redis`, `rabbitmq`, `kafka`, `sqs`, `pubsub` mentions in deps + env.
- Object storage: `s3`, `gcs`, `azure-blob`.
- IaC: `terraform/`, `cdk/`, `pulumi/`, `bicep/`. Each `aws_db_instance` / `azurerm_storage_account` / etc. is usually a node.

### A5. External systems & SDKs

Grep dependency manifests and import statements. Each match is usually an external L1/L2 node.

| Capability | SDK / dependency hint | Suggested node |
|---|---|---|
| Payments | `stripe`, `braintree`, `square`, `paddle` | "Stripe" — `meta.type: external`, `technology: stripe` |
| Email | `@sendgrid/*`, `resend`, `postmark`, `mailgun` | "SendGrid" — `external` |
| Auth | `next-auth`, `@clerk/*`, `@auth0/*`, `firebase-auth`, `passport-*` | "Auth0" / "Clerk" — `external` |
| AI | `openai`, `@anthropic-ai/sdk`, `cohere-ai`, `together` | "Anthropic API" — `external`, `technology: anthropic` |
| Analytics | `posthog`, `mixpanel`, `segment`, `amplitude` | "PostHog" — `external` |
| Observability | `@sentry/*`, `datadog`, `newrelic` | "Sentry" — `external` |
| AWS | `@aws-sdk/client-s3`, `boto3` | One node per service used (S3, SQS, DynamoDB) |
| Search | `@elastic/elasticsearch`, `algoliasearch`, `meilisearch` | "Elasticsearch" — `database` or `external` |
| Cache | `redis`, `ioredis`, `memcached` | "Redis" — `cache` |
| CDN / files | `cloudinary`, `uploadthing`, `imagekit` | `storage` |
| Webhooks in | Routes under `/webhooks/*`, `webhook` middleware | edge from external SaaS → your service |

### A6. Actors / personas

Who interacts with the system from outside?

- Different frontends (admin app vs end-user app vs marketing site) → different actors **or** different containers.
- Auth roles (`admin`, `customer`, `support`) → multiple person nodes when behavior differs.
- Public API consumers (`api.example.com`) → an external "API Consumer" person node.
- CLI users → person node when the CLI is the primary interface.
- CI / cron / external webhook callers → distinguish from human actors.

### A7. Purpose

In one paragraph from the README + the package manifest `description`. This becomes the seed for `manifest.description` and the top-system description.

If the README is a wall of badges and boilerplate, fall back to: name of the deployed service + what its primary endpoint or CLI command does + who calls it.

### A8. Source repository

`git remote get-url origin` → `manifest.source`; the domain seeds `manifest.sourceHost`; `git rev-parse --show-toplevel` is the repo root every node `path` is relative to. The exact normalization (strip `.git`, rewrite `git@host:org/repo` → HTTPS, host mapping) lives in [SKILL.md's Workflow → Phase A item 8](../SKILL.md#workflow) — don't restate it here. Omit `source`/`sourceHost` when the repo has no remote.

## Phase B — Map discovery → C4

The universal L1/L2/L3 sizing rules and the grouping (`parentId`) vs. drill-down (`subDiagramId`) decision rule are the single source of truth in [SKILL.md's Workflow → Phase B](../SKILL.md#workflow) and [Nesting within a diagram](../SKILL.md#nesting-within-a-diagram) — they are not repeated here so the two files can't drift. What this file adds is the concrete part: per-stack recipes for turning discovery evidence into those nodes.

### Stack recipes

Concrete templates. Adjust to the actual code — these are priors, not prescriptions.

#### Next.js / React + API routes

- **L1** — System (your app) ← Customer; → external SaaS (Stripe, Auth0, OpenAI, S3); → Postgres if managed.
- **L2** — `Web App` (frontend, `meta.type: frontend`, `technology: nextjs`); `API Routes` (`service`, `nextjs`) — **only split if the API surface is non-trivial; otherwise model Next.js as one container**; `Postgres` (`database`); each external SaaS as `external`.
- **L3 (API Routes)** — group by feature folder under `app/api/*` or `pages/api/*`. One component per top-level route group (`auth`, `checkout`, `webhooks`).

Example node:
```jsonc
{ "id": "web-app", "label": "Next.js App", "subDiagramId": "components-web",
  "meta": { "type": "frontend", "technology": "nextjs" } }
```

#### Express / NestJS / Fastify (Node API)

- **L1** — System ← Frontend(s) (often external from the API's perspective if they live in a different repo); → DB; → externals.
- **L2** — `API Service` (`service`, `expressjs`/`nestjs`/`fastify`); `Worker` if there is a queue consumer; `Postgres`; `Redis` if used; broker if used.
- **L3 (API Service)** — one component per top-level controller group + one for the ORM/repo layer + one for shared middleware (auth, rate-limit) when material.

#### Python: Django / Rails monolith

- **L1** — System ← User; → DB; → externals.
- **L2** — `Web App` (`service`, `django`/`rails`); `Worker` (`service`, `celery`/`sidekiq`) if present; `Postgres`; `Redis` (broker/cache).
- **L3 (Web App)** — one component per Django app / Rails engine. Don't model every model class.

#### Python: FastAPI + workers

- **L1** — System ← Client; → DB; → externals (often OpenAI/Anthropic, S3).
- **L2** — `API` (`service`, `fastapi`); `Worker` (`service`, technology depending on broker); `Broker` (`queue`, `redis`/`rabbitmq`); `Postgres`.
- **L3 (API)** — one component per `routers/*` module + a `Services` component for shared business logic + a `Repositories` component if a clean layer exists.

#### Python: data pipeline / Airflow / dbt

- **L1** — System (the pipeline) ← Analyst (consumer of the warehouse); ← Source systems (the upstream data); → Warehouse.
- **L2** — One container per scheduler/runtime (`Airflow`, `dbt Cloud`, `Dagster`); `Warehouse` (Snowflake/BigQuery/Postgres) as `database`; each upstream source (Stripe export, S3 raw bucket, Kafka stream) as `external`/`storage`/`queue`.
- **L3 (per scheduler)** — one component per DAG / model directory. Don't model every task.

#### Go / Rust microservices

- **L1** — System ← clients; → externals.
- **L2** — One container per `cmd/*` (Go) / per binary in `Cargo.toml` workspace (Rust); each datastore as its own node; gRPC mesh edges between services.
- **L3** — Optional. Use when a single service has clean internal layering (`handler` / `service` / `store`).

#### Mobile (React Native / Flutter / iOS / Android)

- **L1** — System (the mobile app + its backend) ← End user; → backend if separately owned; → push provider (FCM/APNs); → analytics; → auth.
- **L2** — `Mobile App` (`frontend`, `react`/`flutter`/`swift`/`kotlin`); `Backend API`; managed datastores; push provider.
- **L3 (Mobile App)** — feature modules / navigation stacks; only if the app is genuinely multi-feature.

#### CLI / library / SDK

- **L1 only.** A single system box, the user/agent who invokes it, and any service it talks to (registry, telemetry endpoint, target system). **No L2 unless the CLI is internally split into independently deployable pieces** — a CLI with `commands/` directories does not need an L2.
- For SDKs whose main job is talking to one upstream API: model the upstream API as an external node, the SDK as the system, and the consumer (app) as the actor.

#### Monorepo with multiple deployables (e.g. pnpm workspaces — this repo's shape)

- **L1** — System box + actors + every external SaaS.
- **L2** — One container per **independently runnable or published** workspace package. Skip pure type-only packages unless they cross a meaningful API boundary. Datastores and brokers as nodes.
- **L3** — Per heaviest container only, not every container.

### Anti-patterns (do not do these)

- **"Business Logic" / "Service Layer" / "Helpers" nodes.** Empty calories. If you can't name what it does, it's not a node.
- **L1 with internal service names.** `system-context.json` listing `auth-service` and `order-service` is L2 leaking into L1.
- **L3 that just renames L2.** If the only difference between an L2 node `API` and its L3 children is "API" → "API Controller" + "API Routes", delete the L3.
- **Edges labeled `uses`, `depends on`, `interacts with`.** Use a verb or protocol.
- **`meta.technology` you didn't see in a manifest.** Don't add `redis` because it "feels right" — grep first.
- **One description.md per node that all read like `<Label> handles <label>-related things`.** Fail criterion #8. Rewrite or remove.
- **Modeling every directory.** A `utils/` folder is not a component. A `models/` folder is not a database.
- **Modeling tests, lint configs, CI jobs as nodes.** Those are not part of the runtime architecture. (CI/CD platforms only appear as nodes if the architecture is *about* delivery, e.g. a release-automation system.)
- **Forking the architecture into "logical" + "physical".** Pick one — Tecture diagrams represent *what runs*. Use `meta.type` (`service`, `database`, `queue`, etc.) to convey the physical reality.

## Phase C — Author & self-evaluate

The authoring order (children before parents, a description per node id, `manifest.json` last), the closing **quality checklist**, and the validator step are defined once in [SKILL.md's Workflow → Phase C](../SKILL.md#workflow) and [Quality checklist](../SKILL.md#quality-checklist). Follow them there. The worked example below shows the level of evidence a real discovery pass should produce.

## Worked example: discovering Tecture IO itself

Applied to the [architecture/](../../../../architecture/) folder of this repo. Use this as a reference for the level of evidence you should be gathering.

**A1. Repo shape** — Monorepo with one published deployable. `pnpm-workspace.yaml` lists `packages/shared`, `packages/web`, `packages/server`. Only `packages/server` (`@tecture/core`) is published; `packages/web` and `packages/shared` are bundled into it at build time (per the README "Repo layout" table).

**A2. Stack** — Node 20+, Express (server), React + Vite + ReactFlow + ELK (web), TypeScript types (shared). pnpm 10 monorepo via Corepack.

**A3. Deployables** — One: the published CLI `@tecture/core`, started by `npx @tecture/core` on port 3000. Serves both REST API and bundled UI from a single Express process.

**A4. Datastores & infra** — None. Per the README: "no database, no authentication, no deployment surface — the only durable state lives on the user's local filesystem."

**A5. External systems** — None directly called. The user's local `architecture/` directory is the only data source — model it as an external `storage` node.

**A6. Actors** — Developer (runs the CLI, browses diagrams). Coding agent (writes the `architecture/` files, indirectly upstream of the viewer).

**A7. Purpose** — From `manifest.json` description: "zero-configuration viewer for file-based architecture diagrams authored by coding agents."

**Mapping** (Phase B):

- L1: `developer` (person) → `tecture-io` (system) ← `coding-agent` (person, writes the files); `tecture-io` → `architecture-files` (external storage).
- L2: `cli-server` (service, expressjs) — bundles and serves the UI; `web-ui` (frontend, react) — rendered ReactFlow canvas; `shared-types` only if you want to show the contract between server and UI; `architecture-files` (storage) on the user's local disk.
- L3: per container only if needed. The server has clear internal seams (REST routes, the file reader, the manifest parser); the UI has the diagram view, the description panel, the routing layer.

This matches the existing [architecture/manifest.json](../../../../architecture/manifest.json) (`system-context`, `containers`, `components-api`, `components-web`) — meaning the discovery process re-derives a known-good architecture from first principles, which is the bar new outputs should clear.
