#!/usr/bin/env node
// Evidence checker for file-based Tecture architectures.
//
// Verifies the architecture files against the repo's CodeGraph index
// (.codegraph/codegraph.db) and writes a drift report the Tecture viewer
// renders (architecture/.tecture/drift.json).
//
// Usage: node evidence.mjs [path/to/architecture] [--db <path>] [--strict] [--self-test]
//
// Exits 0 when the check ran (findings are advisory; with --strict, exits 1
// when any error-severity finding exists), 1 on hard failure (no index,
// unsupported Node or schema), 2 on internal error.
//
// The drift.json shape mirrors `DriftReport` in @tecture/shared (packages/
// shared/src/drift.ts). This script is zero-dependency and cannot import that
// package — keep the field names in lockstep.

// ---------------------------------------------------------------------------
// Bootstrap: node:sqlite needs Node >= 22.5, a flag on some versions, and
// emits an ExperimentalWarning we don't want polluting agent-visible stderr.
// Re-exec ourselves exactly once with the right flags.
// ---------------------------------------------------------------------------

import { fileURLToPath } from "node:url";

const [NODE_MAJOR, NODE_MINOR] = process.versions.node.split(".").map(Number);

if (NODE_MAJOR < 22 || (NODE_MAJOR === 22 && NODE_MINOR < 5)) {
  console.error(
    `[error] evidence.mjs requires Node >= 22.5 for node:sqlite (found ${process.version}).`,
  );
  console.error("        Install a newer Node (e.g. via nvm) and re-run.");
  process.exit(1);
}

