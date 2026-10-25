import { describe, expect, it } from "vitest";
import {
  CSS_COLOR_PATTERN,
  DEFAULT_APPEARANCE,
  EdgeAnimationMode,
  isCssColor,
  isEdgeAnimated,
  isRecord,
  mergeAppearance,
  type GraphAppearance,
} from "../src/index";

describe("mergeAppearance", () => {
  it("returns defaults for non-object input", () => {
    expect(mergeAppearance(undefined)).toEqual(DEFAULT_APPEARANCE);
    expect(mergeAppearance("nope")).toEqual(DEFAULT_APPEARANCE);
    expect(mergeAppearance([1, 2])).toEqual(DEFAULT_APPEARANCE);
  });

  it("applies valid overrides and keeps sibling defaults", () => {
    const a = mergeAppearance({
      edgeLabel: { backgroundColor: "rgba(0, 0, 0, 0.5)", backgroundOpacity: 0.4 },
    });
    expect(a.edgeLabel.backgroundColor).toBe("rgba(0, 0, 0, 0.5)");
    expect(a.edgeLabel.backgroundOpacity).toBe(0.4);
    expect(a.edgeLabel.textColor).toBe(DEFAULT_APPEARANCE.edgeLabel.textColor);
  });

  it("drops invalid values and falls back to defaults", () => {
    const a = mergeAppearance({
      edgeLabel: {
        backgroundColor: "red; background-image: url(x)",
        backgroundOpacity: 2,
        fontSize: Number.NaN,
        visible: "yes",
      },
      edge: { animation: "sometimes", dashPattern: "5 5; x" },
      canvas: { grid: "hexagons" },
    });
    expect(a.edgeLabel).toEqual(DEFAULT_APPEARANCE.edgeLabel);
    expect(a.edge).toEqual(DEFAULT_APPEARANCE.edge);
    expect(a.canvas.grid).toBe(DEFAULT_APPEARANCE.canvas.grid);
  });

  it("partial per-type override keeps the type's other fields", () => {
    const a = mergeAppearance({
      nodeTypes: { database: { accent: "hotpink" }, ghost: { accent: "red" } },
      edgeTypes: { calls: { dashed: true, color: 42 } },
    });
    expect(a.nodeTypes.database).toEqual({
      ...DEFAULT_APPEARANCE.nodeTypes.database,
      accent: "hotpink",
    });
    expect(a.nodeTypes.service).toEqual(DEFAULT_APPEARANCE.nodeTypes.service);
    expect(a.nodeTypes).not.toHaveProperty("ghost");
    expect(a.edgeTypes.calls).toEqual({
      ...DEFAULT_APPEARANCE.edgeTypes.calls,
      dashed: true,
    });
  });

  it("accepts null to clear the label border", () => {
    const a = mergeAppearance(
      { edgeLabel: { borderColor: null } },
      mergeAppearance({ edgeLabel: { borderColor: "#fff" } }),
    );
    expect(a.edgeLabel.borderColor).toBeNull();
  });

  it("wraps edge labels at 18 chars by default; wrapAt must be an in-range integer", () => {
    expect(DEFAULT_APPEARANCE.edgeLabel).toMatchObject({ wrap: true, wrapAt: 18 });
    expect(mergeAppearance({ edgeLabel: { wrap: false, wrapAt: 30 } }).edgeLabel)
      .toMatchObject({ wrap: false, wrapAt: 30 });
    for (const wrapAt of [12.5, 2, 500, "20"]) {
      expect(mergeAppearance({ edgeLabel: { wrapAt } }).edgeLabel.wrapAt).toBe(18);
    }
  });

  it("accepts every built-in default as an override", () => {
    // A base that differs at every leaf: a default some validator rejects
    // would keep the base value and break the equality.
    const differ = (v: unknown): unknown =>
      typeof v === "boolean"
        ? !v
        : typeof v === "number"
          ? v + 0.5
          : isRecord(v)
            ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, differ(x)]))
            : "\u0000";
    const base = differ(DEFAULT_APPEARANCE) as GraphAppearance;
    expect(mergeAppearance(DEFAULT_APPEARANCE, base)).toEqual(DEFAULT_APPEARANCE);
  });
});

