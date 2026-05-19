import { useEffect, useState } from "react";
import type { BundlePhase, BundleState } from "./ArchitectureBundleContext";

const PHASE_LABELS: Record<BundlePhase, string> = {
  summary: "Reading manifest",
  diagrams: "Loading diagrams",
  descriptions: "Loading node details",
};

const SPLASH_DELAY_MS = 150;

interface Props {
  state: Exclude<BundleState, { status: "ready" }>;
}

export function LoadingSplash({ state }: Props) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (state.status === "error") {
      setShouldRender(true);
      return;
    }
    const t = setTimeout(() => setShouldRender(true), SPLASH_DELAY_MS);
    return () => clearTimeout(t);
  }, [state.status]);

  if (!shouldRender) {
    return (
      <div
        className="blueprint-grid h-screen w-screen"
        style={{ backgroundColor: "var(--bg-deep)" }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className="blueprint-grid flex h-screen w-screen items-center justify-center"
      style={{ backgroundColor: "var(--bg-deep)" }}
      role="status"
      aria-live="polite"
    >
      <div
        className="animate-fade-up min-w-[320px] max-w-[420px] border px-6 py-5 shadow-lg backdrop-blur-md"
        style={{
          borderColor: "var(--border-default)",
          backgroundColor: "rgba(10, 15, 26, 0.85)",
        }}
      >
        {state.status === "error" ? (
          <ErrorCard message={state.message} />
        ) : (
          <LoadingCard state={state} />
        )}
      </div>
    </div>
  );
}

function LoadingCard({
  state,
}: {
  state: Extract<BundleState, { status: "loading" }>;
}) {
  const { phase, done, total, archName } = state;
  const ratio = total > 0 ? Math.min(1, done / total) : 0;
  const showProgressNumbers = phase !== "summary";

  return (
    <>
      <div
        className="text-[9px] tracking-[0.32em] uppercase"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
      >
        Architecture
      </div>
      <div
        className="mt-1 truncate text-[18px] leading-tight font-semibold tracking-tight"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}
      >
        {archName ?? "Loading architecture…"}
      </div>

      <div
        className="mt-5 flex items-center justify-between text-[10px] tracking-[0.2em] uppercase"
        style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
      >
        <span>{PHASE_LABELS[phase]}</span>
        {showProgressNumbers && (
          <span style={{ color: "var(--text-muted)" }}>
            {done} / {total}
          </span>
        )}
      </div>

      <div
        className="mt-2 h-[2px] w-full overflow-hidden"
        style={{ backgroundColor: "var(--border-default)" }}
      >
        {phase === "summary" ? (
          <div
            className="h-full w-1/3"
            style={{
              backgroundColor: "var(--accent-cyan)",
              animation: "rf-edge-dash 1.2s linear infinite",
            }}
          />
        ) : (
          <div
            className="h-full"
            style={{
              width: `${ratio * 100}%`,
              backgroundColor: "var(--accent-cyan)",
              transition: "width 200ms ease-out",
            }}
          />
        )}
      </div>
    </>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <>
      <div
        className="text-[9px] tracking-[0.32em] uppercase"
        style={{ color: "var(--accent-amber)", fontFamily: "var(--font-mono)" }}
      >
        Failed to load
      </div>
      <div
        className="mt-2 text-[14px] leading-snug"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}
      >
        Could not load the architecture.
      </div>
      <div
        className="mt-1 text-[11px] leading-relaxed break-words"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
      >
        {message}
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-4 border px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors hover:text-white"
        style={{
          borderColor: "var(--border-default)",
          color: "var(--accent-cyan)",
          fontFamily: "var(--font-mono)",
          backgroundColor: "transparent",
        }}
      >
        Retry
      </button>
    </>
  );
}
