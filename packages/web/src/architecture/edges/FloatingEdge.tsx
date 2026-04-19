import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  useInternalNode,
  type EdgeProps,
} from "@xyflow/react";
import { getEdgeParams } from "./utils";

export function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  style,
  label,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  animated,
}: EdgeProps) {
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
    borderRadius: 8,
  });

  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path${animated ? " react-flow__edge-path--animated" : ""}`}
        d={edgePath}
        markerEnd={markerEnd}
        style={style}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              ...(labelBgStyle
                ? {
                    background: (labelBgStyle as Record<string, unknown>).fill as string,
                    opacity: (labelBgStyle as Record<string, unknown>).fillOpacity as number,
                    borderRadius: labelBgBorderRadius ?? 4,
                    padding: labelBgPadding
                      ? `${(labelBgPadding as [number, number])[1]}px ${(labelBgPadding as [number, number])[0]}px`
                      : "4px 6px",
                  }
                : {}),
            }}
          >
            <span style={labelStyle as React.CSSProperties}>{label}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
