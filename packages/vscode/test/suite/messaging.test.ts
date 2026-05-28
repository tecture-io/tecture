import * as assert from "node:assert";
import * as vscode from "vscode";
import { handleRequest } from "../../src/messaging";
import {
  VscodeFsArchitectureDataSource,
  VscodeFsLayoutStore,
  resolveArchitectureRoot,
  resolveLayoutsRoot,
} from "../../src/dataSource";
import type {
  ApiArchitectureSummary,
  ApiDiagram,
  ApiNodeDetail,
  DiagramLayoutFile,
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
