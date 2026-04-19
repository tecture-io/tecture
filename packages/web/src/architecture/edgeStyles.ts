export interface EdgeStyleDef {
  color: string;
  dashed: boolean;
  animated: boolean;
  label: string;
}

const edgeStyles: Record<string, EdgeStyleDef> = {
  calls: { color: "#818cf8", dashed: false, animated: false, label: "Calls" },
  "data-flow": { color: "#34d399", dashed: false, animated: true, label: "Data Flow" },
  publishes: { color: "#fbbf24", dashed: true, animated: false, label: "Publishes" },
  subscribes: { color: "#fbbf24", dashed: true, animated: false, label: "Subscribes" },
  reads: { color: "#34d399", dashed: false, animated: false, label: "Reads" },
  writes: { color: "#fb923c", dashed: false, animated: false, label: "Writes" },
};

const defaultEdgeStyle: EdgeStyleDef = {
  color: "#22d3ee",
  dashed: false,
  animated: false,
  label: "Connection",
};

export function getEdgeStyleDef(type?: string): EdgeStyleDef {
  return type ? (edgeStyles[type] ?? defaultEdgeStyle) : defaultEdgeStyle;
}
