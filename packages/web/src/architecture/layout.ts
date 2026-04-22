import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";
import type { Edge, Node } from "@xyflow/react";
import type { DiagramDirection, DiagramLayoutFile } from "@tecture/shared";

const elk = new ELK();

const LEAF_WIDTH = 220;
const LEAF_HEIGHT = 80;
// Extra top padding reserves space for the container's header label.
const CONTAINER_PADDING = "[top=48,left=16,bottom=16,right=16]";

function elkDirection(direction: DiagramDirection | undefined): string {
  return direction === "LR" ? "RIGHT" : "DOWN";
}

export async function layoutDiagram(
  nodes: Node[],
  edges: Edge[],
  direction: DiagramDirection | undefined,
  overlay?: DiagramLayoutFile,
): Promise<Node[]> {
  if (nodes.length === 0) return nodes;

  const childrenByParent = new Map<string | undefined, Node[]>();
  for (const n of nodes) {
    const key = n.parentId ?? undefined;
    const list = childrenByParent.get(key) ?? [];
    list.push(n);
    childrenByParent.set(key, list);
  }
  const isContainer = (id: string) =>
    (childrenByParent.get(id)?.length ?? 0) > 0;

  const buildElkNode = (n: Node): ElkNode => {
    if (isContainer(n.id)) {
      return {
        id: n.id,
        layoutOptions: { "elk.padding": CONTAINER_PADDING },
        children: (childrenByParent.get(n.id) ?? []).map(buildElkNode),
      };
    }
    return { id: n.id, width: LEAF_WIDTH, height: LEAF_HEIGHT };
  };

  const topLevel = childrenByParent.get(undefined) ?? [];
  const graph: ElkNode = {
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
    children: topLevel.map(buildElkNode),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const result = await elk.layout(graph);

  const positions = new Map<string, { x: number; y: number }>();
  const sizes = new Map<string, { width: number; height: number }>();
  const walk = (elkNode: ElkNode) => {
    if (elkNode.id !== "root") {
      positions.set(elkNode.id, { x: elkNode.x ?? 0, y: elkNode.y ?? 0 });
      if (isContainer(elkNode.id)) {
        sizes.set(elkNode.id, {
          width: elkNode.width ?? LEAF_WIDTH,
          height: elkNode.height ?? LEAF_HEIGHT,
        });
      }
    }
    for (const c of elkNode.children ?? []) walk(c);
  };
  walk(result);

  // ReactFlow requires parent nodes to appear before their children in the nodes array.
  const visited = new Set<string>();
  const ordered: Node[] = [];
  const emit = (n: Node) => {
    if (visited.has(n.id)) return;
    visited.add(n.id);
    const saved = overlay?.nodes[n.id];
    const position = saved
      ? { x: saved.x, y: saved.y }
      : positions.get(n.id) ?? { x: 0, y: 0 };
    const out: Node = { ...n, position };
    const elkSize = sizes.get(n.id);
    const width = saved?.width ?? elkSize?.width;
    const height = saved?.height ?? elkSize?.height;
    if (width !== undefined && height !== undefined) {
      out.style = { ...(n.style ?? {}), width, height };
    }
    ordered.push(out);
    for (const c of childrenByParent.get(n.id) ?? []) emit(c);
  };
  for (const n of topLevel) emit(n);
  for (const n of nodes) if (!visited.has(n.id)) emit(n);

  return ordered;
}
