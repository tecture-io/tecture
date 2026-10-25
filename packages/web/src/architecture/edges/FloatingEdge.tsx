import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  useInternalNode,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { getEdgeParams } from "./utils";
import { getEdgeStyleDef } from "../edgeStyles";
import { useAppearance, withAlpha } from "../AppearanceContext";
import type { ArchEdgeData } from "../transform";

export function FloatingEdge({
  id,
  source,
  target,
  label,
  data,
}: EdgeProps<Edge<ArchEdgeData>>) {
  const appearance = useAppearance();
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) return null;

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode,
  );

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
    borderRadius: appearance.edge.cornerRadius,
  });

  const def = getEdgeStyleDef(appearance, data?.edgeType);
  const { edgeLabel } = appearance;
  const markerId = `arrow-${id}`;
  const arrow = appearance.edge.arrowSize;

  return (
    <>
      <defs>
        <marker
          id={markerId}
          viewBox="-10 -10 20 20"
          refX="0"
          refY="0"
          markerWidth={arrow}
          markerHeight={arrow}
          markerUnits="strokeWidth"
          orient="auto-start-reverse"
        >
          <polyline
            points="-5,-4 0,0 -5,4 -5,-4"
            fill={def.color}
            stroke={def.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
          />
        </marker>
      </defs>
      <path
        id={id}
        className={`react-flow__edge-path${def.animated ? " react-flow__edge-path--animated" : ""}`}
        d={edgePath}
        markerEnd={`url(#${markerId})`}
        style={{
          stroke: def.color,
          strokeWidth: appearance.edge.strokeWidth,
          strokeDasharray: def.dashArray,
        }}
      />
      {label && edgeLabel.visible && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              background: withAlpha(
                edgeLabel.backgroundColor,
                edgeLabel.backgroundOpacity,
              ),
              border: edgeLabel.borderColor
                ? `1px solid ${edgeLabel.borderColor}`
                : undefined,
              borderRadius: edgeLabel.borderRadius,
              padding: `${edgeLabel.paddingY}px ${edgeLabel.paddingX}px`,
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: edgeLabel.fontSize,
                color: edgeLabel.textColor,
                fontWeight: edgeLabel.fontWeight,
                letterSpacing: "0.04em",
                fontFamily: "var(--font-mono)",
                textAlign: "center",
                ...(edgeLabel.wrap
                  ? {
                      // Mono font: 1ch = one character; add the per-char letter-spacing.
                      maxWidth: `calc(${edgeLabel.wrapAt}ch + ${edgeLabel.wrapAt * 0.04}em)`,
                      whiteSpace: "normal",
                      overflowWrap: "anywhere",
                    }
                  : { whiteSpace: "nowrap" }),
              }}
            >
              {label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
