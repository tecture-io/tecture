import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { ApiDiagram, ArchitectureNode, ArchitectureEdge } from "@tecture/shared";
import { getEdgeStyleDef } from "./edgeStyles";

export interface ArchNodeData extends Record<string, unknown> {
  label: string;
  nodeType?: string;
  technology?: string;
  hasSubDiagram: boolean;
  subDiagramId?: string;
  isContainer: boolean;
  hasChildren: boolean;
}

export function diagramToFlow(diagram: ApiDiagram): {
  nodes: Node<ArchNodeData>[];
  edges: Edge[];
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

function toFlowEdge(e: ArchitectureEdge): Edge {
  const def = getEdgeStyleDef(e.meta?.type);
  const style: Record<string, unknown> = { strokeWidth: 1.5, stroke: def.color };
  if (def.dashed) style.strokeDasharray = "5 5";

  return {
    id: e.id,
    source: e.source,
    target: e.target,
    type: "floating",
    label: e.label,
    animated: def.animated,
    style,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: def.color,
    },
    labelStyle: {
      fontSize: 10,
      fill: "#94a3b8",
      fontWeight: 500,
      letterSpacing: "0.04em",
      fontFamily: "var(--font-mono)",
    },
    labelBgStyle: {
      fill: "#0a0f1a",
      fillOpacity: 0.92,
    },
    labelBgPadding: [6, 4] as [number, number],
    labelBgBorderRadius: 4,
  };
}
