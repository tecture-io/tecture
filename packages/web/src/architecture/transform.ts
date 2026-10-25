import type { Edge, Node } from "@xyflow/react";
import type { ApiDiagram, ArchitectureNode, ArchitectureEdge } from "@tecture/shared";

export interface ArchNodeData extends Record<string, unknown> {
  label: string;
  nodeType?: string;
  technology?: string;
  hasSubDiagram: boolean;
  subDiagramId?: string;
  isContainer: boolean;
  hasChildren: boolean;
}

/** Edge styling is resolved at render time (FloatingEdge) from the appearance context. */
export interface ArchEdgeData extends Record<string, unknown> {
  edgeType?: string;
}

export function diagramToFlow(diagram: ApiDiagram): {
  nodes: Node<ArchNodeData>[];
  edges: Edge<ArchEdgeData>[];
} {
  const nodeIds = new Set(diagram.nodes.map((n) => n.id));
  const childCounts = new Map<string, number>();
  for (const n of diagram.nodes) {
    if (n.parentId && nodeIds.has(n.parentId)) {
      childCounts.set(n.parentId, (childCounts.get(n.parentId) ?? 0) + 1);
    }
  }
  return {
    nodes: diagram.nodes.map((n) => toFlowNode(n, childCounts.has(n.id))),
    edges: diagram.edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map(toFlowEdge),
  };
}

function toFlowNode(n: ArchitectureNode, hasChildren: boolean): Node<ArchNodeData> {
  const isContainer = Boolean(n.meta?.isContainer) || hasChildren;
  const data: ArchNodeData = {
    label: n.label,
    nodeType: n.meta?.type,
    technology: typeof n.meta?.technology === "string" ? n.meta.technology : undefined,
    hasSubDiagram: Boolean(n.subDiagramId),
    subDiagramId: n.subDiagramId ?? undefined,
    isContainer,
    hasChildren,
  };
  const node: Node<ArchNodeData> = {
    id: n.id,
    type: "architecture",
    position: { x: 0, y: 0 },
    data,
  };
  if (n.parentId) {
    node.parentId = n.parentId;
    node.extent = "parent";
  }
  return node;
}

function toFlowEdge(e: ArchitectureEdge): Edge<ArchEdgeData> {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    type: "floating",
    label: e.label,
    data: { edgeType: e.meta?.type },
  };
}
