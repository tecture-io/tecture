import { describe, expect, it } from "vitest";
import type { ApiDiagram } from "@tecture/shared";
import { diagramToFlow } from "../src/architecture/transform";

function diagram(over: Partial<ApiDiagram> = {}): ApiDiagram {
  return {
    slug: "d",
    name: "D",
    nodes: [],
    edges: [],
    ...over,
  };
}

describe("diagramToFlow", () => {
  it("returns empty arrays for an empty diagram", () => {
    const { nodes, edges } = diagramToFlow(diagram());
    expect(nodes).toEqual([]);
    expect(edges).toEqual([]);
  });

  it("maps each architecture node to a ReactFlow node with type=architecture", () => {
    const { nodes } = diagramToFlow(
      diagram({
        nodes: [
          { id: "user", label: "User", meta: { type: "person" } },
          { id: "api", label: "API", meta: { type: "service", technology: "Node" } },
        ],
      }),
    );

    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toMatchObject({
      id: "user",
      type: "architecture",
      position: { x: 0, y: 0 },
      data: {
        label: "User",
        nodeType: "person",
        hasSubDiagram: false,
        isContainer: false,
        hasChildren: false,
      },
    });
    expect(nodes[1]!.data).toMatchObject({
      label: "API",
      nodeType: "service",
      technology: "Node",
    });
  });

  it("marks subDiagram drill-in via hasSubDiagram + subDiagramId", () => {
    const { nodes } = diagramToFlow(
      diagram({
        nodes: [
          { id: "web", label: "Web", subDiagramId: "web-internals" },
          { id: "api", label: "API" },
        ],
      }),
    );

    expect(nodes[0]!.data.hasSubDiagram).toBe(true);
    expect(nodes[0]!.data.subDiagramId).toBe("web-internals");
    expect(nodes[1]!.data.hasSubDiagram).toBe(false);
    expect(nodes[1]!.data.subDiagramId).toBeUndefined();
  });

  it("emits nodes in input order", () => {
    const { nodes } = diagramToFlow(
      diagram({
        nodes: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
          { id: "c", label: "C" },
        ],
      }),
    );
    expect(nodes.map((n) => n.id)).toEqual(["a", "b", "c"]);
  });

  it("derives hasChildren + isContainer from parentId references", () => {
    const { nodes } = diagramToFlow(
      diagram({
        nodes: [
          { id: "shell", label: "Shell" },
          { id: "router", label: "Router", parentId: "shell" },
          { id: "store", label: "Store", parentId: "shell" },
        ],
      }),
    );
    const byId = new Map(nodes.map((n) => [n.id, n]));

    expect(byId.get("shell")?.data.hasChildren).toBe(true);
    expect(byId.get("shell")?.data.isContainer).toBe(true);
    expect(byId.get("router")?.data.hasChildren).toBe(false);
    expect(byId.get("router")?.parentId).toBe("shell");
    expect(byId.get("router")?.extent).toBe("parent");
  });

  it("respects explicit meta.isContainer even without children", () => {
    const { nodes } = diagramToFlow(
      diagram({
        nodes: [
          {
            id: "boundary",
            label: "Boundary",
            meta: { isContainer: true },
          },
        ],
      }),
    );
    expect(nodes[0]!.data.isContainer).toBe(true);
    expect(nodes[0]!.data.hasChildren).toBe(false);
  });

  it("ignores parentId that does not match a known node", () => {
    const { nodes } = diagramToFlow(
      diagram({
        nodes: [
          { id: "child", label: "Child", parentId: "ghost" },
        ],
      }),
    );
    expect(nodes[0]!.data.hasChildren).toBe(false);
    expect(nodes[0]!.data.isContainer).toBe(false);
    expect(nodes[0]!.parentId).toBe("ghost");
  });

  it("filters edges that reference unknown nodes", () => {
    const { edges } = diagramToFlow(
      diagram({
        nodes: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        edges: [
          { id: "good", source: "a", target: "b" },
          { id: "dangling-target", source: "a", target: "ghost" },
          { id: "dangling-source", source: "ghost", target: "b" },
        ],
      }),
    );
    expect(edges).toHaveLength(1);
    expect(edges[0]!.id).toBe("good");
  });

  it("attaches edge style metadata", () => {
    const { edges } = diagramToFlow(
      diagram({
        nodes: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        edges: [
          {
            id: "e1",
            source: "a",
            target: "b",
            label: "calls",
            meta: { type: "calls" },
          },
        ],
      }),
    );
    expect(edges[0]!).toMatchObject({
      id: "e1",
      type: "floating",
      label: "calls",
      source: "a",
      target: "b",
    });
    expect(edges[0]!.markerEnd).toBeDefined();
    expect(edges[0]!.style).toBeDefined();
  });
});
