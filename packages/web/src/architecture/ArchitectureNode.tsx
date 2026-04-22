import { memo, useCallback, useContext } from "react";
import {
  Handle,
  NodeResizer,
  Position,
  useNodeId,
  useStore,
  type NodeProps,
  type ReactFlowState,
} from "@xyflow/react";
import { getNodeStyle, type NodeStyle } from "./nodeStyles";
import type { ArchNodeData } from "./transform";
import { useActiveHandleSides } from "./hooks/useActiveHandleSides";
import { LayoutPersistenceContext } from "./LayoutPersistenceContext";

const HANDLE_SIDES = [
  { position: Position.Top, prefix: "top" },
  { position: Position.Bottom, prefix: "bottom" },
  { position: Position.Left, prefix: "left" },
  { position: Position.Right, prefix: "right" },
] as const;

function ArchitectureNodeInner({ data, selected }: NodeProps) {
  const d = data as ArchNodeData;
  const style = getNodeStyle(d.nodeType);
  const activeSides = useActiveHandleSides();

  const handleDrillDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (d.subDiagramId) {
      window.location.hash = `#/diagram/${d.subDiagramId}`;
    }
  };

  if (d.isContainer || d.hasChildren) {
    return (
      <ContainerNode
        d={d}
        style={style}
        selected={selected ?? false}
        activeSides={activeSides}
        onDrillDown={handleDrillDown}
      />
    );
  }

  return (
    <div
      className={`group relative border px-5 py-4 text-center ${d.hasSubDiagram ? "transition-shadow duration-200 hover:ring-1 hover:ring-offset-1 hover:ring-offset-transparent" : ""}`}
      style={{
        background: style.bg,
        borderColor: style.border,
        color: style.text,
        minWidth: 160,
        cursor: "pointer",
        ["--tw-ring-color" as string]: d.hasSubDiagram ? style.accent : undefined,
      } as React.CSSProperties}
    >
      <CornerMarks accent={style.accent} />

      {HANDLE_SIDES.map(({ position, prefix }) => {
        const isActive = activeSides.has(position);
        return (
          <HandlePair
            key={prefix}
            position={position}
            prefix={prefix}
            style={style}
            isActive={isActive}
          />
        );
      })}

      <div className="mx-auto mb-2.5 flex items-center justify-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          {style.iconPaths.map((p, i) => (
            <path
              key={i}
              d={p.d}
              fill={p.fill ?? "none"}
              stroke={p.stroke ?? "none"}
              strokeWidth={p.strokeWidth ?? 0}
              opacity={p.opacity ?? 1}
            />
          ))}
        </svg>
      </div>

      <div
        className="truncate text-[13px] leading-tight font-semibold tracking-tight"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {d.label}
      </div>

      {d.technology && (
        <div
          className="mx-auto mt-1 w-fit px-1.5 py-px text-[9px] leading-tight font-medium"
          style={{
            color: `${style.accent}99`,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.08em",
          }}
        >
          {d.technology}
        </div>
      )}

      {d.hasSubDiagram && (
        <div
          onClick={handleDrillDown}
          className="mx-auto mt-2 flex w-fit cursor-pointer items-center gap-1 px-2.5 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80"
          style={{
            background: `${style.accent}10`,
            color: style.accent,
            border: `1px solid ${style.accent}25`,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.05em",
          }}
        >
          <span>Drill down</span>
          <DrillDownChevron />
        </div>
      )}
    </div>
  );
}

interface ContainerNodeProps {
  d: ArchNodeData;
  style: NodeStyle;
  selected: boolean;
  activeSides: Set<string>;
  onDrillDown: (e: React.MouseEvent) => void;
}

const CONTAINER_PADDING = 16;
const CONTAINER_HEADER = 48;