// Checked against Chromium's CSS.supports("color", …): every accepted value
// parses; the rejects are invalid CSS, or valid CSS deliberately unsupported
// (var(), CSS-wide keywords, newer colour functions).
const VALID_COLORS = [
  "#abc",
  "#ABCD",
  "#aabbcc80",
  "rgb(1, 2, 3)",
  "rgba(1,2,3,.5)",
  "RGB(10%, 20%, 30%)",
  "rgb(255 0 0 / 50%)",
  "hsl(-120, 50%, 50%)",
  "hsla(200deg 50% 50% / 0.5)",
  "hsl(.5turn 10% 10%)",
  "teal",
  "RebeccaPurple",
  "transparent",
  "currentColor",
];
// Invalid in both layers: the settings pattern flags these too.
const BAD_SHAPES = [
  "",
  "#ab",
  "#12345",
  "#ggg",
  "red;",
  "url(x)",
  "expression(alert(1))",
  "var(--x)",
  "oklch(70% 0.1 200)",
];
// Colour-shaped but invalid: only the validator catches these.
const BAD_VALUES = [
  "rgb()",
  "rgba(1)",
  "rgb(1., 2, 3)",
  "rgb(1, 2, 3,)",
  "rgb(255 0 0 0.5)",
  "rgb(255, 50%, 0)",
  "hsl(200, 50, 50)",
  "fuschia",
  "none",
  "inherit",
  // Non-CSS whitespace inside the function (NBSP, ideographic space) and a
  // name spelt with the Kelvin sign, which lower-cases to ASCII "k".
  "rgb(\u00a01,2,3)",
  "rgb(1\u30002\u30003)",
  "\u212Ahaki",
];

describe("isCssColor", () => {
  it.each(VALID_COLORS)("accepts %s", (c) => expect(isCssColor(c)).toBe(true));
  it.each([...BAD_SHAPES, ...BAD_VALUES])("rejects %s", (c) =>
    expect(isCssColor(c)).toBe(false),
  );
});

describe("CSS_COLOR_PATTERN", () => {
  // VS Code compiles settings `pattern`s with the `u` flag.
  const pattern = new RegExp(CSS_COLOR_PATTERN, "u");
  it.each(VALID_COLORS)("never flags valid %s in the settings", (c) =>
    expect(pattern.test(c)).toBe(true),
  );
  it.each(BAD_SHAPES)("flags %s in the settings", (c) =>
    expect(pattern.test(c)).toBe(false),
  );
});

describe("edge.dashPattern", () => {
  const dash = (v: string) => mergeAppearance({ edge: { dashPattern: v } }).edge.dashPattern;
  it.each(["5 5", "4,2", "4, 2", "4 ,2 1", "1.5\t3"])("keeps %s", (v) =>
    expect(dash(v)).toBe(v),
  );
  // Chromium drops these, which would draw dashed edges solid.
  it.each(["5,,5", "5 , , 5", "5\u00a05", ",5", "5,", "a b"])("rejects %s", (v) =>
    expect(dash(v)).toBe(DEFAULT_APPEARANCE.edge.dashPattern),
  );
});

describe("isEdgeAnimated", () => {
  const animated = { color: "#fff", dashed: false, animated: true };
  const still = { ...animated, animated: false };
  const withMode = (animation: EdgeAnimationMode) =>
    mergeAppearance({ edge: { animation } });

  it("auto defers to the type flag", () => {
    expect(isEdgeAnimated(withMode(EdgeAnimationMode.Auto), animated)).toBe(true);
    expect(isEdgeAnimated(withMode(EdgeAnimationMode.Auto), still)).toBe(false);
  });
  it("always/never override the type flag", () => {
    expect(isEdgeAnimated(withMode(EdgeAnimationMode.Always), still)).toBe(true);
    expect(isEdgeAnimated(withMode(EdgeAnimationMode.Never), animated)).toBe(false);
  });
});
