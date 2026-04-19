import ELK from "elkjs/lib/elk.bundled.js";
import type { Edge, Node } from "@xyflow/react";
import type { DiagramDirection } from "@tecture/shared";

const elk = new ELK();

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;

function elkDirection(direction: DiagramDirection | undefined): string {
  return direction === "LR" ? "RIGHT" : "DOWN";
}

export async function layoutDiagram(
  nodes: Node[],
  edges: Edge[],
  direction: DiagramDirection | undefined,
): Promise<Node[]> {
  if (nodes.length === 0) return nodes;

  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": elkDirection(direction),
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.spacing.nodeNode": "80",
      "elk.layered.spacing.nodeNodeBetweenLayers": "120",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
    },
    children: nodes.map((n) => ({
      id: n.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const result = await elk.layout(graph);
  const byId = new Map<string, { x: number; y: number }>();
  for (const child of result.children ?? []) {
    byId.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
  }

  return nodes.map((n) => ({
    ...n,
    position: byId.get(n.id) ?? { x: 0, y: 0 },
  }));
}
