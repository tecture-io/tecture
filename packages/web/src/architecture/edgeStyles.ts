import {
  EDGE_TYPE_KEYS,
  isEdgeAnimated,
  type EdgeTypeKey,
  type GraphAppearance,
} from "@tecture/shared";

const EDGE_LABELS: Record<EdgeTypeKey, string> = {
  calls: "Calls",
  "data-flow": "Data Flow",
  publishes: "Publishes",
  subscribes: "Subscribes",
  reads: "Reads",
  writes: "Writes",
  default: "Connection",
};

export interface EdgeStyleDef {
  color: string;
  /** Resolved dash pattern, or undefined for a solid line. */
  dashArray: string | undefined;
  animated: boolean;
  label: string;
}

/**
 * Precedence: a type's `dashed` flag decides whether it is dashed and the
 * global `edge.dashPattern` decides how; the global `edge.animation` mode
 * (`always`/`never`) overrides a type's `animated` flag, `auto` defers to it.
 */
export function getEdgeStyleDef(
  appearance: GraphAppearance,
  type?: string,
): EdgeStyleDef {
  const key: EdgeTypeKey =
    type && (EDGE_TYPE_KEYS as readonly string[]).includes(type)
      ? (type as EdgeTypeKey)
      : "default";
  const t = appearance.edgeTypes[key];
  return {
    color: t.color,
    dashArray: t.dashed ? appearance.edge.dashPattern : undefined,
    animated: isEdgeAnimated(appearance, t),
    label: EDGE_LABELS[key],
  };
}