if (!process.env.TECTURE_EVIDENCE_EXEC) {
  const { spawnSync } = await import("node:child_process");
  const flags = ["--disable-warning=ExperimentalWarning"];
  const needsSqliteFlag =
    (NODE_MAJOR === 22 && NODE_MINOR < 13) ||
    (NODE_MAJOR === 23 && NODE_MINOR < 4);
  if (needsSqliteFlag) flags.push("--experimental-sqlite");
  const res = spawnSync(
    process.execPath,
    [...flags, fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    { stdio: "inherit", env: { ...process.env, TECTURE_EVIDENCE_EXEC: "1" } },
  );
  process.exit(res.status ?? 2);
}

const { DatabaseSync } = await import("node:sqlite");
const { readFile, readdir, mkdir, rename, writeFile, stat } = await import(
  "node:fs/promises"
);
const { existsSync, statSync } = await import("node:fs");
const { join, resolve, dirname } = await import("node:path");
const { mkdtemp, rm } = await import("node:fs/promises");
const { tmpdir } = await import("node:os");
const assert = (await import("node:assert/strict")).default;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Minimum CodeGraph schema this script can query. v2 added edges.provenance —
// the only migrated column used below (v1 covers everything else). Do NOT
// gate on newer versions: v7 only adds the prompt hook's vocab table.
const MIN_SCHEMA_VERSION = 2;
// Newest schema this script was written against. Newer is best-effort.
const KNOWN_SCHEMA_VERSION = 7;

// CodeGraph edge kinds that represent a dependency between files.
// `contains`/`exports` are structural, not dependencies.
const DEP_KINDS = [
  "calls",
  "imports",
  "references",
  "instantiates",
  "extends",
  "implements",
  "type_of",
  "returns",
  "decorates",
  "overrides",
];

// Tecture edge type -> CodeGraph kinds that count as support for it.
// Anything not listed accepts any dependency kind.
const EDGE_SUPPORT = {
  calls: new Set(["calls", "references", "imports", "instantiates"]),
};

// Declared edges whose endpoint is one of these node types cannot be verified
// statically (a service's SQL client never references the database *node*).
const UNVERIFIABLE_ENDPOINT_TYPES = new Set([
  "person",
  "external",
  "database",
  "queue",
  "cache",
  "storage",
]);

// Pathless nodes of these types are the ones worth calling out as skipped —
// they represent first-party code that *could* carry a path.
const CODE_NODE_TYPES = new Set(["service", "frontend", "gateway", "system"]);

// Minimum non-heuristic cross-boundary symbol edges before an undeclared
// dependency is reported.
const UNDECLARED_THRESHOLD = 3;

// Well-known SDK import specifiers -> tokens that mark a node as covering it.
// A specifier matches an import name exactly or as a path prefix ("pkg/sub").
const EXTERNAL_SDK_CATALOG = [
  { specifier: "pg", tokens: ["postgres", "pg"] },
  { specifier: "mysql2", tokens: ["mysql"] },
  { specifier: "mongodb", tokens: ["mongo"] },
  { specifier: "mongoose", tokens: ["mongo"] },
  { specifier: "redis", tokens: ["redis"] },
  { specifier: "ioredis", tokens: ["redis"] },
  { specifier: "@prisma/client", tokens: ["prisma", "postgres", "database"] },
  { specifier: "kafkajs", tokens: ["kafka"] },
  { specifier: "amqplib", tokens: ["rabbit", "amqp"] },
  { specifier: "bullmq", tokens: ["bull", "redis", "queue"] },
  { specifier: "stripe", tokens: ["stripe"] },
  { specifier: "twilio", tokens: ["twilio"] },
  { specifier: "@sendgrid/mail", tokens: ["sendgrid", "email"] },
  { specifier: "openai", tokens: ["openai"] },
  { specifier: "@anthropic-ai/sdk", tokens: ["anthropic", "claude"] },
  { specifier: "firebase-admin", tokens: ["firebase"] },
  { specifier: "@supabase/supabase-js", tokens: ["supabase"] },
  { specifier: "@aws-sdk/client-s3", tokens: ["s3", "aws"] },
  { specifier: "@aws-sdk/client-sqs", tokens: ["sqs", "aws"] },
  { specifier: "@aws-sdk/client-dynamodb", tokens: ["dynamo", "aws"] },
  { specifier: "@google-cloud/storage", tokens: ["gcs", "google cloud", "storage"] },
  { specifier: "@sentry/node", tokens: ["sentry"] },
  { specifier: "posthog-node", tokens: ["posthog"] },
  { specifier: "algoliasearch", tokens: ["algolia"] },
  { specifier: "@elastic/elasticsearch", tokens: ["elastic"] },
  // Python
  { specifier: "boto3", tokens: ["aws", "s3"] },
  { specifier: "psycopg2", tokens: ["postgres"] },
  { specifier: "pymongo", tokens: ["mongo"] },
  { specifier: "sqlalchemy", tokens: ["sql", "database"] },
  { specifier: "celery", tokens: ["celery", "queue"] },
  { specifier: "pika", tokens: ["rabbit", "amqp"] },
];

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

class Report {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.infos = [];
  }
  err(where, msg) {
    this.errors.push(`[error] ${where}: ${msg}`);
  }
  warn(where, msg) {
    this.warnings.push(`[warn]  ${where}: ${msg}`);
  }
  info(where, msg) {
    this.infos.push(`[info]  ${where}: ${msg}`);
  }
  print() {
    for (const i of this.infos) console.log(i);
    for (const w of this.warnings) console.warn(w);
    for (const e of this.errors) console.error(e);
  }
}

// ---------------------------------------------------------------------------
// DB access
// ---------------------------------------------------------------------------

function openDatabase(dbPath) {
  let db;
  try {
    db = new DatabaseSync(dbPath, { readOnly: true });
  } catch {
    // A read-only handle can fail while the WAL -shm sidecar is being created
    // by a concurrent writer; the default open still only runs SELECTs here.
    db = new DatabaseSync(dbPath);
  }
  db.exec("PRAGMA busy_timeout = 5000");
  return db;
}

function readSchemaVersion(db) {
  const row = db
    .prepare("SELECT MAX(version) AS v FROM schema_versions")
    .get();
  return typeof row?.v === "number" ? row.v : 0;
}

