import { useMemo, useState } from "react";
import { Panel } from "@xyflow/react";
import type { ApiDiagram } from "@tecture/shared";
import { getNodeStyle, type IconPath, type NodeStyle } from "./nodeStyles";
import { getEdgeStyleDef, type EdgeStyleDef } from "./edgeStyles";

interface Props {
  diagram: ApiDiagram;
}

export function Legend({ diagram }: Props) {
  const [open, setOpen] = useState(false);

  const { nodeTypes, edgeTypes } = useMemo(() => {
    const n = new Set<string>();
    const e = new Set<string>();
    for (const node of diagram.nodes) {
      if (typeof node.meta?.type === "string") n.add(node.meta.type);
    }
    for (const edge of diagram.edges) {
      if (typeof edge.meta?.type === "string") e.add(edge.meta.type);
    }
    return { nodeTypes: [...n].sort(), edgeTypes: [...e].sort() };
  }, [diagram]);

  if (nodeTypes.length === 0 && edgeTypes.length === 0) return null;

  return (
    <Panel position="top-right" className="!m-3">
      <div
        className="flex flex-col border shadow-lg backdrop-blur-md"
        style={{
          background: "rgba(10, 15, 26, 0.85)",
          borderColor: "#1e2d4a",
          color: "var(--text, #e2e8f0)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors hover:text-white"
          style={{ color: "var(--text-muted, #94a3b8)" }}
          aria-expanded={open}
        >
          <LegendGlyph />
          <span>Legend</span>
          <Chevron open={open} />
        </button>

        {open && (
          <div
            className="flex flex-col gap-3 border-t px-3 py-2.5"
            style={{ borderColor: "#1e2d4a", minWidth: 180 }}
          >
            {nodeTypes.length > 0 && (
              <Section title="Nodes">
                {nodeTypes.map((t) => (
                  <NodeRow key={t} type={t} style={getNodeStyle(t)} />
                ))}
              </Section>
            )}
            {edgeTypes.length > 0 && (
              <Section title="Edges">
                {edgeTypes.map((t) => (
                  <EdgeRow key={t} style={getEdgeStyleDef(t)} />
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="text-[9px] tracking-[0.25em] uppercase"
        style={{ color: "var(--text-muted, #64748b)" }}
      >
        {title}
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function NodeRow({ type, style }: { type: string; style: NodeStyle }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center border"
        style={{ background: style.bg, borderColor: style.border }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          {style.iconPaths.map((p, i) => (
            <IconPathEl key={i} p={p} />
          ))}
        </svg>
      </span>
      <span style={{ color: style.accent }}>{style.label}</span>
      {style.label.toLowerCase() !== type && (
        <span
          className="text-[9px] uppercase tracking-wider"
          style={{ color: "var(--text-muted, #64748b)" }}
        >
          {type}
        </span>
      )}
    </div>
  );
}

function EdgeRow({ style }: { style: EdgeStyleDef }) {
  const dash = style.dashed ? "4 3" : undefined;
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <svg width="28" height="10" className="shrink-0">
        <line
          x1="1"
          y1="5"
          x2="22"
          y2="5"
          stroke={style.color}
          strokeWidth="1.5"
          strokeDasharray={dash}
        />
        <polygon
          points="22,2 28,5 22,8"
          fill={style.color}
        />
        {style.animated && (
          <circle cx="12" cy="5" r="1.5" fill={style.color}>
            <animate
              attributeName="cx"
              from="1"
              to="22"
              dur="1.4s"
              repeatCount="indefinite"
            />
          </circle>
        )}
      </svg>
      <span style={{ color: style.color }}>{style.label}</span>
    </div>
  );
}

function IconPathEl({ p }: { p: IconPath }) {
  return (
    <path
      d={p.d}
      fill={p.fill ?? "none"}
      stroke={p.stroke ?? "none"}
      strokeWidth={p.strokeWidth ?? 0}
      opacity={p.opacity ?? 1}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function LegendGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="4" width="7" height="7" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
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
      style={{
        transform: `rotate(${open ? 180 : 0}deg)`,
        transition: "transform 0.15s ease",
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
