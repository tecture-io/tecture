/* ────────────────────────────────────────────────────────────────────────────
 * Tecture IO Style Guide
 * Blueprint design system reference — standardized Inter + JetBrains Mono pairing.
 * Ported from tecture-ai/app/style-guide with a neutral type stack.
 * ──────────────────────────────────────────────────────────────────────────── */

const colors = {
  backgrounds: [
    { token: "--bg-deep", value: "#0a0f1a", label: "Deep" },
    { token: "--bg-surface", value: "#0f1628", label: "Surface" },
    { token: "--bg-elevated", value: "#141d33", label: "Elevated" },
  ],
  borders: [
    { token: "--border-default", value: "#1e2d4a", label: "Default" },
    { token: "--border-accent", value: "rgba(37, 99, 235, 0.25)", label: "Accent" },
    { token: "--grid-line", value: "#1a2744", label: "Grid Line" },
  ],
  text: [
    { token: "--text-primary", value: "#e2e8f0", label: "Primary" },
    { token: "--text-secondary", value: "#94a3b8", label: "Secondary" },
    { token: "--text-muted", value: "#64748b", label: "Muted" },
  ],
  accents: [
    { token: "--accent-cyan", value: "#22d3ee", label: "Cyan" },
    { token: "--accent-blue", value: "#3b82f6", label: "Blue" },
    { token: "--accent-amber", value: "#f59e0b", label: "Amber" },
    { token: "--accent-amber-hover", value: "#fbbf24", label: "Amber Hover" },
    { token: "--accent-emerald", value: "#34d399", label: "Emerald" },
  ],
};

const nodeColors = [
  { type: "System", accent: "#94a3b8", bg: "#1e293b" },
  { type: "Service", accent: "#818cf8", bg: "#1e1b4b" },
  { type: "Database", accent: "#34d399", bg: "#022c22" },
  { type: "Queue", accent: "#fbbf24", bg: "#1c1a00" },
  { type: "Gateway", accent: "#a78bfa", bg: "#1e1338" },
  { type: "Frontend", accent: "#38bdf8", bg: "#0c1929" },
  { type: "Cache", accent: "#fb923c", bg: "#1c1006" },
  { type: "Storage", accent: "#2dd4bf", bg: "#042f2e" },
  { type: "External", accent: "#a1a1aa", bg: "#1c1c1e" },
];

function SectionLabel({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="blueprint-annotation animate-fade-up">{number}</div>
      <h2
        className="animate-fade-up delay-100 font-display mt-3 text-2xl tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        {children}
      </h2>
    </div>
  );
}

