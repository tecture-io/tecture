// Graph appearance: built-in defaults plus a validating, key-by-key merge of
// untrusted user overrides (VS Code `tecture.graph.*` settings). Any invalid
// value is dropped and the default kept, so nothing unchecked reaches inline
// styles.

import { isFiniteNumber, isRecord } from "./validators";

export const GridVariant = {
  Lines: "lines",
  Dots: "dots",
  Cross: "cross",
  None: "none",
} as const;
export type GridVariant = (typeof GridVariant)[keyof typeof GridVariant];

export const ContainerBorderStyle = {
  Dashed: "dashed",
  Solid: "solid",
  Dotted: "dotted",
} as const;
export type ContainerBorderStyle =
  (typeof ContainerBorderStyle)[keyof typeof ContainerBorderStyle];

/**
 * Global edge animation. `auto` defers to each edge type's `animated` flag;
 * `always` / `never` override every type.
 */
export const EdgeAnimationMode = {
  Auto: "auto",
  Always: "always",
  Never: "never",
} as const;
export type EdgeAnimationMode =
  (typeof EdgeAnimationMode)[keyof typeof EdgeAnimationMode];

export const NODE_TYPE_KEYS = [
  "system",
  "person",
  "service",
  "database",
  "queue",
  "gateway",
  "frontend",
  "cache",
  "storage",
  "external",
  "default",
] as const;
export type NodeTypeKey = (typeof NODE_TYPE_KEYS)[number];

export const EDGE_TYPE_KEYS = [
  "calls",
  "data-flow",
  "publishes",
  "subscribes",
  "reads",
  "writes",
  "default",
] as const;
export type EdgeTypeKey = (typeof EDGE_TYPE_KEYS)[number];

export interface NodeTypeColors {
  bg: string;
  border: string;
  accent: string;
  text: string;
}

/** `dashed` picks whether a type is dashed; `edge.dashPattern` picks the pattern. */
export interface EdgeTypeStyle {
  color: string;
  dashed: boolean;
  animated: boolean;
}

export interface GraphAppearance {
  edgeLabel: {
    visible: boolean;
    backgroundColor: string;
    backgroundOpacity: number;
    textColor: string;
    fontSize: number;
    fontWeight: number;
    paddingX: number;
    paddingY: number;
    borderRadius: number;
    /** null = no outline. */
    borderColor: string | null;
    /** Wrap long labels onto multiple lines instead of one long line. */
    wrap: boolean;
    /** Max Latin characters per line when `wrap` is on (CSS `ch` units, so CJK/emoji fit about half); breaks at word boundaries. */
    wrapAt: number;
  };
  edge: {
    strokeWidth: number;
    dashPattern: string;
    arrowSize: number;
    cornerRadius: number;
    animation: EdgeAnimationMode;
  };
  node: {
    minWidth: number;
    labelFontSize: number;
    technologyFontSize: number;
    borderRadius: number;
    showIcons: boolean;
    showCornerMarks: boolean;
  };
  container: {
    backgroundOpacity: number;
    headerOpacity: number;
    borderStyle: ContainerBorderStyle;
    borderWidth: number;
  };
  canvas: {
    backgroundColor: string;
    grid: GridVariant;
    gridGap: number;
    gridColor: string;
  };
  minimap: { visible: boolean; nodeColor: string; maskColor: string };
  controls: { visible: boolean };
  legend: { visible: boolean };
  nodeTypes: Record<NodeTypeKey, NodeTypeColors>;
  edgeTypes: Record<EdgeTypeKey, EdgeTypeStyle>;
}