/** All queries the script runs, against an open handle. */
function queryCodegraph(db) {
  const files = new Set(
    db
      .prepare("SELECT path FROM files")
      .all()
      .map((r) => String(r.path)),
  );
  const lastIndexed =
    db.prepare("SELECT MAX(indexed_at) AS t FROM files").get()?.t ?? 0;
  const kindList = DEP_KINDS.map((k) => `'${k}'`).join(",");
  const matrixRows = db
    .prepare(
      `SELECT s.file_path AS src, t.file_path AS tgt, e.kind AS kind,
              COUNT(*) AS n,
              SUM(CASE WHEN e.provenance = 'heuristic' THEN 1 ELSE 0 END) AS heuristic_n
         FROM edges e
         JOIN nodes s ON s.id = e.source
         JOIN nodes t ON t.id = e.target
        WHERE e.kind IN (${kindList})
          AND s.file_path <> t.file_path
        GROUP BY s.file_path, t.file_path, e.kind`,
    )
    .all();
  const importNames = db
    .prepare(
      `SELECT DISTINCT name FROM nodes
        WHERE kind = 'import'
          AND name NOT LIKE './%'
          AND name NOT LIKE '../%'
          AND name NOT LIKE '/%'`,
    )
    .all()
    .map((r) => String(r.name));
  return { files, lastIndexed: Number(lastIndexed), matrixRows, importNames };
}

// ---------------------------------------------------------------------------
// Architecture loading (same traversal as validate.mjs, tolerant)
// ---------------------------------------------------------------------------

async function loadJson(path) {
  const raw = await readFile(path, "utf8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON in ${path}: ${e.message}`);
  }
}

async function loadArchitecture(archDir) {
  const manifest = await loadJson(join(archDir, "manifest.json"));
  const slugs = Array.isArray(manifest.diagrams) ? manifest.diagrams : [];
  const diagrams = [];
  for (const slug of slugs) {
    if (typeof slug !== "string") continue;
    const path = join(archDir, "diagrams", `${slug}.json`);
    if (!existsSync(path)) continue; // validate.mjs owns shape errors
    const diagram = await loadJson(path);
    diagrams.push({ slug, diagram });
  }
  return { manifest, diagrams };
}

// ---------------------------------------------------------------------------
// Prefix mapping
// ---------------------------------------------------------------------------

const stripPrefix = (p) => String(p).replace(/\/+$/, "");

/** file belongs to prefix when equal or nested under it. */
function fileMatchesPrefix(file, prefix) {
  return file === prefix || file.startsWith(`${prefix}/`);
}

/** Longest-prefix owner of a file among path-bearing nodes; null when none. */
function mapFileToNode(file, prefixes) {
  let best = null;
  for (const entry of prefixes) {
    if (!fileMatchesPrefix(file, entry.prefix)) continue;
    if (!best || entry.prefix.length > best.prefix.length) best = entry;
  }
  return best;
}

/** Parent/child prefixes describe containment, not dependency. */
function prefixesNest(a, b) {
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}

// ---------------------------------------------------------------------------
// Core analysis — pure, testable: inputs in, findings out
// ---------------------------------------------------------------------------

