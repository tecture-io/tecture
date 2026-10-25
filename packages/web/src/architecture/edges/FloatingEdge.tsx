import { useLayoutEffect, useMemo, useRef } from "react";
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  Position,
  useInternalNode,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { getEdgeParams } from "./utils";
import {
  candidateFractions,
  candidatesAt,
  directionGlyph,
  useLabelLayoutStore,
  useLabelPlacement,
  type LabelCandidate,
} from "./labelLayout";
import type { ArchEdgeData } from "../transform";

/** Distance between the lines of edges that join the same two nodes. */
const PARALLEL_SPACING = 14;

let measurePath: SVGPathElement | null = null;

/** Label candidates at `fractions` of the way along path `d`. */
function sampleCandidates(
  d: string,
  fractions: number[],
  sideX: number,
  sideY: number,
): LabelCandidate[] {
  if (typeof document === "undefined") return [];
  measurePath ??= document.createElementNS("http://www.w3.org/2000/svg", "path");
  measurePath.setAttribute("d", d);
  const total = measurePath.getTotalLength();
  if (!Number.isFinite(total) || total === 0) return [];
  return fractions.flatMap((f) => {
    const at = total * f;
    const p = measurePath!.getPointAtLength(at);
    const a = measurePath!.getPointAtLength(Math.max(0, at - 1));
    const b = measurePath!.getPointAtLength(Math.min(total, at + 1));
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    return candidatesAt(p.x, p.y, angle, sideX, sideY);
  });
}

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
  data,
}: EdgeProps<Edge<ArchEdgeData>>) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const labelStore = useLabelLayoutStore();
  const placement = useLabelPlacement(labelStore, id);
  const labelRef = useRef<HTMLDivElement>(null);

  const parallelIndex = data?.parallelIndex ?? 0;
  const parallelCount = data?.parallelCount ?? 1;
  const params =
    sourceNode && targetNode ? getEdgeParams(sourceNode, targetNode) : null;

  let edgePath = "";
  let labelX = 0;
  let labelY = 0;
  // Signs of this edge's offset on vertical / horizontal segments.
  let sideX = 0;
  let sideY = 0;
  if (params) {
    const { sx, sy, tx, ty, sourcePos, targetPos } = params;
    // Same absolute shift on both ends for every edge of the pair, whichever
    // way it points, so A→B and B→A run on separate lines. The middle segment
    // of the step moves perpendicular to the turn so the lines never cross.
    const shift = (parallelIndex - (parallelCount - 1) / 2) * PARALLEL_SPACING;
    const midShift = -shift * Math.sign((tx - sx) * (ty - sy));
    const horizontal =
      sourcePos === Position.Left || sourcePos === Position.Right;
    const [dx, dy] = horizontal ? [0, shift] : [shift, 0];
    const sX = sx + dx;
    const sY = sy + dy;
    const tX = tx + dx;
    const tY = ty + dy;
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX: sX,
      sourceY: sY,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
      targetX: tX,
      targetY: tY,
      borderRadius: 8,
      ...(horizontal
        ? { centerX: (sX + tX) / 2 + midShift }
        : { centerY: (sY + tY) / 2 + midShift }),
    });
    sideX = horizontal ? midShift : shift;
    sideY = horizontal ? shift : midShift;
  }

  const showLabel = Boolean(label) && params !== null;
  // Fractions run along the pair's canonical direction (lower id → higher id).
  const reversed = source > target;
  const candidates = useMemo(
    () =>
      showLabel
        ? sampleCandidates(
            edgePath,
            candidateFractions(parallelIndex, parallelCount, reversed),
            sideX,
            sideY,
          )
        : [],
    [showLabel, edgePath, parallelIndex, parallelCount, reversed, sideX, sideY],
  );

  // Re-measures when the label's text or box styling changes.
  useLayoutEffect(() => {
    if (!labelStore) return;
    const el = labelRef.current;
    if (!el || candidates.length === 0) {
      labelStore.unregister(id);
      return;
    }
    labelStore.register(id, {
      width: el.offsetWidth,
      height: el.offsetHeight,
      candidates,
    });
  }, [labelStore, id, candidates, label, labelStyle, labelBgStyle, labelBgPadding]);

  useLayoutEffect(() => () => labelStore?.unregister(id), [labelStore, id]);

  if (!params) return null;

  const spot = placement ?? {
    x: labelX,
    y: labelY,
    angle: candidates[0]?.angle ?? 0,
  };
  // Edges sharing a node pair say which way they point, beside their own line.
  const glyph = parallelCount > 1 ? directionGlyph(spot.angle) : null;

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
            ref={labelRef}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${spot.x}px, ${spot.y}px)`,
              pointerEvents: "all",
              ...(labelBgStyle
                ? {
                    background: resolveLabelBg(labelBgStyle),
                    borderRadius: labelBgBorderRadius ?? 4,
                    padding: labelBgPadding
                      ? `${(labelBgPadding as [number, number])[1]}px ${(labelBgPadding as [number, number])[0]}px`
                      : "4px 6px",
                  }
                : {}),
            }}
          >
            <span style={labelStyle as React.CSSProperties}>
              {glyph && (
                <span aria-hidden style={{ color: style?.stroke, marginRight: "0.5ch" }}>
                  {glyph}
                </span>
              )}
              {label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

function resolveLabelBg(labelBgStyle: unknown): string {
  const s = labelBgStyle as { fill?: string; fillOpacity?: number };
  const fill = s.fill ?? "#0a0f1a";
  const alpha = s.fillOpacity ?? 1;
  if (alpha >= 1) return fill;
  const hex = fill.replace("#", "");
  if (hex.length !== 3 && hex.length !== 6) return fill;
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
