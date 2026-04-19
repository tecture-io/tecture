import { useState } from "react";
import type { ApiArchitectureSummary, ApiDiagramSummary } from "@tecture/shared";

interface Props {
  summary: ApiArchitectureSummary | null;
  currentDiagramId: string | null;
  onSelect: (slug: string) => void;
  onGoHome: () => void;
}

export function DiagramList({
  summary,
  currentDiagramId,
  onSelect,
  onGoHome,
}: Props) {
  const [open, setOpen] = useState(true);
  const atEntry =
    summary != null && currentDiagramId === summary.topDiagram;

  return (
    <div className="absolute top-3 left-3 z-10 w-64">
      <div
        className="border shadow-lg backdrop-blur-md"
        style={{
          borderColor: "var(--border-default)",
          backgroundColor: "rgba(10, 15, 26, 0.85)",
        }}
      >
        {/* Title block — architecture identity + entry return */}
        <button
          type="button"
          onClick={onGoHome}
          disabled={atEntry}
          className="group flex w-full flex-col items-start gap-1 px-3 pt-2.5 pb-3 text-left transition-colors disabled:cursor-default"
          style={{
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--border-default)",
            cursor: atEntry ? "default" : "pointer",
          }}
          title={atEntry ? undefined : "Return to entry diagram"}
          aria-label={
            atEntry
              ? "Architecture title block"
              : "Return to entry diagram"
          }
        >
          <div className="flex w-full items-center justify-between">
            <span
              className="text-[9px] tracking-[0.32em] uppercase"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Architecture
            </span>
            {!atEntry && (
              <span
                className="flex items-center gap-1 text-[9px] tracking-[0.2em] uppercase opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                style={{
                  color: "var(--accent-cyan)",
                  fontFamily: "var(--font-mono)",
                }}
              >
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
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Entry
              </span>
            )}
          </div>
          <span
            className="truncate text-[15px] leading-tight font-semibold tracking-tight transition-colors group-hover:text-white group-focus-visible:text-white"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
              maxWidth: "100%",
            }}
          >
            {summary?.name ?? "…"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2 transition-colors hover:text-white"
          style={{
            color: "var(--text-muted)",
            background: "transparent",
            border: "none",
            borderBottom: open
              ? `1px solid var(--border-default)`
              : "1px solid transparent",
          }}
          aria-expanded={open}
        >
          <span
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Diagrams {summary ? `· ${summary.diagrams.length}` : ""}
          </span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: open ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 150ms ease",
            }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {open && (
          <ul className="max-h-[60vh] overflow-y-auto py-1">
            {summary?.diagrams.map((d) => (
              <DiagramRow
                key={d.slug}
                diagram={d}
                active={d.slug === currentDiagramId}
                isTop={d.slug === summary.topDiagram}
                onSelect={onSelect}
              />
            ))}
            {!summary && (
              <li
                className="px-3 py-2 text-[11px]"
                style={{
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Loading…
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function DiagramRow({
  diagram,
  active,
  isTop,
  onSelect,
}: {
  diagram: ApiDiagramSummary;
  active: boolean;
  isTop: boolean;
  onSelect: (slug: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(diagram.slug)}
        className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors"
        style={{
          background: active ? "rgba(34, 211, 238, 0.08)" : "transparent",
          borderLeft: active
            ? "2px solid var(--accent-cyan)"
            : "2px solid transparent",
          color: active ? "var(--text-primary)" : "var(--text-secondary)",
          cursor: "pointer",
          border: "none",
          borderLeftWidth: "2px",
        }}
      >
        <div className="flex w-full items-center gap-2">
          <span
            className="text-[9px] tracking-[0.2em] uppercase"
            style={{
              color: active ? "var(--accent-cyan)" : "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            L{diagram.level ?? "?"}
          </span>
          <span
            className="truncate text-[13px] leading-tight font-medium"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {diagram.name}
          </span>
          {isTop && (
            <span
              className="ml-auto px-1 py-px text-[8px] tracking-[0.2em] uppercase"
              style={{
                color: "var(--accent-amber)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Entry
            </span>
          )}
        </div>
        <span
          className="text-[10px] tracking-wider"
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {diagram.nodeCount}n · {diagram.edgeCount}e
        </span>
      </button>
    </li>
  );
}
