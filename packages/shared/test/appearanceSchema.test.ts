// VS Code shows the `tecture.graph.*` settings from the extension's
// package.json, but the webview applies DEFAULT_APPEARANCE and mergeAppearance.
// These tests walk every field of DEFAULT_APPEARANCE (per-type maps included)
// and check its schema entry against what mergeAppearance accepts, so the
// Settings UI offers exactly the values that get rendered.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ContainerBorderStyle,
  CSS_COLOR_PATTERN,
  DASH_PATTERN,
  DEFAULT_APPEARANCE,
  EdgeAnimationMode,
  GridVariant,
  isCssColor,
  mergeAppearance,
} from "../src/index";

interface SchemaNode {
  type?: string | string[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
  format?: string;
  pattern?: string;
  maxLength?: number;
  additionalProperties?: boolean;
  properties?: Record<string, SchemaNode>;
}

const PREFIX = "tecture.graph.";
const PER_TYPE = new Set(["nodeTypes", "edgeTypes"]);
const ENUMS: Record<string, string>[] = [GridVariant, ContainerBorderStyle, EdgeAnimationMode];

const manifest = JSON.parse(
  readFileSync(new URL("../../vscode/package.json", import.meta.url), "utf8"),
) as { contributes: { configuration: { properties: Record<string, SchemaNode> } } };
const props = manifest.contributes.configuration.properties;

/** Every leaf of DEFAULT_APPEARANCE, as a path plus its default value. */
function leaves(obj: object, path: string[] = []): { path: string[]; value: unknown }[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    value !== null && typeof value === "object"
      ? leaves(value, [...path, key])
      : [{ path: [...path, key], value }],
  );
}
const fields = leaves(DEFAULT_APPEARANCE).map((f) => ({ ...f, name: f.path.join(".") }));

/** `nodeTypes.database.accent` lives under the `nodeTypes` object setting. */
function schemaFor(path: string[]): SchemaNode | undefined {
  if (PER_TYPE.has(path[0]!)) {
    return props[PREFIX + path[0]]?.properties?.[path[1]!]?.properties?.[path[2]!];
  }
  return props[PREFIX + path.join(".")];
}

function override(path: string[], value: unknown): Record<string, unknown> {
  return path.reduceRight<unknown>((acc, key) => ({ [key]: acc }), value) as Record<
    string,
    unknown
  >;
}
const merged = (path: string[], value: unknown): unknown =>
  path.reduce<unknown>(
    (acc, key) => (acc as Record<string, unknown>)[key],
    mergeAppearance(override(path, value)),
  );
const kept = (path: string[], value: unknown) => merged(path, value) === value;
const types = (s: SchemaNode) => [s.type].flat();

describe("package.json tecture.graph.* settings", () => {
  it("has exactly one setting per scalar field, plus the two per-type maps", () => {
    const expected = [
      ...fields.filter((f) => !PER_TYPE.has(f.path[0]!)).map((f) => PREFIX + f.name),
      ...[...PER_TYPE].map((k) => PREFIX + k),
    ].sort();
    expect(Object.keys(props).filter((k) => k.startsWith(PREFIX)).sort()).toEqual(expected);
  });

  it("per-type maps list exactly the built-in types and fields, closed", () => {
    for (const key of PER_TYPE) {
      const schema = props[PREFIX + key]!;
      const builtIn = DEFAULT_APPEARANCE[key as "nodeTypes" | "edgeTypes"];
      expect(schema.default, key).toEqual({});
      expect(schema.additionalProperties, key).toBe(false);
      expect(Object.keys(schema.properties!), key).toEqual(Object.keys(builtIn));
      for (const [type, style] of Object.entries(builtIn)) {
        const node = schema.properties![type]!;
        expect(node.additionalProperties, `${key}.${type}`).toBe(false);
        expect(Object.keys(node.properties!), `${key}.${type}`).toEqual(Object.keys(style));
      }
    }
  });

  describe.each(fields)("$name", ({ path, value }) => {
    const schema = schemaFor(path);
    const scalar = !PER_TYPE.has(path[0]!);

    it("has a schema entry whose default is the rendered default", () => {
      expect(schema).toBeDefined();
      if (scalar) expect(schema!.default).toEqual(value);
    });

    if (typeof value === "boolean") {
      it("is a boolean", () => {
        expect(types(schema!)).toEqual(["boolean"]);
        expect(kept(path, !value)).toBe(true);
      });
    } else if (typeof value === "number") {
      it("has the validator's range and integer-ness", () => {
        const { minimum, maximum } = schema!;
        expect(minimum).toBeDefined();
        expect(maximum).toBeDefined();
        const integer = !kept(path, minimum! + 0.5);
        expect(types(schema!)).toEqual([integer ? "integer" : "number"]);
        const step = integer ? 1 : 0.01;
        expect(kept(path, minimum!)).toBe(true);
        expect(kept(path, maximum!)).toBe(true);
        expect(kept(path, minimum! - step)).toBe(false);
        expect(kept(path, maximum! + step)).toBe(false);
      });
    } else if (value === null || isCssColor(value)) {
      it("is a colour setting using the shared pattern", () => {
        expect(types(schema!)).toEqual(value === null ? ["string", "null"] : ["string"]);
        expect(schema!.format).toBe("color");
        expect(schema!.pattern).toBe(CSS_COLOR_PATTERN);
        expect(schema!.maxLength).toBe(64);
        expect(kept(path, "rebeccapurple")).toBe(true);
        expect(kept(path, "gren")).toBe(false);
        expect(kept(path, null)).toBe(value === null);
      });
    } else if (path.join(".") === "edge.dashPattern") {
      it("uses the shared dash pattern", () => {
        expect(schema!.pattern).toBe(DASH_PATTERN);
        expect(kept(path, "4, 2")).toBe(true);
        expect(kept(path, "4,,2")).toBe(false);
      });
    } else {
      it("enumerates exactly the accepted values", () => {
        const values = ENUMS.map((e) => Object.values(e)).find((v) => v.includes(value as string));
        expect(values, "no enum constant contains the default").toBeDefined();
        expect(schema!.enum).toEqual(values);
        for (const v of values!) expect(kept(path, v)).toBe(true);
        expect(kept(path, `${value}x`)).toBe(false);
      });
    }
  });
});