function analyze({ architecture, codegraph, repoRoot, fileExists }) {
  const findings = [];
  const counters = {
    nodesChecked: 0,
    edgesChecked: 0,
    nodesSkipped: 0,
    edgesSkipped: 0,
  };

  const flatNodes = [];
  for (const { slug, diagram } of architecture.diagrams) {
    for (const node of diagram.nodes ?? []) {
      flatNodes.push({ ...node, diagramId: slug });
    }
  }

  // (a) node paths resolve in the index (or at least on disk); (e) pathless
  // first-party code nodes are reported as unverifiable.
  for (const node of flatNodes) {
    const type = node.meta?.type;
    if (!node.path) {
      counters.nodesSkipped += 1;
      if (CODE_NODE_TYPES.has(type)) {
        findings.push({
          kind: "skipped-node",
          severity: "info",
          message: `node has no path — not verifiable against the index`,
          diagramId: node.diagramId,
          nodeId: node.id,
        });
      }
      continue;
    }
    counters.nodesChecked += 1;
    const prefix = stripPrefix(node.path);
    let indexed = false;
    for (const file of codegraph.files) {
      if (fileMatchesPrefix(file, prefix)) {
        indexed = true;
        break;
      }
    }
    if (indexed) continue;
    if (fileExists(join(repoRoot, node.path))) {
      findings.push({
        kind: "skipped-node",
        severity: "info",
        message: `path "${node.path}" exists on disk but has no indexed files (non-code artifact?)`,
        diagramId: node.diagramId,
        nodeId: node.id,
      });
    } else {
      findings.push({
        kind: "missing-path",
        severity: "error",
        message: `path "${node.path}" matches no indexed file and does not exist on disk`,
        diagramId: node.diagramId,
        nodeId: node.id,
      });
    }
  }

  // Per-diagram node-pair dependency matrix from the file-level matrix.
  for (const { slug, diagram } of architecture.diagrams) {
    const nodes = diagram.nodes ?? [];
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const prefixes = nodes
      .filter((n) => typeof n.path === "string" && n.path.length > 0)
      .map((n) => ({ nodeId: n.id, prefix: stripPrefix(n.path) }));

    // pairKey -> { kinds, heuristic, total, files }
    const matrix = new Map();
    for (const row of codegraph.matrixRows) {
      const src = mapFileToNode(String(row.src), prefixes);
      const tgt = mapFileToNode(String(row.tgt), prefixes);
      if (!src || !tgt || src.nodeId === tgt.nodeId) continue;
      if (prefixesNest(src.prefix, tgt.prefix)) continue;
      const key = `${src.nodeId} ${tgt.nodeId}`;
      let cell = matrix.get(key);
      if (!cell) {
        cell = { kinds: {}, heuristic: 0, total: 0, files: new Set() };
        matrix.set(key, cell);
      }
      const n = Number(row.n) || 0;
      cell.kinds[row.kind] = (cell.kinds[row.kind] ?? 0) + n;
      cell.heuristic += Number(row.heuristic_n) || 0;
      cell.total += n;
      if (cell.files.size < 5) cell.files.add(String(row.src));
      if (cell.files.size < 5) cell.files.add(String(row.tgt));
    }

    // (b) declared edges are supported by symbol edges.
    const declaredPairs = new Set();
    for (const edge of diagram.edges ?? []) {
      const source = byId.get(edge.source);
      const target = byId.get(edge.target);
      if (!source || !target) continue; // validate.mjs owns reference errors
      declaredPairs.add(`${edge.source} ${edge.target}`);
      declaredPairs.add(`${edge.target} ${edge.source}`);

      const edgeType = edge.meta?.type;
      const edgeRef = {
        diagramId: slug,
        sourceId: edge.source,
        targetId: edge.target,
        ...(edgeType ? { type: edgeType } : {}),
      };
      const unverifiable =
        !source.path ||
        !target.path ||
        UNVERIFIABLE_ENDPOINT_TYPES.has(source.meta?.type) ||
        UNVERIFIABLE_ENDPOINT_TYPES.has(target.meta?.type);
      if (unverifiable) {
        counters.edgesSkipped += 1;
        findings.push({
          kind: "skipped-edge",
          severity: "info",
          message: `edge ${edge.source} -> ${edge.target}${edgeType ? ` (${edgeType})` : ""} is not statically verifiable (person/external/datastore endpoint or missing path)`,
          edge: edgeRef,
        });
        continue;
      }

      counters.edgesChecked += 1;
      const cell = matrix.get(`${edge.source} ${edge.target}`);
      const accepted = EDGE_SUPPORT[edgeType];
      const supported = cell
        ? Object.entries(cell.kinds).some(
            ([kind, n]) => n > 0 && (!accepted || accepted.has(kind)),
          )
        : false;
      if (!supported) {
        findings.push({
          kind: "unverified-edge",
          severity: "warn",
          message: `no CodeGraph symbol edges support ${edge.source} -> ${edge.target}${edgeType ? ` (${edgeType})` : ""} — possible causes: runtime/HTTP boundary, config-driven wiring, or stale index`,
          edge: edgeRef,
          ...(cell
            ? { evidence: { edgeKinds: cell.kinds, heuristicCount: cell.heuristic } }
            : {}),
        });
      }
    }

    // (c) strong couplings with no declared edge in either direction.
    for (const [key, cell] of matrix) {
      const [sourceId, targetId] = key.split(" ");
      if (declaredPairs.has(key)) continue;
      const nonHeuristic = cell.total - cell.heuristic;
      if (nonHeuristic < UNDECLARED_THRESHOLD) continue;
      findings.push({
        kind: "undeclared-dependency",
        severity: "warn",
        message: `${nonHeuristic} symbol edge(s) cross ${sourceId} -> ${targetId} but the diagram declares no edge between them`,
        edge: { diagramId: slug, sourceId, targetId },
        evidence: {
          edgeKinds: cell.kinds,
          heuristicCount: cell.heuristic,
          files: [...cell.files].slice(0, 5),
        },
      });
    }
  }

  // (d) well-known external SDKs with no covering node.
  const nodeText = flatNodes
    .map((n) =>
      [n.id, n.label, n.meta?.technology]
        .filter((v) => typeof v === "string")
        .join(" ")
        .toLowerCase(),
    )
    .join("\n");
  const seenPackages = new Set();
  for (const entry of EXTERNAL_SDK_CATALOG) {
    if (seenPackages.has(entry.specifier)) continue;
    const imported = codegraph.importNames.some(
      (name) =>
        name === entry.specifier || name.startsWith(`${entry.specifier}/`),
    );
    if (!imported) continue;
    const mapped = entry.tokens.some((t) => nodeText.includes(t));
    if (mapped) continue;
    seenPackages.add(entry.specifier);
    findings.push({
      kind: "unmapped-external",
      severity: "info",
      message: `package "${entry.specifier}" is imported by the code but no node's id/label/technology mentions it`,
      evidence: { package: entry.specifier },
    });
  }

  return { findings, counters };
}

