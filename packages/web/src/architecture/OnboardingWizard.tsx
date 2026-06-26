import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ClickDemo, DrillDemo } from "./OnboardingDemos";

interface Step {
  /** Mono eyebrow above the title. */
  eyebrow: string;
  title: string;
  blurb: string;
  /** Visual shown in the media band (a demo animation or the intro hero). */
  media: ReactNode;
}

interface Props {
  open: boolean;
  onClose: () => void;
  architectureName: string;
  architectureDescription?: string;
}

export function OnboardingWizard({
  open,
  onClose,
  architectureName,
  architectureDescription,
}: Props) {
  const [step, setStep] = useState(0);

  // Restart at the intro every time the wizard (re)opens.
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // The manifest description can be several paragraphs — the intro only needs
  // the opening one to set context.
  const intro = (architectureDescription ?? "").split(/\n\s*\n/)[0]?.trim();

  const steps: Step[] = [
    {
      eyebrow: "Architecture",
      title: architectureName,
      blurb:
        intro ||
        "An interactive map of this system — its components and how they connect.",
      media: <IntroHero name={architectureName} />,
    },
    {
      eyebrow: "Tip · 1 of 2",
      title: "Click a component",
      blurb:
        "Click any box to open its details — the technology it uses, its source files, and a full description.",
      media: <ClickDemo />,
    },
    {
      eyebrow: "Tip · 2 of 2",
      title: "Drill down for more",
      blurb:
        "Boxes with a “Drill down” button go deeper — double-click one to open its sub-diagram and explore the next level.",
      media: <DrillDemo />,
    },
  ];

  const last = steps.length - 1;
  const next = useCallback(() => {
    setStep((s) => {
      if (s >= steps.length - 1) {
        onClose();
        return s;
      }
      return s + 1;
    });
  }, [steps.length, onClose]);
  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, next, back]);

  const current = steps[step] ?? steps[0];
  if (!open || !current) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(5, 8, 15, 0.72)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div
        className="animate-fade-up flex w-[min(640px,calc(100vw-32px))] flex-col border shadow-lg backdrop-blur-md"
        style={{
          borderColor: "var(--border-default)",
          backgroundColor: "rgba(10, 15, 26, 0.94)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between border-b px-6 py-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="min-w-0">
            <div
              className="text-[9px] tracking-[0.32em] uppercase"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {current.eyebrow}
            </div>
            <div
              id="onboarding-title"
              className="mt-1 truncate text-[18px] leading-tight font-semibold tracking-tight"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {current.title}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip tour"
            className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center border transition-colors hover:text-white"
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

        {/* Media band */}
        <div
          className="border-b"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--bg-deep)",
          }}
        >
          {current.media}
        </div>

        {/* Blurb */}
        <p
          className="px-6 py-4 text-[13px] leading-relaxed"
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {current.blurb}
        </p>

        {/* Footer */}
        <div
          className="flex items-center justify-between border-t px-6 py-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <span
                key={s.title}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === step ? "18px" : "6px",
                  backgroundColor:
                    i === step ? "var(--accent-cyan)" : "var(--border-default)",
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                className="border px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors hover:text-white"
                style={{
                  borderColor: "var(--border-default)",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  backgroundColor: "transparent",
                }}
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="border px-4 py-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors hover:text-white"
              style={{
                borderColor: "var(--accent-cyan)",
                color: "var(--accent-cyan)",
                fontFamily: "var(--font-mono)",
                backgroundColor: "transparent",
              }}
            >
              {step === last ? "Got it" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Intro media band: the architecture name set on the blueprint grid. */
function IntroHero({ name }: { name: string }) {
  return (
    <div className="ob-stage blueprint-grid flex flex-col items-center justify-center text-center">
      <div
        className="text-[9px] tracking-[0.4em] uppercase"
        style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}
      >
        Architecture
      </div>
      <div
        className="mt-2 px-6 text-[26px] leading-tight"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
      >
        {name}
      </div>
      <div
        className="mt-3 text-[10px] tracking-[0.18em] uppercase"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
      >
        Interactive architecture diagrams
      </div>
    </div>
  );
}
