import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DescriptionNotFoundError,
  DiagramNotFoundError,
  LayoutInvalidError,
} from "@tecture/shared";
import {
  FsArchitectureDataSource,
  FsDriftReader,
  FsLayoutStore,
  safeJoin,
} from "../src/source/fs.js";

const FIXTURES_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "architecture",
);

describe("safeJoin", () => {
  it("joins normal segments under the root", () => {
    const result = safeJoin(FIXTURES_ROOT, "diagrams", "system-overview.json");
    expect(result.endsWith("/diagrams/system-overview.json")).toBe(true);
    expect(result.startsWith(FIXTURES_ROOT)).toBe(true);
  });

  it("rejects relative escapes", () => {
    expect(() => safeJoin(FIXTURES_ROOT, "..", "etc")).toThrow(
      /Path escapes architecture root/,
    );
  });

  it("rejects multi-step relative escapes", () => {
    expect(() =>
      safeJoin(FIXTURES_ROOT, "diagrams", "..", "..", "..", "etc"),
    ).toThrow(/Path escapes architecture root/);
  });

  it("allows the root itself", () => {
    const result = safeJoin(FIXTURES_ROOT);
    expect(result).toBe(FIXTURES_ROOT.replace(/\/$/, ""));
  });
});

describe("FsArchitectureDataSource", () => {
  const source = new FsArchitectureDataSource(FIXTURES_ROOT);

  it("loads the manifest", async () => {
    const manifest = await source.loadManifest();
    expect(manifest.name).toBe("Sample Architecture");
    expect(manifest.topDiagram).toBe("system-overview");
    expect(manifest.diagrams).toEqual(["system-overview", "nested-system"]);
  });

  it("loads a diagram by slug", async () => {
    const diagram = await source.loadDiagram("system-overview");
    expect(diagram.name).toBe("System Overview");
    expect(diagram.nodes.map((n) => n.id)).toEqual([
      "user",
      "web-app",
      "api",
    ]);
    expect(diagram.edges).toHaveLength(2);
  });

  it("throws DiagramNotFoundError for an unknown slug", async () => {
    await expect(source.loadDiagram("does-not-exist")).rejects.toBeInstanceOf(
      DiagramNotFoundError,
    );
  });

  it("throws DiagramNotFoundError for an invalid slug (no fs access)", async () => {
    await expect(source.loadDiagram("../etc")).rejects.toBeInstanceOf(
      DiagramNotFoundError,
    );
    await expect(source.loadDiagram("Bad/Slug")).rejects.toBeInstanceOf(
      DiagramNotFoundError,
    );
  });

  it("loads a description by node id", async () => {
    const md = await source.loadDescription("web-app");
    expect(md).toContain("# Web App");
  });

  it("throws DescriptionNotFoundError for missing descriptions", async () => {
    await expect(source.loadDescription("user")).rejects.toBeInstanceOf(
      DescriptionNotFoundError,
    );
  });

  it("throws DescriptionNotFoundError for invalid slugs", async () => {
    await expect(source.loadDescription("../etc")).rejects.toBeInstanceOf(
      DescriptionNotFoundError,
    );
  });
});

