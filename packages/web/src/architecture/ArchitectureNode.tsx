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
import { getNodeStyle, type IconPath, type NodeStyle } from "./nodeStyles";
import { useAppearance, withAlpha } from "./AppearanceContext";
import type { ArchNodeData } from "./transform";
import type { GraphAppearance } from "@tecture/shared";
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
  const appearance = useAppearance();
  const style = getNodeStyle(appearance, d.nodeType);
  const nodeOpts = appearance.node;
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
        borderRadius: nodeOpts.borderRadius,
        minWidth: nodeOpts.minWidth,
        cursor: "pointer",
        ["--tw-ring-color" as string]: d.hasSubDiagram ? style.accent : undefined,
      } as React.CSSProperties}
    >
      {showCornerMarks(nodeOpts) && <CornerMarks accent={style.accent} />}

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

      {nodeOpts.showIcons && (
        <div className="mx-auto mb-2.5 flex items-center justify-center">
          <NodeIcon paths={style.iconPaths} accent={style.accent} size={28} />
        </div>
      )}

      <div
        className="truncate leading-tight font-semibold tracking-tight"
        style={{ fontFamily: "var(--font-sans)", fontSize: nodeOpts.labelFontSize }}
      >
        {d.label}
      </div>

      {d.technology && (
        <div
          className="mx-auto mt-1 w-fit px-1.5 py-px leading-tight font-medium"
          style={{
            fontSize: nodeOpts.technologyFontSize,
            color: withAlpha(style.accent, 0.6),
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
            background: withAlpha(style.accent, 0.06),
            color: style.accent,
            border: `1px solid ${withAlpha(style.accent, 0.15)}`,
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
  const { container, node: nodeOpts } = useAppearance();
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
        background: withAlpha(style.accent, container.backgroundOpacity),
        border: `${container.borderWidth}px ${container.borderStyle} ${withAlpha(style.accent, 0.5)}`,
        borderRadius: nodeOpts.borderRadius,
        color: style.text,
        cursor: "pointer",
        boxShadow: `inset 0 0 0 1px ${withAlpha(style.accent, 0.08)}`,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={minSize.minWidth}
        minHeight={minSize.minHeight}
        onResizeEnd={onResizeEnd}
        lineStyle={{
          borderColor: withAlpha(style.accent, 0.33),
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
      {showCornerMarks(nodeOpts) && <CornerMarks accent={style.accent} />}

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
          borderBottom: `1px ${container.borderStyle} ${withAlpha(style.accent, 0.33)}`,
          background: withAlpha(style.bg, container.headerOpacity),
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          {nodeOpts.showIcons && (
            <NodeIcon paths={style.iconPaths} accent={style.accent} size={16} />
          )}
          <div
            className="truncate leading-tight font-semibold tracking-tight"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: Math.max(nodeOpts.labelFontSize - 1, 8),
            }}
          >
            {d.label}
          </div>
          {d.technology && (
            <span
              className="shrink-0 leading-tight font-medium"
              style={{
                fontSize: nodeOpts.technologyFontSize,
                color: withAlpha(style.accent, 0.6),
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
              background: withAlpha(style.accent, 0.06),
              color: style.accent,
              border: `1px solid ${withAlpha(style.accent, 0.15)}`,
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

function NodeIcon({
  paths,
  accent,
  size,
}: {
  paths: IconPath[];
  accent: string;
  size: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill={p.fill ? accent : "none"}
          stroke={p.stroke ? accent : "none"}
          strokeWidth={p.strokeWidth ?? 0}
          opacity={p.opacity ?? 1}
        />
      ))}
    </svg>
  );
}

/** The square marks sit on the box corners, so a rounded box would leave them sticking out. */
function showCornerMarks(opts: GraphAppearance["node"]): boolean {
  return opts.showCornerMarks && opts.borderRadius === 0;
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