function ContainerNode({ d, style, selected, activeSides, onDrillDown }: ContainerNodeProps) {
  const nodeId = useNodeId();
  const persistence = useContext(LayoutPersistenceContext);
  const onResizeEnd = useCallback(() => {
    persistence?.notifyLayoutChanged();
  }, [persistence]);
  const minSize = useStore(
    useCallback(
      (state: ReactFlowState) => {
        let minWidth = 200;
        let minHeight = CONTAINER_HEADER + 40;
        if (!nodeId) return { minWidth, minHeight };
        for (const child of state.nodeLookup.values()) {
          if (child.parentId !== nodeId) continue;
          const w = child.measured?.width ?? 220;
          const h = child.measured?.height ?? 80;
          const right = (child.position?.x ?? 0) + w + CONTAINER_PADDING;
          const bottom = (child.position?.y ?? 0) + h + CONTAINER_PADDING;
          if (right > minWidth) minWidth = right;
          if (bottom > minHeight) minHeight = bottom;
        }
        return { minWidth, minHeight };
      },
      [nodeId],
    ),
    (a, b) => a.minWidth === b.minWidth && a.minHeight === b.minHeight,
  );

  return (
    <div
      className="group relative"
      style={{
        width: "100%",
        height: "100%",
        background: `${style.accent}08`,
        border: `1.5px dashed ${style.accent}80`,
        color: style.text,
        cursor: "pointer",
        boxShadow: `inset 0 0 0 1px ${style.accent}14`,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={minSize.minWidth}
        minHeight={minSize.minHeight}
        onResizeEnd={onResizeEnd}
        lineStyle={{
          borderColor: `${style.accent}55`,
          borderWidth: 1,
        }}
        handleStyle={{
          width: 9,
          height: 9,
          background: style.accent,
          border: `2px solid ${style.bg}`,
          borderRadius: 0,
          boxShadow: `0 0 0 1px ${style.accent}`,
        }}
      />
      <CornerMarks accent={style.accent} />

      {HANDLE_SIDES.map(({ position, prefix }) => {
        const isActive = activeSides.has(position);
        return (
          <HandlePair
            key={prefix}
            position={position}
            prefix={prefix}
            style={style}
            isActive={isActive}
          />
        );
      })}

      <div
        className="pointer-events-auto absolute top-0 right-0 left-0 flex items-center justify-between gap-2 px-3 py-2"
        style={{
          borderBottom: `1px dashed ${style.accent}55`,
          background: `${style.bg}e6`,
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            {style.iconPaths.map((p, i) => (
              <path
                key={i}
                d={p.d}
                fill={p.fill ?? "none"}
                stroke={p.stroke ?? "none"}
                strokeWidth={p.strokeWidth ?? 0}
                opacity={p.opacity ?? 1}
              />
            ))}
          </svg>
          <div
            className="truncate text-[12px] leading-tight font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {d.label}
          </div>
          {d.technology && (
            <span
              className="shrink-0 text-[9px] leading-tight font-medium"
              style={{
                color: `${style.accent}99`,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
              }}
            >
              {d.technology}
            </span>
          )}
        </div>
        {d.hasSubDiagram && (
          <div
            onClick={onDrillDown}
            className="flex shrink-0 cursor-pointer items-center gap-1 px-2 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80"
            style={{
              background: `${style.accent}10`,
              color: style.accent,
              border: `1px solid ${style.accent}25`,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.05em",
            }}
          >
            <span>Drill down</span>
            <DrillDownChevron />
          </div>
        )}
      </div>
    </div>
  );
}

function CornerMarks({ accent }: { accent: string }) {
  return (
    <>
      <svg
        className="pointer-events-none absolute top-0 left-0"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <path
          d="M0 12 L0 0 L12 0"
          stroke={accent}
          strokeWidth="1.5"
          fill="none"
          opacity="0.3"
        />
      </svg>
      <svg
        className="pointer-events-none absolute right-0 bottom-0"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <path
          d="M12 0 L12 12 L0 12"
          stroke={accent}
          strokeWidth="1.5"
          fill="none"
          opacity="0.3"
        />
      </svg>
    </>
  );
}

function HandlePair({
  position,
  prefix,
  style,
  isActive,
}: {
  position: Position;
  prefix: string;
  style: NodeStyle;
  isActive: boolean;
}) {
  const hStyle: React.CSSProperties = {
    background: style.accent,
    width: 6,
    height: 6,
    border: `2px solid ${style.bg}`,
    boxShadow: `0 0 0 1px ${style.accent}`,
    opacity: isActive ? 1 : 0,
    transition: "opacity 0.2s ease",
    borderRadius: 0,
  };
  return (
    <span>
      <Handle
        type="source"
        position={position}
        id={`${prefix}-source`}
        isConnectable={false}
        style={hStyle}
      />
      <Handle
        type="target"
        position={position}
        id={`${prefix}-target`}
        isConnectable={false}
        style={hStyle}
      />
    </span>
  );
}

function DrillDownChevron() {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export const ArchitectureNode = memo(ArchitectureNodeInner);
