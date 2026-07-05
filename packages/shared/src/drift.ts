import type { EdgeMetaType } from "./index";

/**
 * Drift report — the output of the architecture-docs skill's `scripts/evidence.mjs`,
 * which verifies the architecture files against the repo's CodeGraph index
 * (`.codegraph/codegraph.db`). Written to `architecture/.tecture/drift.json` and
 * served by the viewer at `GET /api/architecture/drift`.
 *
 * evidence.mjs cannot import this package (it is a zero-dependency script bundled
 * inside the skill), so it mirrors these field names exactly — change them in
 * lockstep with `.claude/skills/architecture-docs/scripts/evidence.mjs`.
 */

export type DriftSeverity = "error" | "warn" | "info";

export type DriftFindingKind =
  /** node.path resolves neither on disk nor in the CodeGraph index */
  | "missing-path"
  /** declared edge with no supporting symbol edges crossing the two nodes' paths */
  | "unverified-edge"
  /** strong symbol coupling between two nodes with no declared edge */
  | "undeclared-dependency"
  /** well-known external SDK imported by the code but no matching node */
  | "unmapped-external"
  /** node without a path — not statically verifiable */
  | "skipped-node"
  /** edge that cannot be statically verified (datastore/queue/external endpoint) */
  | "skipped-edge";

export interface DriftEdgeRef {
  diagramId: string;
  sourceId: string;
  targetId: string;
  type?: EdgeMetaType;
}

export interface DriftEvidence {
  /** CodeGraph edge kind → count of symbol edges crossing the two nodes' path prefixes */
  edgeKinds?: Record<string, number>;
  /** How many of those edges were heuristic (synthesized dynamic-dispatch bridges) */
  heuristicCount?: number;
  /** Sample of involved repo-root-relative file paths (capped at 5) */
  files?: string[];
  /** Module specifier, for unmapped-external findings */
  package?: string;
}

export interface DriftFinding {
  kind: DriftFindingKind;
  severity: DriftSeverity;
  message: string;
  diagramId?: string;
  nodeId?: string;
  edge?: DriftEdgeRef;
  evidence?: DriftEvidence;
}

export interface DriftReport {
  /** Forward-compat gate — consumers must treat an unknown version as no report. */
  version: 1;
  /** ISO 8601 timestamp of the generating run. */
  generatedAt: string;
  generator: { name: string; skillVersion?: string };
  /** Live `schema_versions` value of the CodeGraph database that was read. */
  codegraphSchemaVersion: number;
  /** True when node-referenced files changed on disk after the last index. */
  staleIndex: boolean;
  summary: {
    errors: number;
    warns: number;
    infos: number;
    nodesChecked: number;
    edgesChecked: number;
    nodesSkipped: number;
    edgesSkipped: number;
  };
  findings: DriftFinding[];
}

const DRIFT_SEVERITIES: readonly string[] = ["error", "warn", "info"];

const DRIFT_KINDS: readonly string[] = [
  "missing-path",
  "unverified-edge",
  "undeclared-dependency",
  "unmapped-external",
  "skipped-node",
  "skipped-edge",
];

function isValidFinding(v: unknown): v is DriftFinding {
  if (!v || typeof v !== "object") return false;
  const f = v as Record<string, unknown>;
  return (
    typeof f.kind === "string" &&
    DRIFT_KINDS.includes(f.kind) &&
    typeof f.severity === "string" &&
    DRIFT_SEVERITIES.includes(f.severity) &&
    typeof f.message === "string"
  );
}

/**
 * Tolerant structural guard for a drift.json read from disk or the wire.
 * Returns null for anything unusable (wrong version, junk, malformed findings)
 * — a corrupt generated file must never break the viewer.
 */
export function parseDriftReport(value: unknown): DriftReport | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Record<string, unknown>;
  if (r.version !== 1) return null;
  if (typeof r.generatedAt !== "string") return null;
  if (!Array.isArray(r.findings)) return null;
  if (!r.findings.every(isValidFinding)) return null;
  if (!r.summary || typeof r.summary !== "object") return null;
  if (typeof r.codegraphSchemaVersion !== "number") return null;
  return value as DriftReport;
}

/**
 * Findings touching a node in a diagram: direct nodeId match, or the node is an
 * endpoint of a finding's edge in the same diagram. Diagram-less findings only
 * match by nodeId (node ids are globally unique across diagrams).
 */
export function driftForNode(
  report: DriftReport,
  diagramId: string,
  nodeId: string,
): DriftFinding[] {
  return report.findings.filter((f) => {
    if (f.nodeId === nodeId && (f.diagramId === undefined || f.diagramId === diagramId)) {
      return true;
    }
    return (
      f.edge !== undefined &&
      f.edge.diagramId === diagramId &&
      (f.edge.sourceId === nodeId || f.edge.targetId === nodeId)
    );
  });
}
