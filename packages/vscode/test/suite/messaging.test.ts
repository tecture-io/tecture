import * as assert from "node:assert";
import * as vscode from "vscode";
import { handleNotification, handleRequest } from "../../src/messaging";
import {
  appearanceBootScript,
  readAppearanceOverrides,
} from "../../src/appearance";
import { injectIntoHead } from "../../src/panel";
import {
  VscodeFsArchitectureDataSource,
  VscodeFsLayoutStore,
  readWorkspaceDrift,
  resolveArchitectureRoot,
  resolveLayoutsRoot,
} from "../../src/dataSource";
import type {
  ApiArchitectureSummary,
  ApiDiagram,
  ApiNodeDetail,
  DiagramLayoutFile,
  DriftReport,
  TectureEvent,
} from "@tecture/shared";

function deps() {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) throw new Error("no workspace folder in test environment");
  return {
    source: new VscodeFsArchitectureDataSource(
      resolveArchitectureRoot(folder),
    ),
    layouts: new VscodeFsLayoutStore(resolveLayoutsRoot(folder)),
  };
}

suite("handleRequest", () => {
  test("loadSummary returns architecture summary", async () => {
    const res = await handleRequest(
      { id: "1", type: "loadSummary" },
      deps(),
    );
    assert.strictEqual(res.id, "1");
    assert.strictEqual(res.ok, true);
    if (!res.ok) return;
    const data = res.data as ApiArchitectureSummary;
    assert.ok(data.name);
    assert.ok(Array.isArray(data.diagrams));
    assert.ok(data.diagrams.length > 0);
  });

  test("loadDiagram returns diagram with slug + edges array", async () => {
    const res = await handleRequest(
      { id: "2", type: "loadDiagram", slug: "system-context" },
      deps(),
    );
    assert.strictEqual(res.ok, true);
    if (!res.ok) return;
    const data = res.data as ApiDiagram;
    assert.strictEqual(data.slug, "system-context");
    assert.ok(Array.isArray(data.edges));
    assert.ok(Array.isArray(data.nodes));
  });

  test("loadNodeDetail returns node + description", async () => {
    const res = await handleRequest(
      { id: "3", type: "loadNodeDetail", nodeId: "tecture-io" },
      deps(),
    );
    assert.strictEqual(res.ok, true);
    if (!res.ok) return;
    const data = res.data as ApiNodeDetail;
    assert.strictEqual(data.id, "tecture-io");
    assert.ok(data.diagramId);
    assert.ok(typeof data.description === "string");
  });

  test("loadDiagram on missing slug returns ok:false", async () => {
    const res = await handleRequest(
      { id: "4", type: "loadDiagram", slug: "no-such-diagram" },
      deps(),
    );
    assert.strictEqual(res.ok, false);
  });

  test("openFile routes the path to deps.openFile", async () => {
    const calls: string[] = [];
    const d = {
      ...deps(),
      openFile: async (p: string) => {
        calls.push(p);
      },
    };
    const res = await handleRequest(
      { id: "7", type: "openFile", path: "packages/web/src/App.tsx" },
      d,
    );
    assert.strictEqual(res.ok, true);
    assert.deepStrictEqual(calls, ["packages/web/src/App.tsx"]);
  });

  test("openFile without an openFile capability returns ok:false", async () => {
    const res = await handleRequest(
      { id: "8", type: "openFile", path: "packages/web/src/App.tsx" },
      deps(),
    );
    assert.strictEqual(res.ok, false);
  });

  test("loadDrift returns the report from deps.loadDrift", async () => {
    const report: DriftReport = {
      version: 1,
      generatedAt: "2026-07-06T00:00:00.000Z",
      generator: { name: "evidence.mjs" },
      codegraphSchemaVersion: 6,
      staleIndex: false,
      summary: {
        errors: 0,
        warns: 1,
        infos: 0,
        nodesChecked: 1,
        edgesChecked: 1,
        nodesSkipped: 0,
        edgesSkipped: 0,
      },
      findings: [
        {
          kind: "unverified-edge",
          severity: "warn",
          message: "no symbol edges support a -> b",
        },
      ],
    };
    const res = await handleRequest(
      { id: "9", type: "loadDrift" },
      { ...deps(), loadDrift: async () => report },
    );
    assert.strictEqual(res.ok, true);
    if (!res.ok) return;
    assert.deepStrictEqual(res.data, report);
  });

  test("loadDrift without a loadDrift capability returns ok:true null", async () => {
    const res = await handleRequest({ id: "10", type: "loadDrift" }, deps());
    assert.strictEqual(res.ok, true);
    if (!res.ok) return;
    assert.strictEqual(res.data, null);
  });

  test("readWorkspaceDrift returns null when drift.json is absent", async () => {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) throw new Error("no workspace folder in test environment");
    const drift = await readWorkspaceDrift(resolveArchitectureRoot(folder));
    assert.strictEqual(drift, null);
  });

  test("saveLayout + loadLayout round-trips through messaging", async () => {
    const d = deps();
    const saveRes = await handleRequest(
      {
        id: "5",
        type: "saveLayout",
        slug: "system-context",
        update: { nodes: { "tecture-io": { x: 7, y: 14 } } },
      },
      d,
    );
    assert.strictEqual(saveRes.ok, true);

    const loadRes = await handleRequest(
      { id: "6", type: "loadLayout", slug: "system-context" },
      d,
    );
    assert.strictEqual(loadRes.ok, true);
    if (!loadRes.ok) return;
    const layout = loadRes.data as DiagramLayoutFile;
    assert.strictEqual(layout.nodes["tecture-io"]?.x, 7);

    // cleanup
    const folder = vscode.workspace.workspaceFolders![0]!;
    await vscode.workspace.fs.delete(resolveLayoutsRoot(folder), {
      recursive: true,
      useTrash: false,
    });
  });
});

