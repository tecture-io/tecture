import { describe, expect, it } from "vitest";
import {
  type ArchitectureDataSource,
  DescriptionNotFoundError,
  DiagramNotFoundError,
  LayoutInvalidError,
  NodeNotFoundError,
  SLUG_RE,
  buildArchitectureSummary,
  buildSourceUrl,
  emptyLayout,
  findNode,
  isFiniteNumber,
  isValidLayoutEntry,
  normalizeLayoutUpdate,
} from "../src/index";
import type { DiagramFile, ManifestFile } from "../src/index";

function makeSource(
  manifest: ManifestFile,
  diagrams: Record<string, DiagramFile>,
  descriptions: Record<string, string> = {},
): ArchitectureDataSource {
  return {
    async loadManifest() {
      return manifest;
    },
    async loadDiagram(slug) {
      const d = diagrams[slug];
      if (!d) throw new DiagramNotFoundError(slug);
      return d;
    },
    async loadDescription(id) {
      const md = descriptions[id];
      if (md === undefined) throw new DescriptionNotFoundError(id);
      return md;
    },
  };
}

describe("SLUG_RE", () => {
  it("accepts lowercase-hyphen ids", () => {
    expect(SLUG_RE.test("system-overview")).toBe(true);
    expect(SLUG_RE.test("a")).toBe(true);
    expect(SLUG_RE.test("a1-b2-c3")).toBe(true);
  });

  it("rejects uppercase, underscores, leading/trailing hyphens, and path segments", () => {
    expect(SLUG_RE.test("System-Overview")).toBe(false);
    expect(SLUG_RE.test("foo_bar")).toBe(false);
    expect(SLUG_RE.test("-foo")).toBe(false);
    expect(SLUG_RE.test("foo-")).toBe(false);
    expect(SLUG_RE.test("foo/bar")).toBe(false);
    expect(SLUG_RE.test("../etc")).toBe(false);
    expect(SLUG_RE.test("")).toBe(false);
  });
});

