import { describe, expect, it } from "vitest";
import { driftForNode, parseDriftReport, type DriftReport } from "../src/index";

function validReport(): DriftReport {
  return {
    version: 1,
    generatedAt: "2026-07-06T00:00:00.000Z",
    generator: { name: "evidence.mjs", skillVersion: "0.3.0" },
    codegraphSchemaVersion: 6,
    staleIndex: false,
    summary: {
      errors: 1,
      warns: 2,
      infos: 1,
      nodesChecked: 4,
      edgesChecked: 3,
      nodesSkipped: 1,
      edgesSkipped: 1,
    },
    findings: [
      {
        kind: "missing-path",
        severity: "error",
        message: "node path src/gone/ matches no file",
        diagramId: "containers",
        nodeId: "gone-service",
      },
      {
        kind: "unverified-edge",
        severity: "warn",
        message: "no symbol edges support api -> worker",
        edge: {
          diagramId: "containers",
          sourceId: "api",
          targetId: "worker",
          type: "calls",
        },
      },
      {
        kind: "undeclared-dependency",
        severity: "warn",
        message: "12 symbol edges cross api -> db-layer with no declared edge",
        edge: { diagramId: "components", sourceId: "api", targetId: "db-layer" },
        evidence: { edgeKinds: { imports: 8, calls: 4 }, heuristicCount: 0 },
      },
      {
        kind: "unmapped-external",
        severity: "info",
        message: "package stripe imported but no matching node",
        evidence: { package: "stripe" },
      },
    ],
  };
}

describe("parseDriftReport", () => {
  it("round-trips a valid report", () => {
    const report = validReport();
    expect(parseDriftReport(report)).toBe(report);
  });

  it("returns null for junk values", () => {
    expect(parseDriftReport("x")).toBeNull();
    expect(parseDriftReport(42)).toBeNull();
    expect(parseDriftReport(null)).toBeNull();
    expect(parseDriftReport(undefined)).toBeNull();
    expect(parseDriftReport({})).toBeNull();
    expect(parseDriftReport([])).toBeNull();
  });

  it("returns null for an unknown version", () => {
    expect(parseDriftReport({ ...validReport(), version: 2 })).toBeNull();
    expect(parseDriftReport({ ...validReport(), version: "1" })).toBeNull();
  });

  it("returns null when findings are missing or malformed", () => {
    const { findings: _findings, ...noFindings } = validReport();
    expect(parseDriftReport(noFindings)).toBeNull();
    expect(
      parseDriftReport({ ...validReport(), findings: [{ kind: "nope" }] }),
    ).toBeNull();
    expect(
      parseDriftReport({
        ...validReport(),
        findings: [{ kind: "missing-path", severity: "fatal", message: "x" }],
      }),
    ).toBeNull();
  });

  it("returns null when summary or schema version are missing", () => {
    const { summary: _summary, ...noSummary } = validReport();
    expect(parseDriftReport(noSummary)).toBeNull();
    const { codegraphSchemaVersion: _v, ...noVersion } = validReport();
    expect(parseDriftReport(noVersion)).toBeNull();
  });
});

describe("driftForNode", () => {
  it("matches findings by nodeId", () => {
    const hits = driftForNode(validReport(), "containers", "gone-service");
    expect(hits).toHaveLength(1);
    expect(hits[0]?.kind).toBe("missing-path");
  });

  it("matches findings where the node is an edge endpoint", () => {
    const asSource = driftForNode(validReport(), "containers", "api");
    expect(asSource).toHaveLength(1);
    expect(asSource[0]?.kind).toBe("unverified-edge");

    const asTarget = driftForNode(validReport(), "containers", "worker");
    expect(asTarget).toHaveLength(1);
    expect(asTarget[0]?.kind).toBe("unverified-edge");
  });

  it("does not match edge findings from another diagram", () => {
    const hits = driftForNode(validReport(), "system-context", "api");
    expect(hits).toHaveLength(0);
  });

  it("returns an empty list when nothing matches", () => {
    expect(driftForNode(validReport(), "containers", "unrelated")).toEqual([]);
    const empty = { ...validReport(), findings: [] };
    expect(driftForNode(empty, "containers", "api")).toEqual([]);
  });
});
