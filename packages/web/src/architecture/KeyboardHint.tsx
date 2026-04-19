import { useEffect, useState } from "react";

export function KeyboardHint() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div
      className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 border px-3 py-1.5 shadow-lg backdrop-blur-md transition-opacity duration-1000"
      style={{
        borderColor: "var(--border-default)",
        backgroundColor: "rgba(10, 15, 26, 0.85)",
        color: "var(--text-muted)",
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        letterSpacing: "0.05em",
      }}
    >
      Scroll to zoom · Drag to pan · Click for details · Double-click to drill
    </div>
  );
}
