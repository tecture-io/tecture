import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { writeFile } from "node:fs/promises";
import { createApp } from "../src/server.js";
import {
  FsArchitectureDataSource,
  FsDriftReader,
  FsLayoutStore,
} from "../src/source/fs.js";

const FIXTURES_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "architecture",
);

function makeApp(layoutDir: string | null) {
  const source = new FsArchitectureDataSource(FIXTURES_ROOT);
  const layoutStore = layoutDir ? new FsLayoutStore(layoutDir) : null;
  return createApp({ source, layoutStore });
}

describe("GET /api/health", () => {
  it("returns 200 + ok shape", async () => {
    const app = makeApp(null);
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
    expect(typeof res.body.timestamp).toBe("string");
  });
});

describe("GET /api/architecture", () => {
  it("returns architecture summary", async () => {
    const app = makeApp(null);
    const res = await request(app).get("/api/architecture");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Sample Architecture");
    expect(res.body.topDiagram).toBe("system-overview");
    expect(res.body.diagrams).toHaveLength(2);
    expect(res.body.diagrams[0]).toMatchObject({
      slug: "system-overview",
      name: "System Overview",
      nodeCount: 3,
      edgeCount: 2,
    });
  });

  it("GET /api/architecture/manifest returns raw manifest", async () => {
    const app = makeApp(null);
    const res = await request(app).get("/api/architecture/manifest");
    expect(res.status).toBe(200);
    expect(res.body.topDiagram).toBe("system-overview");
    expect(res.body.diagrams).toEqual(["system-overview", "nested-system"]);
  });

  it("GET /api/architecture/diagrams returns diagram summaries", async () => {
    const app = makeApp(null);
    const res = await request(app).get("/api/architecture/diagrams");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.map((d: { slug: string }) => d.slug)).toEqual([
      "system-overview",
      "nested-system",
    ]);
  });
});

describe("GET /api/architecture/diagrams/:id", () => {
  it("returns diagram with nodes + edges", async () => {
    const app = makeApp(null);
    const res = await request(app).get(
      "/api/architecture/diagrams/system-overview",
    );
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe("system-overview");
    expect(res.body.nodes).toHaveLength(3);
    expect(res.body.edges).toHaveLength(2);
  });

  it("returns 404 with diagram_not_found for unknown id", async () => {
    const app = makeApp(null);
    const res = await request(app).get("/api/architecture/diagrams/unknown");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: "diagram_not_found",
      slug: "unknown",
    });
  });

  it("returns 404 with diagram_not_found for an invalid slug shape", async () => {
    const app = makeApp(null);
    const res = await request(app).get(
      "/api/architecture/diagrams/Bad_Slug",
    );
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("diagram_not_found");
    expect(res.body.slug).toBe("Bad_Slug");
  });

  it("returns nodes-only via /diagrams/:id/nodes", async () => {
    const app = makeApp(null);
    const res = await request(app).get(
      "/api/architecture/diagrams/system-overview/nodes",
    );
    expect(res.status).toBe(200);
    expect(res.body.diagramId).toBe("system-overview");
    expect(res.body.nodes).toHaveLength(3);
  });

  it("returns edges-only via /diagrams/:id/edges", async () => {
    const app = makeApp(null);
    const res = await request(app).get(
      "/api/architecture/diagrams/system-overview/edges",
    );
    expect(res.status).toBe(200);
    expect(res.body.edges).toHaveLength(2);
  });
});

describe("GET /api/architecture/nodes/:id", () => {
  it("returns node detail with description", async () => {
    const app = makeApp(null);
    const res = await request(app).get("/api/architecture/nodes/web-app");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("web-app");
    expect(res.body.diagramId).toBe("system-overview");
    expect(res.body.description).toContain("# Web App");
  });

  it("returns 404 node_not_found for invalid slug shapes", async () => {
    const app = makeApp(null);
    const res = await request(app).get("/api/architecture/nodes/Bad_Id");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("node_not_found");
    expect(res.body.id).toBe("Bad_Id");
  });

  it("returns 404 node_not_found for unknown node ids", async () => {
    const app = makeApp(null);
    const res = await request(app).get("/api/architecture/nodes/missing-node");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("node_not_found");
  });

  it("returns 404 description_not_found when node exists but description missing", async () => {
    const app = makeApp(null);
    const res = await request(app).get("/api/architecture/nodes/user");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("description_not_found");
    expect(res.body.id).toBe("user");
  });

  it("serves raw markdown via /nodes/:id/description", async () => {
    const app = makeApp(null);
    const res = await request(app).get(
      "/api/architecture/nodes/web-app/description",
    );
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/markdown/);
    expect(res.text).toContain("# Web App");
  });
});