export const DEFAULT_APPEARANCE: GraphAppearance = {
  edgeLabel: {
    visible: true,
    backgroundColor: "#0a0f1a",
    backgroundOpacity: 0.5,
    textColor: "#e2e8f0",
    fontSize: 10,
    fontWeight: 500,
    paddingX: 6,
    paddingY: 4,
    borderRadius: 4,
    borderColor: null,
    wrap: true,
    wrapAt: 18,
  },
  edge: {
    strokeWidth: 1.5,
    dashPattern: "5 5",
    arrowSize: 16,
    cornerRadius: 8,
    animation: EdgeAnimationMode.Auto,
  },
  node: {
    minWidth: 160,
    labelFontSize: 13,
    technologyFontSize: 9,
    borderRadius: 0,
    showIcons: true,
    showCornerMarks: true,
  },
  container: {
    backgroundOpacity: 0.03,
    headerOpacity: 0.9,
    borderStyle: ContainerBorderStyle.Dashed,
    borderWidth: 1.5,
  },
  canvas: {
    backgroundColor: "#141414",
    grid: GridVariant.Lines,
    gridGap: 20,
    gridColor: "rgba(34, 78, 130, 0.12)",
  },
  minimap: {
    visible: true,
    nodeColor: "#22d3ee",
    maskColor: "rgba(10, 15, 26, 0.7)",
  },
  controls: { visible: true },
  legend: { visible: true },
  nodeTypes: {
    system: { bg: "#0d1320", border: "#1e3a5f", accent: "#94a3b8", text: "#e2e8f0" },
    person: { bg: "#0f1419", border: "#334155", accent: "#cbd5e1", text: "#f1f5f9" },
    service: { bg: "#0d1025", border: "#252680", accent: "#818cf8", text: "#e0e7ff" },
    database: { bg: "#081a14", border: "#065f46", accent: "#34d399", text: "#d1fae5" },
    queue: { bg: "#18140a", border: "#854d0e", accent: "#fbbf24", text: "#fef3c7" },
    gateway: { bg: "#100d20", border: "#4c1d95", accent: "#a78bfa", text: "#ede9fe" },
    frontend: { bg: "#081420", border: "#0c4a6e", accent: "#38bdf8", text: "#e0f2fe" },
    cache: { bg: "#18100a", border: "#7c2d12", accent: "#fb923c", text: "#ffedd5" },
    storage: { bg: "#081816", border: "#134e4a", accent: "#2dd4bf", text: "#ccfbf1" },
    external: { bg: "#0d1118", border: "#1e2d4a", accent: "#a1a1aa", text: "#e4e4e7" },
    default: { bg: "#0a0f1a", border: "#1e2d4a", accent: "#64748b", text: "#e2e8f0" },
  },
  edgeTypes: {
    calls: { color: "#818cf8", dashed: false, animated: false },
    "data-flow": { color: "#34d399", dashed: false, animated: true },
    publishes: { color: "#fbbf24", dashed: true, animated: false },
    subscribes: { color: "#fbbf24", dashed: true, animated: false },
    reads: { color: "#34d399", dashed: false, animated: false },
    writes: { color: "#fb923c", dashed: false, animated: false },
    default: { color: "#22d3ee", dashed: false, animated: false },
  },
};

// ─── Validation ───

// Colours: hex, rgb()/rgba() and hsl()/hsla() in the legacy comma or modern
// space syntax, or a CSS colour name. Strict on purpose: a value the browser
// would drop must fall back to the default instead of blanking the element.
// Inner whitespace is CSS whitespace only: JS `\s` also matches NBSP and other
// Unicode spaces, which CSS rejects. (Leading/trailing ones are trimmed.)
const WS = String.raw`[ \t\n\r\f]`;
const NUM = String.raw`[+-]?(?:\d*\.)?\d+`;
const PCT = `${NUM}%`;
const HUE = `${NUM}(?:deg|grad|rad|turn)?`;
const ALPHA = `${NUM}%?`;
const fn = (name: string, args: string) =>
  String.raw`${name}a?\(${WS}*${args}${WS}*\)`;
const legacy = (a: string, b: string, c: string) =>
  `${a}${WS}*,${WS}*${b}${WS}*,${WS}*${c}(?:${WS}*,${WS}*${ALPHA})?`;
const modern = (a: string, b: string, c: string) =>
  `${a}${WS}+${b}${WS}+${c}(?:${WS}*/${WS}*${ALPHA})?`;
