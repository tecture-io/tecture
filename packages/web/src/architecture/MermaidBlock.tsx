import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

let initialized = false;

async function getMermaid() {
  const mod = await import("mermaid");
  const mermaid = mod.default;
  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "strict",
      fontFamily:
        '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      themeVariables: {
        background: "#0a0f1a",
        primaryColor: "#0f1628",
        primaryBorderColor: "#1e3a5f",
        primaryTextColor: "#e2e8f0",
        secondaryColor: "#141d33",
        secondaryBorderColor: "#1e2d4a",
        secondaryTextColor: "#e2e8f0",
        tertiaryColor: "#0d1320",
        tertiaryBorderColor: "#1e2d4a",
        tertiaryTextColor: "#e2e8f0",
        lineColor: "#64748b",
        textColor: "#e2e8f0",
        mainBkg: "#0f1628",
        nodeBorder: "#1e3a5f",
        clusterBkg: "rgba(20, 29, 51, 0.6)",
        clusterBorder: "#1e2d4a",
        actorBkg: "#0f1628",
        actorBorder: "#1e3a5f",
        actorTextColor: "#e2e8f0",
        actorLineColor: "#64748b",
        signalColor: "#94a3b8",
        signalTextColor: "#e2e8f0",
        labelBoxBkgColor: "#141d33",
        labelBoxBorderColor: "#1e2d4a",
        labelTextColor: "#e2e8f0",
        noteBkgColor: "#18140a",
        noteBorderColor: "#854d0e",
        noteTextColor: "#fef3c7",
      },
    });
    initialized = true;
  }
  return mermaid;
}

interface Props {
  chart: string;
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; svg: string };

export function MermaidBlock({ chart }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [expanded, setExpanded] = useState(false);
  const rawId = useId();
  const elementId = `mermaid-${rawId.replace(/:/g, "")}`;

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    (async () => {
      try {
        const mermaid = await getMermaid();
        await mermaid.parse(chart);
        const { svg } = await mermaid.render(elementId, chart);
        if (!cancelled) setState({ status: "ready", svg });
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to render diagram";
        setState({ status: "error", message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, elementId]);

  if (state.status === "loading") {
    return (
      <div
        className="mermaid-block"
        style={{
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
        }}
      >
        Rendering diagram…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mermaid-block">
        <div
          className="mb-1"
          style={{
            color: "var(--accent-amber)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
          }}
        >
          Mermaid error: {state.message}
        </div>
        <pre style={{ margin: 0 }}>
          <code className="lang-mermaid">{chart}</code>
        </pre>
      </div>
    );
  }

  return (
    <>
      <div className="mermaid-block group relative">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Enlarge diagram"
          title="Enlarge diagram"
          className="mermaid-enlarge absolute top-2 right-2 flex h-7 w-7 items-center justify-center border transition-colors"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "rgba(10, 15, 26, 0.85)",
            color: "var(--text-muted)",
            backdropFilter: "blur(6px)",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>
        <div
          className="mermaid-svg"
          style={{ overflowX: "auto" }}
          dangerouslySetInnerHTML={{ __html: state.svg }}
        />
      </div>
      {expanded && (
        <MermaidLightbox svg={state.svg} onClose={() => setExpanded(false)} />
      )}
    </>
  );
}

function MermaidLightbox({
  svg,
  onClose,
}: {
  svg: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Enlarged diagram"
      onClick={onClose}
      className="animate-fade-up fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(10, 15, 26, 0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animationDuration: "0.18s",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col border shadow-2xl"
        style={{
          borderColor: "var(--border-default)",
          backgroundColor: "rgba(10, 15, 26, 0.95)",
          maxWidth: "92vw",
          maxHeight: "90vh",
        }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-3"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div
            className="blueprint-annotation"
            style={{ color: "var(--accent-cyan)" }}
          >
            Diagram
          </div>
          <div
            className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span>ESC to close</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close diagram"
              className="flex h-7 w-7 items-center justify-center border transition-colors hover:text-white"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-muted)",
                backgroundColor: "transparent",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <div
          className="mermaid-lightbox-body"
          style={{
            padding: 24,
            overflow: "auto",
            maxHeight: "calc(90vh - 52px)",
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>,
    document.body,
  );
}