describe("FsLayoutStore", () => {
  let tectureRoot: string;
  let store: FsLayoutStore;

  beforeEach(async () => {
    tectureRoot = await mkdtemp(join(tmpdir(), "tecture-layout-"));
    store = new FsLayoutStore(tectureRoot);
  });

  afterEach(async () => {
    await rm(tectureRoot, { recursive: true, force: true });
  });

  it("returns an empty layout when no file exists", async () => {
    const layout = await store.loadLayout("system-overview");
    expect(layout.nodes).toEqual({});
    expect(layout.diagramId).toBe("system-overview");
    expect(layout.version).toBe(1);
  });

  it("returns an empty layout for an invalid slug without throwing", async () => {
    const layout = await store.loadLayout("../etc");
    expect(layout.nodes).toEqual({});
  });

  it("round-trips a saved layout", async () => {
    const saved = await store.saveLayout("system-overview", {
      nodes: {
        api: { x: 10, y: 20, width: 200, height: 60 },
        "web-app": { x: 0, y: 0 },
      },
    });
    expect(saved.nodes).toEqual({
      api: { x: 10, y: 20, width: 200, height: 60 },
      "web-app": { x: 0, y: 0 },
    });

    const loaded = await store.loadLayout("system-overview");
    expect(loaded.nodes).toEqual(saved.nodes);
    expect(loaded.updatedAt).toBe(saved.updatedAt);
  });

  it("writes layout JSON to layouts/<slug>.json under the tecture root", async () => {
    await store.saveLayout("system-overview", {
      nodes: { api: { x: 1, y: 2 } },
    });
    const raw = await readFile(
      join(tectureRoot, "layouts", "system-overview.json"),
      "utf8",
    );
    expect(JSON.parse(raw).nodes.api).toEqual({ x: 1, y: 2 });
  });

  it("rejects non-finite layout entries via LayoutInvalidError", async () => {
    await expect(
      store.saveLayout("system-overview", {
        nodes: { api: { x: Number.NaN, y: 0 } },
      }),
    ).rejects.toBeInstanceOf(LayoutInvalidError);
  });

  it("rejects invalid slug via LayoutInvalidError", async () => {
    await expect(
      store.saveLayout("../etc", { nodes: { api: { x: 0, y: 0 } } }),
    ).rejects.toBeInstanceOf(LayoutInvalidError);
  });

  it("returns an empty layout when the stored JSON is malformed", async () => {
    const layoutsDir = join(tectureRoot, "layouts");
    await store.saveLayout("system-overview", {
      nodes: { api: { x: 1, y: 2 } },
    });
    await writeFile(
      join(layoutsDir, "system-overview.json"),
      "{not json",
      "utf8",
    );

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const layout = await store.loadLayout("system-overview");
      expect(layout.nodes).toEqual({});
      expect(warn).toHaveBeenCalledOnce();
    } finally {
      warn.mockRestore();
    }
  });

  it("drops invalid entries during load but keeps valid ones", async () => {
    const layoutsDir = join(tectureRoot, "layouts");
    await store.saveLayout("system-overview", {
      nodes: { api: { x: 1, y: 2 } },
    });
    await writeFile(
      join(layoutsDir, "system-overview.json"),
      JSON.stringify({
        version: 1,
        diagramId: "system-overview",
        updatedAt: "2026-05-01T00:00:00.000Z",
        nodes: {
          api: { x: 1, y: 2, width: 100, height: 50 },
          "bad id": { x: 0, y: 0 },
          broken: { x: "nope", y: 0 },
        },
      }),
      "utf8",
    );

    const layout = await store.loadLayout("system-overview");
    expect(Object.keys(layout.nodes)).toEqual(["api"]);
    expect(layout.nodes.api).toEqual({ x: 1, y: 2, width: 100, height: 50 });
    expect(layout.updatedAt).toBe("2026-05-01T00:00:00.000Z");
  });

  it("uses atomic write (no .tmp file left behind on success)", async () => {
    await store.saveLayout("system-overview", {
      nodes: { api: { x: 1, y: 2 } },
    });
    await expect(
      readFile(join(tectureRoot, "layouts", "system-overview.json.tmp"), "utf8"),
    ).rejects.toThrow();
  });
});

describe("FsDriftReader", () => {
  let tectureRoot: string;

  beforeEach(async () => {
    tectureRoot = await mkdtemp(join(tmpdir(), "tecture-drift-"));
  });

  afterEach(async () => {
    await rm(tectureRoot, { recursive: true, force: true });
  });

  it("loads a valid drift report from the fixture", async () => {
    const reader = new FsDriftReader(join(FIXTURES_ROOT, ".tecture"));
    const report = await reader.load();
    expect(report).not.toBeNull();
    expect(report?.version).toBe(1);
    expect(report?.findings).toHaveLength(3);
    expect(report?.summary.errors).toBe(1);
  });

  it("returns null when drift.json does not exist", async () => {
    const reader = new FsDriftReader(tectureRoot);
    await expect(reader.load()).resolves.toBeNull();
  });

  it("returns null + warns on malformed JSON", async () => {
    await writeFile(join(tectureRoot, "drift.json"), "{not json", "utf8");
    const reader = new FsDriftReader(tectureRoot);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      await expect(reader.load()).resolves.toBeNull();
      expect(warn).toHaveBeenCalledOnce();
    } finally {
      warn.mockRestore();
    }
  });

  it("returns null + warns on a structurally invalid report", async () => {
    await writeFile(
      join(tectureRoot, "drift.json"),
      JSON.stringify({ version: 99, findings: "nope" }),
      "utf8",
    );
    const reader = new FsDriftReader(tectureRoot);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      await expect(reader.load()).resolves.toBeNull();
      expect(warn).toHaveBeenCalledOnce();
    } finally {
      warn.mockRestore();
    }
  });
});
