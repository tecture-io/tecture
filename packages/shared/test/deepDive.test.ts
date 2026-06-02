import { describe, expect, it } from "vitest";
import { buildDeepDivePrompt, isDeepDivable } from "../src/index";

describe("isDeepDivable", () => {
  it("includes code-container node types", () => {
    expect(isDeepDivable({ meta: { type: "service" } })).toBe(true);
    expect(isDeepDivable({ meta: { type: "frontend" } })).toBe(true);
    expect(isDeepDivable({ meta: { type: "gateway" } })).toBe(true);
  });

  it("includes any node with a repo path, regardless of type", () => {
    expect(isDeepDivable({ path: "src/db/", meta: { type: "database" } })).toBe(
      true,
    );
  });

  it("excludes people, external SaaS, and managed infra without a path", () => {
    expect(isDeepDivable({ meta: { type: "person" } })).toBe(false);
    expect(isDeepDivable({ meta: { type: "external" } })).toBe(false);
    expect(isDeepDivable({ meta: { type: "database" } })).toBe(false);
    expect(isDeepDivable({ meta: { type: "queue" } })).toBe(false);
    expect(isDeepDivable({})).toBe(false);
  });
});

describe("buildDeepDivePrompt", () => {
  it("invokes the skill via its slash command, keyed on the node id", () => {
    const prompt = buildDeepDivePrompt({ id: "api-clients" });
    expect(prompt).toBe("/architecture-docs deep-dive api-clients");
  });

  it("does not restate instructions the skill already owns", () => {
    const prompt = buildDeepDivePrompt({ id: "api-clients" });
    expect(prompt).not.toMatch(/descriptions\//);
    expect(prompt).not.toMatch(/prose only/i);
    expect(prompt).not.toMatch(/read its code/i);
    expect(prompt).not.toMatch(/dependencies/i);
  });

  it("is a single concise line", () => {
    const prompt = buildDeepDivePrompt({ id: "auth" });
    expect(prompt.split("\n")).toHaveLength(1);
  });
});