describe("layout endpoints", () => {
  let layoutDir: string;

  beforeEach(async () => {
    layoutDir = await mkdtemp(join(tmpdir(), "tecture-routes-"));
  });

  afterEach(async () => {
    await rm(layoutDir, { recursive: true, force: true });
  });

  it("GET layout returns empty layout when nothing is stored", async () => {
    const app = makeApp(layoutDir);
    const res = await request(app).get(
      "/api/architecture/diagrams/system-overview/layout",
    );
    expect(res.status).toBe(200);
    expect(res.body.diagramId).toBe("system-overview");
    expect(res.body.nodes).toEqual({});
  });

  it("PUT layout persists nodes and returns saved layout", async () => {
    const app = makeApp(layoutDir);
    const update = {
      nodes: {
        api: { x: 10, y: 20, width: 200, height: 60 },
        "web-app": { x: 0, y: 0 },
      },
    };
    const put = await request(app)
      .put("/api/architecture/diagrams/system-overview/layout")
      .send(update);
    expect(put.status).toBe(200);
    expect(put.body.nodes).toEqual(update.nodes);

    const get = await request(app).get(
      "/api/architecture/diagrams/system-overview/layout",
    );
    expect(get.status).toBe(200);
    expect(get.body.nodes).toEqual(update.nodes);
  });

  it("PUT layout returns 400 layout_invalid for malformed bodies", async () => {
    const app = makeApp(layoutDir);
    const res = await request(app)
      .put("/api/architecture/diagrams/system-overview/layout")
      .send({ nodes: { api: { x: "nope", y: 0 } } });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("layout_invalid");
  });

  it("PUT layout returns 404 diagram_not_found for unknown diagrams", async () => {
    const app = makeApp(layoutDir);
    const res = await request(app)
      .put("/api/architecture/diagrams/unknown/layout")
      .send({ nodes: { x: { x: 0, y: 0 } } });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("diagram_not_found");
  });

  it("PUT layout returns 501 layout_not_supported when no store is configured", async () => {
    const app = makeApp(null);
    const res = await request(app)
      .put("/api/architecture/diagrams/system-overview/layout")
      .send({ nodes: { api: { x: 0, y: 0 } } });
    expect(res.status).toBe(501);
    expect(res.body.error).toBe("layout_not_supported");
  });

  it("GET layout returns empty layout when no store is configured", async () => {
    const app = makeApp(null);
    const res = await request(app).get(
      "/api/architecture/diagrams/system-overview/layout",
    );
    expect(res.status).toBe(200);
    expect(res.body.nodes).toEqual({});
  });
});

describe("GET /api/architecture/drift", () => {
  let driftDir: string;

  beforeEach(async () => {
    driftDir = await mkdtemp(join(tmpdir(), "tecture-drift-route-"));
  });

  afterEach(async () => {
    await rm(driftDir, { recursive: true, force: true });
  });

  function makeDriftApp(tectureRoot: string | null) {
    const source = new FsArchitectureDataSource(FIXTURES_ROOT);
    const drift = tectureRoot ? new FsDriftReader(tectureRoot) : null;
    return createApp({ source, drift });
  }

  it("returns the drift report when present", async () => {
    const app = makeDriftApp(join(FIXTURES_ROOT, ".tecture"));
    const res = await request(app).get("/api/architecture/drift");
    expect(res.status).toBe(200);
    expect(res.body.version).toBe(1);
    expect(res.body.findings).toHaveLength(3);
    expect(res.body.findings[0].kind).toBe("missing-path");
  });

  it("returns 200 null when drift.json is absent", async () => {
    const app = makeDriftApp(driftDir);
    const res = await request(app).get("/api/architecture/drift");
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it("returns 200 null when drift.json is malformed", async () => {
    await writeFile(join(driftDir, "drift.json"), "{not json", "utf8");
    const app = makeDriftApp(driftDir);
    const res = await request(app).get("/api/architecture/drift");
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it("returns 200 null when no drift loader is configured", async () => {
    const app = makeDriftApp(null);
    const res = await request(app).get("/api/architecture/drift");
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});
