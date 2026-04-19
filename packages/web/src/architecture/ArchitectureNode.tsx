import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { getNodeStyle } from "./nodeStyles";
import type { ArchNodeData } from "./transform";
import { useActiveHandleSides } from "./hooks/useActiveHandleSides";

const HANDLE_SIDES = [
  { position: Position.Top, prefix: "top" },
  { position: Position.Bottom, prefix: "bottom" },
  { position: Position.Left, prefix: "left" },
  { position: Position.Right, prefix: "right" },
] as const;

function ArchitectureNodeInner({ data }: NodeProps) {
  const d = data as ArchNodeData;
  const style = getNodeStyle(d.nodeType);
  const activeSides = useActiveHandleSides();

  const handleDrillDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (d.subDiagramId) {
      window.location.hash = `#/diagram/${d.subDiagramId}`;
    }
  };

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
      <svg
        className="pointer-events-none absolute top-0 left-0"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <path
          d="M0 12 L0 0 L12 0"
          stroke={style.accent}
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
          stroke={style.accent}
          strokeWidth="1.5"
          fill="none"
          opacity="0.3"
        />
      </svg>

      {HANDLE_SIDES.map(({ position, prefix }) => {
        const isActive = activeSides.has(position);
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
          <span key={prefix}>
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
        </div>
      )}
    </div>
  );
}

export const ArchitectureNode = memo(ArchitectureNodeInner);