const COLOR_SYNTAX_RE = new RegExp(
  `^(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|${[
    fn("rgb", legacy(NUM, NUM, NUM)),
    fn("rgb", legacy(PCT, PCT, PCT)),
    fn("rgb", modern(NUM, NUM, NUM)),
    fn("rgb", modern(PCT, PCT, PCT)),
    fn("hsl", legacy(HUE, PCT, PCT)),
    fn("hsl", modern(HUE, PCT, PCT)),
  ].join("|")})$`,
  "i",
);

// CSS named colours, plus `transparent` and `currentcolor`.
const NAMED_COLORS = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black " +
    "blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse " +
    "chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan " +
    "darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta " +
    "darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
    "darkslateblue darkslategray darkslategrey darkturquoise darkviolet " +
    "deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite " +
    "forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green " +
    "greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender " +
    "lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink " +
    "lightsalmon lightseagreen lightskyblue lightslategray lightslategrey " +
    "lightsteelblue lightyellow lime limegreen linen magenta maroon " +
    "mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen " +
    "mediumslateblue mediumspringgreen mediumturquoise mediumvioletred " +
    "midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive " +
    "olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise " +
    "palevioletred papayawhip peachpuff peru pink plum powderblue purple " +
    "rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown " +
    "seagreen seashell sienna silver skyblue slateblue slategray slategrey " +
    "snow springgreen steelblue tan teal thistle tomato turquoise violet " +
    "wheat white whitesmoke yellow yellowgreen transparent currentcolor"
  ).split(" "),
);

/**
 * JSON-schema `pattern` for the VS Code colour settings: a compact shape check
 * (schemas have no `i` flag) that flags bad shapes in the Settings UI, such as
 * a wrong hex length, `var()` or `oklch()`. Misspelt names and malformed
 * `rgb()`/`hsl()` arguments pass it and only `isCssColor` rejects them. It
 * never rejects a value `isCssColor` accepts.
 */
export const CSS_COLOR_PATTERN = String.raw`^\s*(?:#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|(?:[rR][gG][bB]|[hH][sS][lL])[aA]?\([ \t\n\r\f\d.,%/+a-zA-Z-]*\)|[a-zA-Z]{3,24})\s*$`;

// Dash lengths separated by one comma (optionally padded) or by whitespace.
const DASH_RE = new RegExp(
  String.raw`^\d+(?:\.\d+)?(?:(?:${WS}*,${WS}*|${WS}+)\d+(?:\.\d+)?)*$`,
);

/** Exported as the schema `pattern` of `tecture.graph.edge.dashPattern`. */
export const DASH_PATTERN = DASH_RE.source;

const ASCII_WORD_RE = /^[a-z]+$/i;

/** Hex, rgb()/rgba(), hsl()/hsla() or a CSS colour name, up to 64 characters. */
export function isCssColor(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const s = v.trim();
  return (
    s.length <= 64 &&
    (COLOR_SYNTAX_RE.test(s) ||
      (ASCII_WORD_RE.test(s) && NAMED_COLORS.has(s.toLowerCase())))
  );
}

type Check<T> = (v: unknown) => v is T;

const color: Check<string> = isCssColor;
const bool: Check<boolean> = (v): v is boolean => typeof v === "boolean";
const range =
  (min: number, max: number): Check<number> =>
  (v): v is number =>
    isFiniteNumber(v) && v >= min && v <= max;
const oneOf =
  <T extends string>(values: Record<string, T>): Check<T> =>
  (v): v is T =>
    typeof v === "string" && (Object.values(values) as string[]).includes(v);
const dash: Check<string> = (v): v is string =>
  typeof v === "string" && v.length <= 32 && DASH_RE.test(v.trim());
const colorOrNull: Check<string | null> = (v): v is string | null =>
  v === null || isCssColor(v);

type Spec<T> = { [K in keyof T]: Check<T[K]> };

function mergeSection<T extends object>(
  base: T,
  spec: Spec<T>,
  input: unknown,
): T {
  if (!isRecord(input)) return base;
  const out = { ...base };
  for (const key of Object.keys(spec) as (keyof T)[]) {
    const v = input[key as string];
    if (v === undefined) continue;
    const value = typeof v === "string" ? v.trim() : v;
    if (spec[key](value)) out[key] = value as T[keyof T];
  }
  return out;
}