function ColorSwatch({ token, value, label }: { token: string; value: string; label: string }) {
  return (
    <div className="group relative">
      <div
        className="h-20 border transition-transform duration-200 group-hover:-translate-y-1"
        style={{ backgroundColor: value, borderColor: "var(--border-default)" }}
      />
      <div className="mt-2.5">
        <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
          {label}
        </div>
        <div className="mt-0.5 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
          {token}
        </div>
        <div className="mt-0.5 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

export function StyleGuide() {
  return (
    <div className="blueprint-grid animate-grid-reveal min-h-screen relative">
      {/* Registration marks */}
      <svg
        className="absolute top-6 right-6 opacity-20 pointer-events-none"
        width="40"
        height="40"
        viewBox="0 0 40 40"
      >
        <line x1="20" y1="0" x2="20" y2="40" stroke="var(--accent-cyan)" strokeWidth="0.5" className="animate-draw" />
        <line x1="0" y1="20" x2="40" y2="20" stroke="var(--accent-cyan)" strokeWidth="0.5" className="animate-draw" />
        <circle cx="20" cy="20" r="8" stroke="var(--accent-cyan)" strokeWidth="0.5" fill="none" className="animate-draw" />
      </svg>
      <svg
        className="absolute bottom-6 left-6 opacity-20 pointer-events-none"
        width="40"
        height="40"
        viewBox="0 0 40 40"
      >
        <line x1="20" y1="0" x2="20" y2="40" stroke="var(--accent-cyan)" strokeWidth="0.5" className="animate-draw" />
        <line x1="0" y1="20" x2="40" y2="20" stroke="var(--accent-cyan)" strokeWidth="0.5" className="animate-draw" />
        <circle cx="20" cy="20" r="8" stroke="var(--accent-cyan)" strokeWidth="0.5" fill="none" className="animate-draw" />
      </svg>

      {/* Nav */}
      <nav
        className="animate-fade-up mx-auto flex max-w-5xl items-center justify-between px-6 py-6 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center gap-3">
          <a href="/" className="font-display text-xl tracking-wide" style={{ color: "var(--text-primary)" }}>
            Tecture IO
          </a>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>|</span>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Style Guide</span>
        </div>
        <div className="blueprint-annotation" style={{ fontSize: "10px" }}>
          REV 1.0
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16">
        <div
          className="animate-fade-up delay-100 mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-secondary)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse-glow"
            style={{ backgroundColor: "var(--accent-cyan)" }}
          />
          Blueprint Design System
        </div>
        <h1
          className="animate-fade-up delay-200 font-display text-4xl tracking-tight sm:text-5xl md:text-6xl"
          style={{ color: "#e2e8f0" }}
        >
          Style Guide
        </h1>
        <p
          className="animate-fade-up delay-300 mt-4 max-w-2xl text-base leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          A living reference for the Tecture IO blueprint design system. Use these tokens, patterns, and components to
          build cohesive interfaces across the application.
        </p>
      </section>

      {/* ─────────────── COLORS ─────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <SectionLabel number="Section 01">Color Palette</SectionLabel>

        <div className="space-y-12">
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Backgrounds
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {colors.backgrounds.map((c) => (
                <ColorSwatch key={c.token} {...c} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Borders
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {colors.borders.map((c) => (
                <ColorSwatch key={c.token} {...c} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Text
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {colors.text.map((c) => (
                <div key={c.token} className="group">
                  <div
                    className="flex h-20 items-center justify-center border"
                    style={{ backgroundColor: "var(--bg-deep)", borderColor: "var(--border-default)" }}
                  >
                    <span className="text-lg font-medium" style={{ color: c.value }}>
                      Aa
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {c.label}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {c.token}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {c.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Accents
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {colors.accents.map((c) => (
                <div key={c.token} className="group">
                  <div
                    className="h-20 border transition-transform duration-200 group-hover:-translate-y-1"
                    style={{
                      background: `linear-gradient(135deg, ${c.value}22, ${c.value}66)`,
                      borderColor: c.value,
                    }}
                  />
                  <div className="mt-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.value }} />
                      <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                        {c.label}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {c.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Diagram Node Types
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {nodeColors.map((n) => (
                <div
                  key={n.type}
                  className="border p-3"
                  style={{ backgroundColor: n.bg, borderColor: `${n.accent}33` }}
                >
                  <div className="mb-2 h-1 w-6" style={{ backgroundColor: n.accent }} />
                  <div className="text-xs font-medium" style={{ color: n.accent }}>
                    {n.type}
                  </div>
                  <div className="mt-1 font-mono text-[9px]" style={{ color: `${n.accent}99` }}>
                    {n.accent}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── TYPOGRAPHY ─────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <SectionLabel number="Section 02">Typography</SectionLabel>

        <div className="space-y-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              {
                name: "Inter",
                variable: "--font-sans · --font-display",
                usage: "Body, UI, and display headings (600 weight, tight tracking)",
                sample: "Architecture",
                style: { fontFamily: "var(--font-sans)", fontWeight: 600, letterSpacing: "-0.02em" },
              },
              {
                name: "JetBrains Mono",
                variable: "--font-mono",
                usage: "Code, annotations, technical labels",
                sample: "tecture.io/api",
                style: { fontFamily: "var(--font-mono)" },
              },
            ].map((font) => (
              <div
                key={font.name}
                className="relative border p-6 overflow-hidden"
                style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
              >
                <svg className="absolute top-0 left-0" width="16" height="16" viewBox="0 0 16 16">
                  <path d="M0 16 L0 0 L16 0" stroke="var(--accent-cyan)" strokeWidth="1.5" fill="none" opacity="0.3" />
                </svg>
                <div className="text-3xl mb-4" style={{ ...font.style, color: "var(--text-primary)" }}>
                  {font.sample}
                </div>
                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  {font.name}
                </div>
                <div className="mt-1 font-mono text-[10px]" style={{ color: "var(--accent-cyan)" }}>
                  {font.variable}
                </div>
                <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  {font.usage}
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Type Scale
            </h3>
            <div
              className="border p-8 space-y-8"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
            >
              <div className="flex items-baseline gap-6">
                <span
                  className="shrink-0 w-28 font-mono text-[10px] text-right"
                  style={{ color: "var(--text-muted)" }}
                >
                  7xl — 72px
                </span>
                <span
                  className="font-display text-7xl tracking-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  Heading
                </span>
              </div>
              <div className="flex items-baseline gap-6">
                <span
                  className="shrink-0 w-28 font-mono text-[10px] text-right"
                  style={{ color: "var(--text-muted)" }}
                >
                  5xl — 48px
                </span>
                <span
                  className="font-display text-5xl tracking-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  Page Title
                </span>
              </div>
              <div className="flex items-baseline gap-6">
                <span
                  className="shrink-0 w-28 font-mono text-[10px] text-right"
                  style={{ color: "var(--text-muted)" }}
                >
                  2xl — 24px
                </span>
                <span
                  className="font-display text-2xl tracking-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  Section Heading
                </span>
              </div>
              <div className="flex items-baseline gap-6">
                <span
                  className="shrink-0 w-28 font-mono text-[10px] text-right"
                  style={{ color: "var(--text-muted)" }}
                >
                  lg — 18px
                </span>
                <span className="text-lg font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                  App Header / Nav Title
                </span>
              </div>
              <div className="flex items-baseline gap-6">
                <span
                  className="shrink-0 w-28 font-mono text-[10px] text-right"
                  style={{ color: "var(--text-muted)" }}
                >
                  sm — 14px
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Card Title / Label
                </span>
              </div>
              <div className="flex items-baseline gap-6">
                <span
                  className="shrink-0 w-28 font-mono text-[10px] text-right"
                  style={{ color: "var(--text-muted)" }}
                >
                  sm — 14px
                </span>
                <span className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Body text and descriptions use a relaxed line-height for comfortable reading across longer passages.
                </span>
              </div>
              <div className="flex items-baseline gap-6">
                <span
                  className="shrink-0 w-28 font-mono text-[10px] text-right"
                  style={{ color: "var(--text-muted)" }}
                >
                  xs — 12px
                </span>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Metadata · Updated Apr 18, 2026 · 3 diagrams
                </span>
              </div>
              <div className="flex items-baseline gap-6">
                <span
                  className="shrink-0 w-28 font-mono text-[10px] text-right"
                  style={{ color: "var(--text-muted)" }}
                >
                  11px mono
                </span>
                <span className="blueprint-annotation">Blueprint Annotation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── COMPONENTS ─────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <SectionLabel number="Section 03">Components</SectionLabel>

        <div className="space-y-16">
          {/* Buttons */}
          <div>
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Buttons
            </h3>
            <div
              className="border p-8"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
            >
              <div className="flex flex-wrap items-center gap-4">
                <button
                  className="rounded-none px-6 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
                  style={{ backgroundColor: "#f59e0b", color: "#0a0f1a" }}
                >
                  Primary Action
                </button>

                <button
                  className="rounded-none border px-6 py-2.5 text-sm font-medium transition-all"
                  style={{ borderColor: "rgba(34, 211, 238, 0.4)", color: "#22d3ee" }}
                >
                  Secondary Action
                </button>

                <button
                  className="rounded-none border px-4 py-1.5 text-sm font-medium transition-all"
                  style={{
                    borderColor: "var(--border-default)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Ghost
                </button>

                <button
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{ borderColor: "rgba(113, 113, 122, 0.5)", color: "#a1a1aa" }}
                >
                  Nav Item
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "Primary", desc: "Main CTA — amber bg, dark text, no border-radius", token: "--accent-amber" },
                  { label: "Secondary", desc: "Cyan border at 40% opacity, cyan text, no border-radius", token: "--accent-cyan" },
                  { label: "Ghost", desc: "Surface bg, default border, secondary text, no border-radius", token: "--border-default" },
                  { label: "Nav Item", desc: "Zinc border, rounded-lg, smaller padding, xs text", token: "zinc-700/50" },
                ].map((b) => (
                  <div key={b.label}>
                    <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {b.label}
                    </div>
                    <div className="mt-1 text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {b.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cards */}
          <div>
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Cards
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <div className="mb-2 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                  List Card (authenticated view)
                </div>
                <div className="group flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-zinc-600 hover:bg-zinc-900">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-500 transition-colors group-hover:bg-zinc-700/80 group-hover:text-zinc-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="18" rx="2" />
                      <path d="M8 7h8M8 11h8M8 15h4" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-200 group-hover:text-white">
                      Example Architecture
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                      <span>4 diagrams</span>
                      <span>&middot;</span>
                      <span>Updated Apr 18, 2026</span>
                    </div>
                    <div className="mt-1 truncate text-xs text-zinc-500">
                      Microservices architecture for the payment platform
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Feature Card (landing page)
                </div>
                <div
                  className="relative border p-6 overflow-hidden"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
                >
                  <div
                    className="absolute top-3 right-4 font-mono text-[10px] select-none"
                    style={{ color: "var(--text-muted)" }}
                  >
                    FIG.01
                  </div>
                  <svg className="absolute top-0 left-0" width="16" height="16" viewBox="0 0 16 16">
                    <path d="M0 16 L0 0 L16 0" stroke="var(--accent-cyan)" strokeWidth="1.5" fill="none" opacity="0.3" />
                  </svg>
                  <div
                    className="mb-3 flex h-9 w-9 items-center justify-center border"
                    style={{
                      borderColor: "rgba(34, 211, 238, 0.2)",
                      backgroundColor: "rgba(34, 211, 238, 0.05)",
                      color: "var(--accent-cyan)",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Feature Title
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    Description text explaining the feature. Uses relaxed line-height for readability.
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-2 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Step Card (landing page)
                </div>
                <div
                  className="relative border p-6 overflow-hidden"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
                >
                  <div
                    className="absolute top-2 right-3 font-mono text-4xl font-bold select-none"
                    style={{ color: "rgba(34, 211, 238, 0.08)" }}
                  >
                    01
                  </div>
                  <svg className="absolute top-0 left-0" width="16" height="16" viewBox="0 0 16 16">
                    <path d="M0 16 L0 0 L16 0" stroke="var(--accent-cyan)" strokeWidth="1.5" fill="none" opacity="0.3" />
                  </svg>
                  <div className="relative">
                    <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      Step Title
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      Step description with instructions for the user to follow.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Empty State
                </div>
                <div
                  className="flex flex-col items-center justify-center py-12 text-center border rounded-xl"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-500">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-zinc-300">No items yet</p>
                  <p className="mt-1 text-xs text-zinc-500">Description of what will appear here.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Badges & Pills */}
          <div>
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Badges &amp; Indicators
            </h3>
            <div
              className="border p-8"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                  style={{
                    borderColor: "var(--border-default)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full animate-pulse-glow"
                    style={{ backgroundColor: "var(--accent-cyan)" }}
                  />
                  Status Pill
                </div>

                <span
                  className="border px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: "rgba(34, 211, 238, 0.1)",
                    borderColor: "rgba(34, 211, 238, 0.2)",
                    color: "#22d3ee",
                  }}
                >
                  Tag Label
                </span>

                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Section Label
                </span>

                <span className="blueprint-annotation">Annotation</span>

                <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                  FIG.01
                </span>
              </div>
            </div>
          </div>

          {/* Code blocks */}
          <div>
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Code &amp; Terminal
            </h3>
            <div className="border overflow-hidden" style={{ borderColor: "#1e2d4a", backgroundColor: "#0f1628" }}>
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "#e2e8f0" }}>
                    Terminal Command
                  </span>
                  <span
                    className="border px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: "rgba(34, 211, 238, 0.1)",
                      borderColor: "rgba(34, 211, 238, 0.2)",
                      color: "#22d3ee",
                    }}
                  >
                    Example
                  </span>
                </div>
              </div>
              <div className="px-4 pb-3">
                <p className="text-xs mb-2" style={{ color: "#64748b" }}>
                  Instruction text above the command:
                </p>
                <pre
                  className="overflow-x-auto border px-4 py-3 text-xs leading-relaxed"
                  style={{ backgroundColor: "#0a0f1a", borderColor: "#1e2d4a", color: "#e2e8f0" }}
                >
                  <code>
                    <span style={{ color: "rgba(34, 211, 238, 0.5)" }}>$</span> npx @tecture/core --port 3001
                  </code>
                </pre>
              </div>
            </div>
          </div>

          {/* Icon containers */}
          <div>
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Icon Containers
            </h3>
            <div
              className="border p-8"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
            >
              <div className="flex flex-wrap items-end gap-6">
                <div className="text-center">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-500">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
                    </svg>
                  </div>
                  <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                    48 × 48
                  </span>
                </div>

                <div className="text-center">
                  <div
                    className="mb-2 flex h-10 w-10 items-center justify-center border"
                    style={{
                      borderColor: "rgba(34, 211, 238, 0.2)",
                      backgroundColor: "rgba(34, 211, 238, 0.05)",
                      color: "var(--accent-cyan)",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </svg>
                  </div>
                  <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                    40 × 40
                  </span>
                </div>

                <div className="text-center">
                  <div
                    className="mb-2 flex h-9 w-9 items-center justify-center border"
                    style={{
                      borderColor: "rgba(34, 211, 238, 0.2)",
                      backgroundColor: "rgba(34, 211, 238, 0.05)",
                      color: "var(--accent-cyan)",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </svg>
                  </div>
                  <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                    36 × 36
                  </span>
                </div>

                <div className="text-center">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-500">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="3" width="20" height="18" rx="2" />
                      <path d="M8 7h8M8 11h8M8 15h4" />
                    </svg>
                  </div>
                  <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                    32 × 32
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── ANIMATION ─────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <SectionLabel number="Section 04">Animation &amp; Motion</SectionLabel>

        <div className="space-y-8">
          <div
            className="border p-8"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
          >
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {[
                {
                  name: "fade-up",
                  class: "animate-fade-up",
                  duration: "0.7s",
                  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                  desc: "Primary entrance animation. Elements rise 24px with opacity fade.",
                },
                {
                  name: "draw-line",
                  class: "animate-draw",
                  duration: "2s",
                  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                  desc: "SVG stroke animation for blueprint lines and decorative elements.",
                },
                {
                  name: "pulse-glow",
                  class: "animate-pulse-glow",
                  duration: "3s infinite",
                  easing: "ease-in-out",
                  desc: "Continuous cyan halo pulse for live status indicators.",
                },
                {
                  name: "grid-reveal",
                  class: "animate-grid-reveal",
                  duration: "1.5s",
                  easing: "ease-out",
                  desc: "Background fade-in for the blueprint grid container.",
                },
                {
                  name: "slide-in-right",
                  class: "animate-slide-in-right",
                  duration: "0.2s",
                  easing: "ease-out",
                  desc: "Panel entrance from right edge. Used for side panels and drawers.",
                },
              ].map((anim) => (
                <div key={anim.name} className="flex gap-4">
                  <div
                    className="shrink-0 flex h-10 w-10 items-center justify-center border"
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    {anim.name === "pulse-glow" ? (
                      <span
                        className="h-3 w-3 rounded-full animate-pulse-glow"
                        style={{ backgroundColor: "var(--accent-cyan)" }}
                      />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 14L8 2L14 14" stroke="var(--accent-cyan)" strokeWidth="1" opacity="0.5" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                        {anim.name}
                      </span>
                      <span className="font-mono text-[10px]" style={{ color: "var(--accent-cyan)" }}>
                        {anim.duration}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {anim.easing}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {anim.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Stagger Delays
            </h3>
            <div
              className="border p-6"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
            >
              <div className="flex gap-2">
                {[100, 200, 300, 400, 500, 600, 700, 800].map((delay) => (
                  <div key={delay} className="flex-1 text-center">
                    <div
                      className="h-2 mb-2"
                      style={{
                        backgroundColor: "var(--accent-cyan)",
                        opacity: 0.15 + (delay / 800) * 0.85,
                      }}
                    />
                    <span className="font-mono text-[9px]" style={{ color: "var(--text-muted)" }}>
                      {delay}ms
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                Apply with .delay-100 through .delay-800 classes for cascading entrance effects
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── LAYOUT ─────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <SectionLabel number="Section 05">Layout &amp; Spacing</SectionLabel>

        <div className="space-y-10">
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Container Widths
            </h3>
            <div className="space-y-3">
              {[
                { label: "max-w-5xl", width: "64rem (1024px)", usage: "Landing hero, wide layouts" },
                { label: "max-w-4xl", width: "56rem (896px)", usage: "Standard content sections, authenticated views" },
                { label: "max-w-2xl", width: "42rem (672px)", usage: "Narrow text blocks, descriptions" },
                { label: "max-w-xl", width: "36rem (576px)", usage: "Hero description paragraphs" },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-4">
                  <span
                    className="shrink-0 w-24 font-mono text-[11px] text-right"
                    style={{ color: "var(--accent-cyan)" }}
                  >
                    {c.label}
                  </span>
                  <div
                    className="flex-1 h-6 border flex items-center px-3"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)" }}
                  >
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {c.width} — {c.usage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Grid Patterns
            </h3>
            <div className="space-y-6">
              <div>
                <div className="mb-2 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                  2 columns — sm:grid-cols-2, gap-3
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-12 border flex items-center justify-center"
                      style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)" }}
                    >
                      <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {i}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                  3 columns — sm:grid-cols-3, gap-6
                </div>
                <div className="grid grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-12 border flex items-center justify-center"
                      style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)" }}
                    >
                      <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {i}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Common Spacing Values
            </h3>
            <div
              className="border p-6"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
            >
              <div className="space-y-3">
                {[
                  { label: "px-6", value: "24px", usage: "Page horizontal padding" },
                  { label: "py-6", value: "24px", usage: "Nav vertical padding" },
                  { label: "p-6", value: "24px", usage: "Feature card padding" },
                  { label: "p-4", value: "16px", usage: "List card padding" },
                  { label: "gap-6", value: "24px", usage: "Feature card grid gap" },
                  { label: "gap-3", value: "12px", usage: "List card grid gap, inline element gap" },
                  { label: "gap-2", value: "8px", usage: "Tight inline spacing" },
                  { label: "mt-12", value: "48px", usage: "Grid top margin after section header" },
                  { label: "py-20", value: "80px", usage: "Section vertical padding" },
                  { label: "pt-24", value: "96px", usage: "Hero top padding" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-4">
                    <span
                      className="shrink-0 w-16 font-mono text-[11px] text-right"
                      style={{ color: "var(--accent-cyan)" }}
                    >
                      {s.label}
                    </span>
                    <div
                      className="shrink-0 w-12 font-mono text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {s.value}
                    </div>
                    <div className="flex-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {s.usage}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── DECORATIVE ELEMENTS ─────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <SectionLabel number="Section 06">Blueprint Decorations</SectionLabel>

        <div
          className="border p-8"
          style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
        >
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            <div className="text-center">
              <div
                className="mx-auto relative w-24 h-24 border"
                style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-deep)" }}
              >
                <svg className="absolute top-0 left-0" width="16" height="16" viewBox="0 0 16 16">
                  <path d="M0 16 L0 0 L16 0" stroke="var(--accent-cyan)" strokeWidth="1.5" fill="none" opacity="0.3" />
                </svg>
              </div>
              <div className="mt-3 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                Corner Bracket
              </div>
              <div className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                Top-left of feature cards
              </div>
            </div>

            <div className="text-center">
              <div
                className="mx-auto flex items-center justify-center w-24 h-24 border"
                style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-deep)" }}
              >
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <line x1="20" y1="0" x2="20" y2="40" stroke="var(--accent-cyan)" strokeWidth="0.5" />
                  <line x1="0" y1="20" x2="40" y2="20" stroke="var(--accent-cyan)" strokeWidth="0.5" />
                  <circle cx="20" cy="20" r="8" stroke="var(--accent-cyan)" strokeWidth="0.5" fill="none" />
                </svg>
              </div>
              <div className="mt-3 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                Registration Mark
              </div>
              <div className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                Page corners at 20% opacity
              </div>
            </div>

            <div className="text-center">
              <div
                className="mx-auto w-24 h-24 blueprint-grid border"
                style={{ borderColor: "var(--border-default)" }}
              />
              <div className="mt-3 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                Blueprint Grid
              </div>
              <div className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                100px major / 20px minor grid
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <div
              className="inline-block border border-dashed px-8 py-4"
              style={{ borderColor: "var(--border-default)" }}
            >
              <div
                className="font-mono text-[10px] tracking-widest uppercase mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Title Block
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Used as footer element — dashed border, centered
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── USAGE NOTES ─────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <SectionLabel number="Section 07">Usage Guidelines</SectionLabel>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[
            {
              title: "Landing pages",
              items: [
                "Use blueprint-grid background with animate-grid-reveal",
                "Apply .font-display on hero headings (Inter 600, -0.02em tracking)",
                "Stagger entrance animations with delay-100 to delay-800",
                "Include registration marks in page corners",
                "Use corner brackets on feature cards",
                "Buttons: rounded-none (angular, blueprint aesthetic)",
              ],
            },
            {
              title: "Authenticated views",
              items: [
                "Plain bg-deep background (no blueprint grid)",
                "Inter for all text at normal / medium weight",
                "Cards: rounded-xl with zinc-800 borders",
                "Hover states: lighten borders and backgrounds",
                "Use max-w-4xl for content containers",
                "Buttons: rounded-lg for nav items",
              ],
            },
            {
              title: "Dark theme principles",
              items: [
                "Three-tier background depth: deep → surface → elevated",
                "Text hierarchy: primary → secondary → muted",
                "Borders at low opacity to maintain depth without harsh lines",
                "Accent colors at reduced opacity for backgrounds (5–10%)",
                "Cyan as the primary accent, amber for CTAs only",
              ],
            },
            {
              title: "Motion principles",
              items: [
                "All entrances use cubic-bezier(0.16, 1, 0.3, 1) — fast start, gentle settle",
                "Stagger sibling elements by 100ms increments",
                "Keep hover transitions simple: transition-all or transition-colors",
                "Reserve pulse-glow for live status indicators only",
                "SVG blueprint lines use animate-draw for progressive reveal",
              ],
            },
          ].map((section) => (
            <div
              key={section.title}
              className="relative border p-6 overflow-hidden"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
            >
              <svg className="absolute top-0 left-0" width="16" height="16" viewBox="0 0 16 16">
                <path d="M0 16 L0 0 L16 0" stroke="var(--accent-cyan)" strokeWidth="1.5" fill="none" opacity="0.3" />
              </svg>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                {section.title}
              </h3>
              <ul className="space-y-1.5">
                {section.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-xs leading-relaxed"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <span style={{ color: "var(--accent-cyan)" }}>·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center">
        <div
          className="mx-auto inline-block border border-dashed px-8 py-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div
            className="font-mono text-[10px] tracking-widest uppercase mb-1"
            style={{ color: "var(--text-muted)" }}
          >
            Style Guide
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Tecture IO Blueprint Design System — Rev 1.0
          </div>
        </div>
      </footer>
    </div>
  );
}
