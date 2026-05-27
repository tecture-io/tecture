import * as assert from "node:assert";
import * as vscode from "vscode";
import {
  VscodeFsArchitectureDataSource,
  VscodeFsLayoutStore,
  resolveArchitectureRoot,
  resolveLayoutsRoot,
} from "../../src/dataSource";
import {
  DescriptionNotFoundError,
  DiagramNotFoundError,
} from "@tecture/shared";

function workspaceFolder(): vscode.WorkspaceFolder {
  const f = vscode.workspace.workspaceFolders?.[0];
  if (!f) throw new Error("no workspace folder in test environment");
  return f;
}

suite("VscodeFsArchitectureDataSource", () => {
  test("loadManifest reads architecture/manifest.json", async () => {
    const source = new VscodeFsArchitectureDataSource(
      resolveArchitectureRoot(workspaceFolder()),
    );
    const manifest = await source.loadManifest();
    assert.strictEqual(manifest.name, "Tecture IO");
    assert.ok(Array.isArray(manifest.diagrams));
    assert.ok(manifest.diagrams.length > 0);
    assert.ok(manifest.topDiagram);
  });

  test("loadDiagram returns a valid diagram", async () => {
    const source = new VscodeFsArchitectureDataSource(
      resolveArchitectureRoot(workspaceFolder()),
    );
    const diagram = await source.loadDiagram("system-context");
    assert.ok(diagram.name);
    assert.ok(Array.isArray(diagram.nodes));
  });

  test("loadDiagram throws DiagramNotFoundError on missing slug", async () => {
    const source = new VscodeFsArchitectureDataSource(
      resolveArchitectureRoot(workspaceFolder()),
    );
    await assert.rejects(
      () => source.loadDiagram("does-not-exist"),
      (err: unknown) => err instanceof DiagramNotFoundError,
    );
  });

  test("loadDescription returns markdown content", async () => {
    const source = new VscodeFsArchitectureDataSource(
      resolveArchitectureRoot(workspaceFolder()),
    );
    const text = await source.loadDescription("tecture-io");
    assert.ok(typeof text === "string");
    assert.ok(text.length > 0);
  });

  test("loadDescription throws DescriptionNotFoundError when missing", async () => {
    const source = new VscodeFsArchitectureDataSource(
      resolveArchitectureRoot(workspaceFolder()),
    );
    await assert.rejects(
      () => source.loadDescription("nope-unknown"),
      (err: unknown) => err instanceof DescriptionNotFoundError,
    );
  });
});

suite("VscodeFsLayoutStore", () => {
  test("loadLayout returns empty layout when file does not exist", async () => {
    const store = new VscodeFsLayoutStore(
      resolveLayoutsRoot(workspaceFolder()),
    );
    const layout = await store.loadLayout("system-context");
    assert.strictEqual(layout.diagramId, "system-context");
    assert.deepStrictEqual(layout.nodes, {});
  });

  test("saveLayout round-trips through disk", async () => {
    const layoutsRoot = resolveLayoutsRoot(workspaceFolder());
    const store = new VscodeFsLayoutStore(layoutsRoot);
    const slug = "system-context";

    const saved = await store.saveLayout(slug, {
      nodes: {
        "tecture-io": { x: 10, y: 20, width: 100, height: 50 },
        developer: { x: 200, y: 30 },
      },
    });

    assert.strictEqual(saved.diagramId, slug);
    assert.strictEqual(saved.nodes["tecture-io"]?.x, 10);
    assert.strictEqual(saved.nodes.developer?.y, 30);

    const reloaded = await store.loadLayout(slug);
    assert.deepStrictEqual(reloaded.nodes, saved.nodes);

    // cleanup
    await vscode.workspace.fs.delete(layoutsRoot, {
      recursive: true,
      useTrash: false,
    });
  });
});
