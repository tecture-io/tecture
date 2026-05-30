import { describe, expect, it } from "vitest";
import type { Edge, Node } from "@xyflow/react";
import type { DiagramLayoutFile } from "@tecture/shared";
import { layoutDiagram } from "../src/architecture/layout";

function n(id: string, parentId?: string): Node {
  return { id, position: { x: 0, y: 0 }, data: {}, parentId };
}

describe("layoutDiagram", () => {
  it("returns the input untouched for an empty graph", async () => {
    const out = await layoutDiagram([], [], "LR");
    expect(out).toEqual([]);
  });

  it("assigns positions to all nodes", async () => {
    const nodes: Node[] = [n("a"), n("b"), n("c")];
    const edges: Edge[] = [
      { id: "ab", source: "a", target: "b" },
      { id: "bc", source: "b", target: "c" },
    ];

    const out = await layoutDiagram(nodes, edges, "LR");

    expect(out).toHaveLength(3);
    for (const node of out) {
      expect(Number.isFinite(node.position.x)).toBe(true);
      expect(Number.isFinite(node.position.y)).toBe(true);
    }
  });

  it("emits parent nodes before their children (ReactFlow requirement)", async () => {
    const nodes: Node[] = [
      n("router", "shell"),
      n("shell"),
      n("store", "shell"),
    ];
    const out = await layoutDiagram(nodes, [], "TB");

    const idx = new Map(out.map((node, i) => [node.id, i] as const));
    expect(idx.get("shell")!).toBeLessThan(idx.get("router")!);
    expect(idx.get("shell")!).toBeLessThan(idx.get("store")!);
  });

  it("uses saved overlay positions when provided", async () => {
    const overlay: DiagramLayoutFile = {
      version: 1,
      diagramId: "d",
      updatedAt: "",
      nodes: {
        a: { x: 999, y: 888, width: 300, height: 100 },
      },
    };

    const out = await layoutDiagram([n("a"), n("b")], [], "LR", overlay);
    const a = out.find((node) => node.id === "a")!;

    expect(a.position).toEqual({ x: 999, y: 888 });
    expect(a.style).toMatchObject({ width: 300, height: 100 });
  });

  it("assigns container nodes a width/height (so ReactFlow can render them)", async () => {
    const nodes: Node[] = [n("shell"), n("router", "shell")];
    const out = await layoutDiagram(nodes, [], "TB");

    const shell = out.find((node) => node.id === "shell")!;
    expect(shell.style).toBeDefined();
    expect(shell.style!.width).toBeTypeOf("number");
    expect(shell.style!.height).toBeTypeOf("number");
  });
});