function mergeKeyed<K extends string, T extends object>(
  base: Record<K, T>,
  keys: readonly K[],
  spec: Spec<T>,
  input: unknown,
): Record<K, T> {
  if (!isRecord(input)) return base;
  const out = { ...base };
  for (const key of keys) {
    out[key] = mergeSection(base[key], spec, input[key]);
  }
  return out;
}

const SPEC = {
  edgeLabel: {
    visible: bool,
    backgroundColor: color,
    backgroundOpacity: range(0, 1),
    textColor: color,
    fontSize: range(6, 32),
    fontWeight: range(100, 900),
    paddingX: range(0, 32),
    paddingY: range(0, 32),
    borderRadius: range(0, 32),
    borderColor: colorOrNull,
    wrap: bool,
    wrapAt: (v): v is number => Number.isInteger(v) && range(4, 200)(v),
  },
  edge: {
    strokeWidth: range(0.5, 8),
    dashPattern: dash,
    arrowSize: range(4, 48),
    cornerRadius: range(0, 64),
    animation: oneOf(EdgeAnimationMode),
  },
  node: {
    // The automatic layout reserves 220px per leaf; wider nodes would overlap.
    minWidth: range(60, 220),
    labelFontSize: range(8, 18),
    technologyFontSize: range(6, 14),
    borderRadius: range(0, 32),
    showIcons: bool,
    showCornerMarks: bool,
  },
  container: {
    backgroundOpacity: range(0, 1),
    headerOpacity: range(0, 1),
    borderStyle: oneOf(ContainerBorderStyle),
    borderWidth: range(0, 8),
  },
  canvas: {
    backgroundColor: color,
    grid: oneOf(GridVariant),
    gridGap: range(4, 200),
    gridColor: color,
  },
  minimap: { visible: bool, nodeColor: color, maskColor: color },
  controls: { visible: bool },
  legend: { visible: bool },
} satisfies {
  [K in Exclude<keyof GraphAppearance, "nodeTypes" | "edgeTypes">]: Spec<
    GraphAppearance[K]
  >;
};

const NODE_TYPE_SPEC: Spec<NodeTypeColors> = {
  bg: color,
  border: color,
  accent: color,
  text: color,
};

const EDGE_TYPE_SPEC: Spec<EdgeTypeStyle> = {
  color,
  dashed: bool,
  animated: bool,
};

/**
 * Overlay untrusted overrides onto `base`, field by field. Invalid or unknown
 * values are dropped (the base value is kept); a partial per-type override
 * keeps that type's other fields.
 */
export function mergeAppearance(
  input: unknown,
  base: GraphAppearance = DEFAULT_APPEARANCE,
): GraphAppearance {
  if (!isRecord(input)) return base;
  return {
    edgeLabel: mergeSection(base.edgeLabel, SPEC.edgeLabel, input.edgeLabel),
    edge: mergeSection(base.edge, SPEC.edge, input.edge),
    node: mergeSection(base.node, SPEC.node, input.node),
    container: mergeSection(base.container, SPEC.container, input.container),
    canvas: mergeSection(base.canvas, SPEC.canvas, input.canvas),
    minimap: mergeSection(base.minimap, SPEC.minimap, input.minimap),
    controls: mergeSection(base.controls, SPEC.controls, input.controls),
    legend: mergeSection(base.legend, SPEC.legend, input.legend),
    nodeTypes: mergeKeyed(base.nodeTypes, NODE_TYPE_KEYS, NODE_TYPE_SPEC, input.nodeTypes),
    edgeTypes: mergeKeyed(base.edgeTypes, EDGE_TYPE_KEYS, EDGE_TYPE_SPEC, input.edgeTypes),
  };
}

/** Resolve whether an edge type animates, honouring the global mode. */
export function isEdgeAnimated(
  appearance: GraphAppearance,
  type: EdgeTypeStyle,
): boolean {
  switch (appearance.edge.animation) {
    case EdgeAnimationMode.Always:
      return true;
    case EdgeAnimationMode.Never:
      return false;
    case EdgeAnimationMode.Auto:
      return type.animated;
  }
}