suite("handleNotification", () => {
  test("ready replies with the current appearance overrides", () => {
    const posted: TectureEvent[] = [];
    const overrides = { edgeLabel: { backgroundOpacity: 0.3 } };
    handleNotification(
      { type: "ready" },
      { postEvent: (e) => posted.push(e), readAppearance: () => overrides },
    );
    assert.deepStrictEqual(posted, [{ type: "appearance", overrides }]);
  });

  test("non-ready notifications do not post appearance", () => {
    const posted: TectureEvent[] = [];
    const slugs: string[] = [];
    handleNotification(
      { type: "diagramChanged", slug: "containers" },
      {
        postEvent: (e) => posted.push(e),
        readAppearance: () => ({}),
        onDiagramChanged: (s) => slugs.push(s),
      },
    );
    assert.deepStrictEqual(posted, []);
    assert.deepStrictEqual(slugs, ["containers"]);
  });
});

suite("appearance settings", () => {
  test("reads tecture.graph.* updates as a nested object", async () => {
    const config = vscode.workspace.getConfiguration("tecture");
    await config.update(
      "graph.edgeLabel.backgroundOpacity",
      0.25,
      vscode.ConfigurationTarget.Global,
    );
    try {
      const raw = readAppearanceOverrides() as {
        edgeLabel?: { backgroundOpacity?: unknown };
      };
      assert.strictEqual(raw.edgeLabel?.backgroundOpacity, 0.25);
    } finally {
      await config.update(
        "graph.edgeLabel.backgroundOpacity",
        undefined,
        vscode.ConfigurationTarget.Global,
      );
    }
  });

  test("boot script cannot be broken out of by a setting value", () => {
    const html = appearanceBootScript("n0nce", {
      canvas: { backgroundColor: "</script><script>alert(1)</script>" },
    });
    assert.strictEqual(html.match(/<\/script>/g)?.length, 1);
    assert.ok(html.startsWith('<script nonce="n0nce">'));
  });

  test("$ replacement patterns in a setting value leave the page intact", () => {
    const overrides = { canvas: { backgroundColor: "$' $` $& $$" } };
    const page = injectIntoHead(
      '<!doctype html><html><head>\n<title>t</title></head><body><div id="root"></div></body></html>',
      appearanceBootScript("n0nce", overrides),
    );
    assert.strictEqual(page.match(/id="root"/g)?.length, 1);
    const json = /window\.__TECTURE_APPEARANCE__=(.*);<\/script>/.exec(page)?.[1];
    assert.deepStrictEqual(JSON.parse(json ?? "null"), overrides);
  });
});