describe("isFiniteNumber / isValidLayoutEntry", () => {
  it("isFiniteNumber rejects non-finite values", () => {
    expect(isFiniteNumber(0)).toBe(true);
    expect(isFiniteNumber(1.5)).toBe(true);
    expect(isFiniteNumber(Number.NaN)).toBe(false);
    expect(isFiniteNumber(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isFiniteNumber(Number.NEGATIVE_INFINITY)).toBe(false);
    expect(isFiniteNumber("0")).toBe(false);
    expect(isFiniteNumber(undefined)).toBe(false);
    expect(isFiniteNumber(null)).toBe(false);
  });

  it("isValidLayoutEntry accepts minimal x/y entry", () => {
    expect(isValidLayoutEntry({ x: 0, y: 0 })).toBe(true);
  });

  it("isValidLayoutEntry accepts optional finite width/height", () => {
    expect(isValidLayoutEntry({ x: 1, y: 2, width: 100, height: 50 })).toBe(true);
    expect(isValidLayoutEntry({ x: 1, y: 2, width: undefined })).toBe(true);
  });

  it("isValidLayoutEntry rejects missing or non-finite coords", () => {
    expect(isValidLayoutEntry({ x: 0 })).toBe(false);
    expect(isValidLayoutEntry({ x: Number.NaN, y: 0 })).toBe(false);
    expect(isValidLayoutEntry({ x: 0, y: Number.POSITIVE_INFINITY })).toBe(false);
    expect(isValidLayoutEntry(null)).toBe(false);
    expect(isValidLayoutEntry("nope")).toBe(false);
  });

  it("isValidLayoutEntry rejects non-finite width/height when provided", () => {
    expect(isValidLayoutEntry({ x: 0, y: 0, width: Number.NaN })).toBe(false);
    expect(isValidLayoutEntry({ x: 0, y: 0, height: "tall" })).toBe(false);
  });
});

describe("emptyLayout", () => {
  it("returns an empty layout with the slug attached", () => {
    const layout = emptyLayout("some-diagram");
    expect(layout).toEqual({
      version: 1,
      diagramId: "some-diagram",
      updatedAt: "",
      nodes: {},
    });
  });
});

describe("normalizeLayoutUpdate", () => {
  it("normalizes a valid update and stamps updatedAt", () => {
    const before = Date.now();
    const result = normalizeLayoutUpdate("system-overview", {
      nodes: {
        api: { x: 10, y: 20, width: 200, height: 60 },
        "web-app": { x: 0, y: 0 },
      },
    });
    const after = Date.now();

    expect(result.version).toBe(1);
    expect(result.diagramId).toBe("system-overview");
    expect(result.nodes).toEqual({
      api: { x: 10, y: 20, width: 200, height: 60 },
      "web-app": { x: 0, y: 0 },
    });
    const ts = Date.parse(result.updatedAt);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("strips undefined width/height rather than emitting them as undefined", () => {
    const result = normalizeLayoutUpdate("d", {
      nodes: { a: { x: 1, y: 2 } },
    });
    expect(result.nodes.a).toEqual({ x: 1, y: 2 });
    expect(Object.prototype.hasOwnProperty.call(result.nodes.a, "width")).toBe(false);
  });

  it("rejects invalid slugs", () => {
    expect(() =>
      normalizeLayoutUpdate("Bad/Slug", { nodes: {} }),
    ).toThrow(LayoutInvalidError);
  });

  it("rejects invalid bodies", () => {
    // @ts-expect-error intentional null body
    expect(() => normalizeLayoutUpdate("a", null)).toThrow(LayoutInvalidError);
    // @ts-expect-error missing nodes
    expect(() => normalizeLayoutUpdate("a", {})).toThrow(LayoutInvalidError);
    expect(() =>
      // @ts-expect-error wrong nodes type
      normalizeLayoutUpdate("a", { nodes: "nope" }),
    ).toThrow(LayoutInvalidError);
  });

  it("rejects invalid node ids", () => {
    expect(() =>
      normalizeLayoutUpdate("a", { nodes: { "Bad Id": { x: 0, y: 0 } } }),
    ).toThrow(LayoutInvalidError);
  });

  it("rejects invalid layout entries", () => {
    expect(() =>
      normalizeLayoutUpdate("a", {
        nodes: { good: { x: Number.NaN, y: 0 } },
      }),
    ).toThrow(LayoutInvalidError);
  });
});

describe("buildArchitectureSummary", () => {
  it("aggregates manifest + per-diagram counts", async () => {
    const source = makeSource(
      {
        name: "Sample",
        description: "desc",
        source: "https://github.com/foo/bar",
        sourceHost: "github",
        topDiagram: "a",
        diagrams: ["a", "b"],
      },
      {
        a: { name: "A", level: 1, nodes: [{ id: "n1", label: "n1" }], edges: [] },
        b: {
          name: "B",
          level: 2,
          nodes: [
            { id: "n2", label: "n2" },
            { id: "n3", label: "n3" },
          ],
          edges: [{ id: "e1", source: "n2", target: "n3" }],
        },
      },
    );

    const summary = await buildArchitectureSummary(source);

    expect(summary.name).toBe("Sample");
    expect(summary.topDiagram).toBe("a");
    expect(summary.diagrams).toEqual([
      { slug: "a", name: "A", level: 1, nodeCount: 1, edgeCount: 0 },
      { slug: "b", name: "B", level: 2, nodeCount: 2, edgeCount: 1 },
    ]);
  });

  it("handles diagrams missing nodes/edges arrays", async () => {
    const source = makeSource(
      { name: "X", topDiagram: "a", diagrams: ["a"] },
      // missing nodes/edges
      { a: { name: "A" } as unknown as DiagramFile },
    );

    const summary = await buildArchitectureSummary(source);
    expect(summary.diagrams[0]).toEqual({
      slug: "a",
      name: "A",
      level: undefined,
      nodeCount: 0,
      edgeCount: 0,
    });
  });
});

describe("findNode", () => {
  const diagrams: Record<string, DiagramFile> = {
    a: { name: "A", nodes: [{ id: "alpha", label: "Alpha" }], edges: [] },
    b: {
      name: "B",
      nodes: [
        { id: "beta", label: "Beta" },
        { id: "gamma", label: "Gamma" },
      ],
      edges: [],
    },
  };

  it("returns the node and the diagram it belongs to", async () => {
    const source = makeSource(
      { name: "X", topDiagram: "a", diagrams: ["a", "b"] },
      diagrams,
    );

    const result = await findNode(source, "gamma");
    expect(result.diagramId).toBe("b");
    expect(result.node.label).toBe("Gamma");
  });

  it("throws NodeNotFoundError for invalid slugs without touching the source", async () => {
    let manifestCalls = 0;
    const source: ArchitectureDataSource = {
      async loadManifest() {
        manifestCalls++;
        return { name: "X", topDiagram: "a", diagrams: ["a"] };
      },
      async loadDiagram() {
        throw new Error("should not be called");
      },
      async loadDescription() {
        throw new Error("should not be called");
      },
    };

    await expect(findNode(source, "Bad Id")).rejects.toBeInstanceOf(
      NodeNotFoundError,
    );
    expect(manifestCalls).toBe(0);
  });

  it("skips missing diagrams referenced by the manifest", async () => {
    const source: ArchitectureDataSource = {
      async loadManifest() {
        return { name: "X", topDiagram: "ghost", diagrams: ["ghost", "b"] };
      },
      async loadDiagram(slug) {
        if (slug === "ghost") throw new DiagramNotFoundError(slug);
        const d = diagrams[slug];
        if (!d) throw new DiagramNotFoundError(slug);
        return d;
      },
      async loadDescription() {
        throw new Error("not used");
      },
    };

    const result = await findNode(source, "beta");
    expect(result.diagramId).toBe("b");
  });

  it("throws NodeNotFoundError when the id is unknown", async () => {
    const source = makeSource(
      { name: "X", topDiagram: "a", diagrams: ["a", "b"] },
      diagrams,
    );
    await expect(findNode(source, "missing")).rejects.toBeInstanceOf(
      NodeNotFoundError,
    );
  });

  it("re-throws non-DiagramNotFound errors from loadDiagram", async () => {
    const source: ArchitectureDataSource = {
      async loadManifest() {
        return { name: "X", topDiagram: "a", diagrams: ["a"] };
      },
      async loadDiagram() {
        throw new Error("boom");
      },
      async loadDescription() {
        throw new Error("not used");
      },
    };
    await expect(findNode(source, "alpha")).rejects.toThrow("boom");
  });
});

describe("buildSourceUrl", () => {
  it("returns undefined when source is missing", () => {
    expect(buildSourceUrl(undefined, undefined, "src/index.ts")).toBeUndefined();
  });

  it("builds a github blob URL for files", () => {
    expect(
      buildSourceUrl("https://github.com/foo/bar.git", "github", "src/index.ts"),
    ).toBe("https://github.com/foo/bar/blob/HEAD/src/index.ts");
  });

  it("builds a github tree URL for directories (trailing slash)", () => {
    expect(
      buildSourceUrl("https://github.com/foo/bar", "github", "src/"),
    ).toBe("https://github.com/foo/bar/tree/HEAD/src");
  });

  it("infers github host from the URL when host is not provided", () => {
    expect(
      buildSourceUrl("https://github.com/foo/bar", undefined, "a/b.ts"),
    ).toBe("https://github.com/foo/bar/blob/HEAD/a/b.ts");
  });

  it("builds a gitlab URL with the /-/ prefix", () => {
    expect(
      buildSourceUrl("https://gitlab.com/foo/bar", "gitlab", "src/index.ts"),
    ).toBe("https://gitlab.com/foo/bar/-/blob/HEAD/src/index.ts");
  });

  it("builds a bitbucket src URL", () => {
    expect(
      buildSourceUrl("https://bitbucket.org/foo/bar", "bitbucket", "src/index.ts"),
    ).toBe("https://bitbucket.org/foo/bar/src/HEAD/src/index.ts");
  });

  it("returns the repo base when path is empty after trimming", () => {
    expect(buildSourceUrl("https://github.com/foo/bar", "github", "/")).toBe(
      "https://github.com/foo/bar",
    );
  });

  it("returns the repo base for unknown hosts", () => {
    expect(
      buildSourceUrl("https://example.com/foo/bar", undefined, "src/x.ts"),
    ).toBe("https://example.com/foo/bar");
  });

  it("URL-encodes path segments containing special characters", () => {
    expect(
      buildSourceUrl("https://github.com/foo/bar", "github", "a b/c?d.ts"),
    ).toBe("https://github.com/foo/bar/blob/HEAD/a%20b/c%3Fd.ts");
  });
});