/** True when any node-referenced path changed on disk after the last index. */
function detectStaleIndex(architecture, repoRoot, lastIndexed, statFn) {
  if (!lastIndexed) return false;
  const seen = new Set();
  for (const { diagram } of architecture.diagrams) {
    for (const node of diagram.nodes ?? []) {
      if (!node.path || seen.has(node.path)) continue;
      seen.add(node.path);
      try {
        const s = statFn(join(repoRoot, node.path));
        if (s.mtimeMs > lastIndexed) return true;
      } catch {
        // missing paths are reported elsewhere
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Drift report assembly + no-op write guard
// ---------------------------------------------------------------------------

function buildDriftReport({ findings, counters, schemaVersion, staleIndex, skillVersion }) {
  const severityCount = (severity) =>
    findings.filter((f) => f.severity === severity).length;
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    generator: {
      name: "architecture-docs/evidence.mjs",
      ...(skillVersion ? { skillVersion } : {}),
    },
    codegraphSchemaVersion: schemaVersion,
    staleIndex,
    summary: {
      errors: severityCount("error"),
      warns: severityCount("warn"),
      infos: severityCount("info"),
      ...counters,
    },
    findings,
  };
}

/** Compare two reports ignoring volatile fields (generatedAt, skillVersion). */
function reportsEquivalent(a, b) {
  if (!a || !b) return false;
  const mask = (r) => ({ ...r, generatedAt: "", generator: { name: r.generator?.name } });
  return JSON.stringify(mask(a)) === JSON.stringify(mask(b));
}

/** Write drift.json unless an equivalent report is already on disk. */
async function writeDriftReport(archDir, report) {
  const dir = join(archDir, ".tecture");
  const path = join(dir, "drift.json");
  let existing = null;
  try {
    existing = JSON.parse(await readFile(path, "utf8"));
  } catch {
    // absent or malformed — write fresh
  }
  if (reportsEquivalent(existing, report)) {
    return { path, written: false };
  }
  await mkdir(dir, { recursive: true });
  const tmp = `${path}.tmp`;
  await writeFile(tmp, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await rename(tmp, path);
  return { path, written: true };
}

async function readSkillVersion(scriptDir) {
  // Installed copies carry .tecture.json at the skill root with the version.
  try {
    const manifest = JSON.parse(
      await readFile(join(dirname(scriptDir), ".tecture.json"), "utf8"),
    );
    return typeof manifest.version === "string" ? manifest.version : undefined;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function runEvidence({ archDir, repoRoot, db, report, strict }) {
  const schemaVersion = readSchemaVersion(db);
  if (schemaVersion < MIN_SCHEMA_VERSION) {
    report.err(
      "codegraph",
      `index schema v${schemaVersion} is too old (need >= ${MIN_SCHEMA_VERSION}). Update CodeGraph and rebuild: npm install -g @colbymchenry/codegraph@latest && codegraph index`,
    );
    return { exitCode: 1 };
  }
  if (schemaVersion > KNOWN_SCHEMA_VERSION) {
    report.warn(
      "codegraph",
      `index schema v${schemaVersion} is newer than this script knows (v${KNOWN_SCHEMA_VERSION}) — proceeding best-effort`,
    );
  }

  const architecture = await loadArchitecture(archDir);
  let codegraph;
  try {
    codegraph = queryCodegraph(db);
  } catch (err) {
    report.err(
      "codegraph",
      `query failed against schema v${schemaVersion} (${err.message}). Update @tecture/skill, or rebuild the index: codegraph index`,
    );
    return { exitCode: 1 };
  }

  const { findings, counters } = analyze({
    architecture,
    codegraph,
    repoRoot,
    fileExists: (p) => existsSync(p),
  });
  const staleIndex = detectStaleIndex(
    architecture,
    repoRoot,
    codegraph.lastIndexed,
    (p) => statSync(p),
  );

  for (const f of findings) {
    const where = f.nodeId
      ? `${f.diagramId ?? "?"}#${f.nodeId}`
      : f.edge
        ? `${f.edge.diagramId}#${f.edge.sourceId}->${f.edge.targetId}`
        : "architecture";
    report[f.severity === "error" ? "err" : f.severity === "warn" ? "warn" : "info"](
      where,
      f.message,
    );
  }
  if (staleIndex) {
    report.warn(
      "codegraph",
      "index may be stale — node-referenced files changed after the last index; run `codegraph sync` and re-run this script",
    );
  }

  const skillVersion = await readSkillVersion(
    dirname(fileURLToPath(import.meta.url)),
  );
  const drift = buildDriftReport({
    findings,
    counters,
    schemaVersion,
    staleIndex,
    skillVersion,
  });
  const { path, written } = await writeDriftReport(archDir, drift);

  const exitCode = strict && drift.summary.errors > 0 ? 1 : 0;
  return { exitCode, drift, written, path };
}

function printOutcome({ drift, written, path }) {
  const { errors, warns, infos, nodesChecked, edgesChecked, nodesSkipped, edgesSkipped } =
    drift.summary;
  console.log(
    written
      ? `Drift report written to ${path}`
      : `Drift report unchanged (${path})`,
  );
  console.log(
    `${errors === 0 ? "OK" : "DRIFT"} — ${errors} error(s), ${warns} warning(s), ${infos} info(s); ` +
      `${nodesChecked} node(s) + ${edgesChecked} edge(s) checked, ` +
      `${nodesSkipped} node(s) + ${edgesSkipped} edge(s) not statically verifiable`,
  );
}

// ---------------------------------------------------------------------------
// Self-test — fully self-contained: in-memory DB + temp mini-architecture.
// The bundled reference/example has no `path` fields, so it cannot exercise
// this pipeline; this fixture can.
// ---------------------------------------------------------------------------

const SELF_TEST_DDL = `
  CREATE TABLE schema_versions (version INTEGER NOT NULL, applied_at INTEGER);
  CREATE TABLE nodes (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL
  );
  CREATE TABLE edges (
    id INTEGER PRIMARY KEY,
    source TEXT NOT NULL,
    target TEXT NOT NULL,
    kind TEXT NOT NULL,
    line INTEGER,
    col INTEGER,
    provenance TEXT
  );
  CREATE TABLE files (path TEXT PRIMARY KEY, indexed_at INTEGER NOT NULL);
`;

function buildSelfTestDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(SELF_TEST_DDL);
  db.exec("INSERT INTO schema_versions (version) VALUES (7)");
  const now = Date.now();
  const insertFile = db.prepare("INSERT INTO files (path, indexed_at) VALUES (?, ?)");
  for (const f of [
    "src/api/a.ts",
    "src/api/inner/x.ts",
    "src/db/d.ts",
    "src/worker/w.ts",
  ]) {
    insertFile.run(f, now);
  }
  const insertNode = db.prepare(
    "INSERT INTO nodes (id, kind, name, file_path) VALUES (?, ?, ?, ?)",
  );
  insertNode.run("n_a", "function", "handleRequest", "src/api/a.ts");
  insertNode.run("n_i", "function", "innerHelper", "src/api/inner/x.ts");
  insertNode.run("n_d", "function", "queryDb", "src/db/d.ts");
  insertNode.run("n_w", "function", "runJob", "src/worker/w.ts");
  insertNode.run("imp_pg", "import", "pg", "src/db/d.ts");
  insertNode.run("imp_stripe", "import", "stripe", "src/api/a.ts");
  const insertEdge = db.prepare(
    "INSERT INTO edges (source, target, kind, line, provenance) VALUES (?, ?, ?, ?, ?)",
  );
  // api -> db-layer: 3 non-heuristic edges, but NO declared edge => undeclared.
  insertEdge.run("n_a", "n_d", "calls", 1, null);
  insertEdge.run("n_a", "n_d", "calls", 2, null);
  insertEdge.run("n_a", "n_d", "imports", 1, null);
  // worker -> db-layer: 1 edge, declared => verified.
  insertEdge.run("n_w", "n_d", "calls", 5, null);
  // api-inner -> api: nested prefixes => never an undeclared finding.
  insertEdge.run("n_i", "n_a", "calls", 1, null);
  insertEdge.run("n_i", "n_a", "calls", 2, null);
  insertEdge.run("n_i", "n_a", "calls", 3, null);
  return db;
}

const SELF_TEST_DIAGRAM = {
  name: "Containers",
  level: 2,
  nodes: [
    { id: "api", label: "API", path: "src/api/", meta: { type: "service" } },
    { id: "api-inner", label: "API Inner", path: "src/api/inner/", meta: { type: "service" } },
    { id: "worker", label: "Worker", path: "src/worker/", meta: { type: "service" } },
    { id: "db-layer", label: "DB Layer", path: "src/db/", meta: { type: "service" } },
    { id: "gone", label: "Gone", path: "src/gone/", meta: { type: "service" } },
    { id: "pg-db", label: "PostgreSQL", meta: { type: "database", technology: "postgresql" } },
  ],
  edges: [
    { id: "e-api-worker", source: "api", target: "worker", meta: { type: "calls" } },
    { id: "e-worker-db", source: "worker", target: "db-layer", meta: { type: "calls" } },
    { id: "e-api-pg", source: "api", target: "pg-db", meta: { type: "reads" } },
  ],
};

async function selfTest() {
  const tmp = await mkdtemp(join(tmpdir(), "tecture-evidence-selftest-"));
  try {
    const archDir = join(tmp, "architecture");
    await mkdir(join(archDir, "diagrams"), { recursive: true });
    await writeFile(
      join(archDir, "manifest.json"),
      JSON.stringify({
        name: "Self Test",
        topDiagram: "containers",
        diagrams: ["containers"],
      }),
    );
    await writeFile(
      join(archDir, "diagrams", "containers.json"),
      JSON.stringify(SELF_TEST_DIAGRAM),
    );

    // Schema gate: v1 rejected, v2 accepted.
    {
      const old = new DatabaseSync(":memory:");
      old.exec(SELF_TEST_DDL);
      old.exec("INSERT INTO schema_versions (version) VALUES (1)");
      assert.equal(readSchemaVersion(old), 1);
      assert.ok(readSchemaVersion(old) < MIN_SCHEMA_VERSION, "v1 must be rejected");
      old.exec("INSERT INTO schema_versions (version) VALUES (2)");
      assert.ok(readSchemaVersion(old) >= MIN_SCHEMA_VERSION, "v2 must be accepted");
      old.close();
    }

    const db = buildSelfTestDb();
    const report = new Report();
    const first = await runEvidence({
      archDir,
      repoRoot: tmp,
      db,
      report,
      strict: false,
    });
    assert.equal(first.exitCode, 0, "advisory run exits 0 despite findings");
    assert.ok(first.written, "first run writes drift.json");

    const byKind = new Map();
    for (const f of first.drift.findings) {
      byKind.set(f.kind, (byKind.get(f.kind) ?? 0) + 1);
    }
    assert.equal(byKind.get("missing-path"), 1, "one missing-path (gone)");
    assert.equal(byKind.get("unverified-edge"), 1, "one unverified-edge (api->worker)");
    assert.equal(
      byKind.get("undeclared-dependency"),
      1,
      "one undeclared-dependency (api->db-layer; nested api-inner->api excluded)",
    );
    assert.equal(byKind.get("unmapped-external"), 1, "one unmapped-external (stripe)");
    assert.equal(byKind.get("skipped-edge"), 1, "one skipped-edge (api->pg-db reads)");
    assert.equal(byKind.get("skipped-node") ?? 0, 0, "no skipped-node findings");
    assert.equal(first.drift.findings.length, 5, "exactly five findings");
    assert.equal(first.drift.summary.errors, 1);
    assert.equal(first.drift.summary.warns, 2);

    // pg import is mapped by the PostgreSQL node -> no finding for "pg".
    assert.ok(
      !first.drift.findings.some(
        (f) => f.kind === "unmapped-external" && f.evidence?.package === "pg",
      ),
      "pg is covered by the PostgreSQL node",
    );

    // --strict turns the error finding into exit 1.
    const strictRun = await runEvidence({
      archDir,
      repoRoot: tmp,
      db,
      report: new Report(),
      strict: true,
    });
    assert.equal(strictRun.exitCode, 1, "--strict fails on error findings");

    // No-op guard: unchanged findings leave the file byte-identical.
    const before = await readFile(join(archDir, ".tecture", "drift.json"), "utf8");
    const second = await runEvidence({
      archDir,
      repoRoot: tmp,
      db,
      report: new Report(),
      strict: false,
    });
    assert.equal(second.written, false, "second run skips the write");
    const after = await readFile(join(archDir, ".tecture", "drift.json"), "utf8");
    assert.equal(before, after, "drift.json is byte-identical after a no-op run");

    db.close();
    console.log("evidence.mjs self-test: OK (all assertions passed)");
    return 0;
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { archDir: "architecture", db: null, strict: false, selfTest: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--db") {
      const next = argv[++i];
      if (!next) throw new Error("Missing value for --db");
      opts.db = next;
    } else if (arg === "--strict") {
      opts.strict = true;
    } else if (arg === "--self-test") {
      opts.selfTest = true;
    } else if (arg === "-h" || arg === "--help") {
      opts.help = true;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      opts.archDir = arg;
    }
  }
  return opts;
}

const USAGE = `evidence.mjs — verify a Tecture architecture against the CodeGraph index

Usage:
  node evidence.mjs [path/to/architecture] [--db <path>] [--strict] [--self-test]

Requires a CodeGraph index (.codegraph/codegraph.db at the repo root — the
parent of the architecture directory). Run \`npx @tecture/install\` or
\`codegraph init\` first. Writes <architecture>/.tecture/drift.json unless the
findings are unchanged.`;

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(USAGE);
    return;
  }
  if (opts.selfTest) {
    process.exit(await selfTest());
  }

  const archDir = resolve(opts.archDir);
  if (!existsSync(join(archDir, "manifest.json"))) {
    console.error(`[error] no architecture at ${archDir} (manifest.json missing)`);
    process.exit(1);
  }
  const repoRoot = dirname(archDir);
  const dbPath = opts.db
    ? resolve(opts.db)
    : join(repoRoot, ".codegraph", "codegraph.db");
  if (!existsSync(dbPath)) {
    console.error(`[error] no CodeGraph index at ${dbPath}`);
    console.error("        Run: npx @tecture/install   (or: codegraph init)");
    process.exit(1);
  }

  const db = openDatabase(dbPath);
  const report = new Report();
  try {
    const result = await runEvidence({
      archDir,
      repoRoot,
      db,
      report,
      strict: opts.strict,
    });
    report.print();
    if (result.drift) printOutcome(result);
    process.exit(result.exitCode);
  } finally {
    db.close();
  }
}

main().catch((e) => {
  console.error(`[internal error] ${e?.stack ?? e}`);
  process.exit(2);
});
