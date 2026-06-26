// Looping, CSS-driven mini-diagrams for the onboarding wizard. The motion lives
// in styles.css (the `ob-*` keyframes); these components only lay out the boxes,
// cursor, and ripple in % coordinates so everything scales with the modal.

function Cursor({ className }: { className: string }) {
  return (
    <svg className={`ob-cursor ${className}`} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M5 3 L5 19 L9.6 14.8 L12.4 21 L15 19.8 L12.2 13.9 L18 13.9 Z"
        fill="#e2e8f0"
        stroke="#0a0f1a"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Box({
  label,
  style,
  className = "",
  children,
}: {
  label: string;
  style: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`ob-box ${className}`} style={style}>
      <span className="ob-box-icon" />
      <span>{label}</span>
      {children}
    </div>
  );
}

/** Click a box → its detail panel slides in. */
export function ClickDemo() {
  return (
    <div className="ob-stage blueprint-grid">
      <Box
        label="Service"
        className="ob-click-target"
        style={{ left: "6%", top: "20%", width: "34%", height: "30%" }}
      />
      <Box
        label="Database"
        style={{ left: "6%", top: "58%", width: "34%", height: "30%" }}
      />
      <span
        className="ob-ripple ob-click-ripple"
        style={{ left: "23%", top: "35%" }}
      />
      <div className="ob-click-panel ob-click-slide">
        <div className="ob-line accent" style={{ width: "68%" }} />
        <div className="ob-line" style={{ width: "100%" }} />
        <div className="ob-line" style={{ width: "90%" }} />
        <div className="ob-line" style={{ width: "58%" }} />
        <div className="ob-line" style={{ width: "82%" }} />
      </div>
      <Cursor className="ob-click-cursor" />
    </div>
  );
}

function Chevron() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/** Double-click a container with a drill-down button → into its sub-diagram. */
export function DrillDemo() {
  return (
    <div className="ob-stage blueprint-grid">
      <div className="ob-level-1">
        <Box
          label="User"
          style={{ left: "34%", top: "3%", width: "24%", height: "20%" }}
        />
        <Box
          label="Files"
          style={{ left: "64%", top: "40%", width: "24%", height: "24%" }}
        />
        <Box
          label="Service"
          style={{ left: "28%", top: "33%", width: "30%", height: "42%" }}
        >
          <span className="ob-pill ob-drill-pill">
            Drill down
            <Chevron />
          </span>
        </Box>
      </div>
      <div className="ob-level-2">
        <Box
          label="API"
          style={{ left: "8%", top: "14%", width: "24%", height: "26%" }}
        />
        <Box
          label="Router"
          style={{ left: "40%", top: "8%", width: "24%", height: "26%" }}
        />
        <Box
          label="Store"
          style={{ left: "20%", top: "56%", width: "24%", height: "26%" }}
        />
        <Box
          label="Worker"
          style={{ left: "54%", top: "52%", width: "28%", height: "28%" }}
        />
      </div>
      <span
        className="ob-ripple ob-drill-ripple"
        style={{ left: "43%", top: "64%" }}
      />
      <Cursor className="ob-drill-cursor" />
    </div>
  );
}
