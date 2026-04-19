export interface IconPath {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface NodeStyle {
  label: string;
  bg: string;
  bgHover: string;
  border: string;
  accent: string;
  text: string;
  iconPaths: IconPath[];
  accentGlow: string;
}

const styles: Record<string, NodeStyle> = {
  system: {
    label: "System",
    bg: "#0d1320",
    bgHover: "#111827",
    border: "#1e3a5f",
    accent: "#94a3b8",
    text: "#e2e8f0",
    iconPaths: [
      { d: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z", fill: "#94a3b8", opacity: 0.1 },
      { d: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z", stroke: "#94a3b8", strokeWidth: 1.5 },
      { d: "M3.27 6.96L12 12.01l8.73-5.05", stroke: "#94a3b8", strokeWidth: 1.5 },
      { d: "M12 22.08V12", stroke: "#94a3b8", strokeWidth: 1.5 },
    ],
    accentGlow: "rgba(148,163,184,0.08)",
  },
  person: {
    label: "Person",
    bg: "#0f1419",
    bgHover: "#151c24",
    border: "#334155",
    accent: "#cbd5e1",
    text: "#f1f5f9",
    iconPaths: [
      { d: "M12 12a4 4 0 100-8 4 4 0 000 8z", fill: "#cbd5e1", opacity: 0.1 },
      { d: "M12 12a4 4 0 100-8 4 4 0 000 8z", stroke: "#cbd5e1", strokeWidth: 1.5 },
      { d: "M4 21a8 8 0 0116 0", stroke: "#cbd5e1", strokeWidth: 1.5 },
    ],
    accentGlow: "rgba(203,213,225,0.08)",
  },
  service: {
    label: "Service",
    bg: "#0d1025",
    bgHover: "#131738",
    border: "#252680",
    accent: "#818cf8",
    text: "#e0e7ff",
    iconPaths: [
      { d: "M12 15a3 3 0 100-6 3 3 0 000 6z", fill: "#818cf8", opacity: 0.1 },
      { d: "M12 15a3 3 0 100-6 3 3 0 000 6z", stroke: "#818cf8", strokeWidth: 1.5 },
      { d: "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z", stroke: "#818cf8", strokeWidth: 1.5 },
    ],
    accentGlow: "rgba(129,140,248,0.08)",
  },
  database: {
    label: "Database",
    bg: "#081a14",
    bgHover: "#0c2a1e",
    border: "#065f46",
    accent: "#34d399",
    text: "#d1fae5",
    iconPaths: [
      { d: "M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4v10c0 2.21-3.582 4-8 4s-8-1.79-8-4V7z", fill: "#34d399", opacity: 0.1 },
      { d: "M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4", stroke: "#34d399", strokeWidth: 1.5 },
    ],
    accentGlow: "rgba(52,211,153,0.08)",
  },
  queue: {
    label: "Queue",
    bg: "#18140a",
    bgHover: "#241e10",
    border: "#854d0e",
    accent: "#fbbf24",
    text: "#fef3c7",
    iconPaths: [
      { d: "M4 4h16v5H4zM4 13h16v5H4z", fill: "#fbbf24", opacity: 0.08 },
      { d: "M21 12l-18 0", stroke: "#fbbf24", strokeWidth: 1.5 },
      { d: "M4 4h16v5H4zM4 13h16v5H4z", stroke: "#fbbf24", strokeWidth: 1.5 },
      { d: "M8 8h.01M8 17h.01", stroke: "#fbbf24", strokeWidth: 2.5 },
    ],
    accentGlow: "rgba(251,191,36,0.08)",
  },
  gateway: {
    label: "Gateway",
    bg: "#100d20",
    bgHover: "#181535",
    border: "#4c1d95",
    accent: "#a78bfa",
    text: "#ede9fe",
    iconPaths: [
      { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", fill: "#a78bfa", opacity: 0.1 },
      { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", stroke: "#a78bfa", strokeWidth: 1.5 },
      { d: "M9 12l2 2 4-4", stroke: "#a78bfa", strokeWidth: 2 },
    ],
    accentGlow: "rgba(167,139,250,0.08)",
  },
  frontend: {
    label: "Frontend",
    bg: "#081420",
    bgHover: "#0c1e35",
    border: "#0c4a6e",
    accent: "#38bdf8",
    text: "#e0f2fe",
    iconPaths: [
      { d: "M3 5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z", fill: "#38bdf8", opacity: 0.1 },
      { d: "M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", stroke: "#38bdf8", strokeWidth: 1.5 },
      { d: "M3 13h18", stroke: "#38bdf8", strokeWidth: 1.5 },
      { d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3", stroke: "#38bdf8", strokeWidth: 1.5 },
    ],
    accentGlow: "rgba(56,189,248,0.08)",
  },
  cache: {
    label: "Cache",
    bg: "#18100a",
    bgHover: "#241810",
    border: "#7c2d12",
    accent: "#fb923c",
    text: "#ffedd5",
    iconPaths: [
      { d: "M13 10V3L4 14h7v7l9-11h-7z", fill: "#fb923c", opacity: 0.1 },
      { d: "M13 10V3L4 14h7v7l9-11h-7z", stroke: "#fb923c", strokeWidth: 1.5 },
    ],
    accentGlow: "rgba(251,146,60,0.08)",
  },
  storage: {
    label: "Storage",
    bg: "#081816",
    bgHover: "#0c2826",
    border: "#134e4a",
    accent: "#2dd4bf",
    text: "#ccfbf1",
    iconPaths: [
      { d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z", fill: "#2dd4bf", opacity: 0.1 },
      { d: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2h6l2-2h6a2 2 0 012 2v12z", stroke: "#2dd4bf", strokeWidth: 1.5 },
    ],
    accentGlow: "rgba(45,212,191,0.08)",
  },
  external: {
    label: "External",
    bg: "#0d1118",
    bgHover: "#141a22",
    border: "#1e2d4a",
    accent: "#a1a1aa",
    text: "#e4e4e7",
    iconPaths: [
      { d: "M12 21a9 9 0 100-18 9 9 0 000 18z", fill: "#a1a1aa", opacity: 0.08 },
      { d: "M12 21a9 9 0 100-18 9 9 0 000 18z", stroke: "#a1a1aa", strokeWidth: 1.5 },
      { d: "M3.6 9h16.8M3.6 15h16.8", stroke: "#a1a1aa", strokeWidth: 1.5 },
      { d: "M12 3c2.2 2.5 3.5 5.5 3.5 9s-1.3 6.5-3.5 9c-2.2-2.5-3.5-5.5-3.5-9s1.3-6.5 3.5-9z", stroke: "#a1a1aa", strokeWidth: 1.5 },
    ],
    accentGlow: "rgba(161,161,170,0.08)",
  },
};

const defaultStyle: NodeStyle = {
  label: "Component",
  bg: "#0a0f1a",
  bgHover: "#0f1628",
  border: "#1e2d4a",
  accent: "#64748b",
  text: "#e2e8f0",
  iconPaths: [
    { d: "M20 7l-8-4-8 4v10l8 4 8-4V7z", fill: "#64748b", opacity: 0.1 },
    { d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", stroke: "#64748b", strokeWidth: 1.5 },
  ],
  accentGlow: "rgba(100,116,139,0.08)",
};

export function getNodeStyle(type?: string): NodeStyle {
  return type ? (styles[type] ?? defaultStyle) : defaultStyle;
}
