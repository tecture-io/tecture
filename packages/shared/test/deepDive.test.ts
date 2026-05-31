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
  it("invokes the skill keyed on the node id and label", () => {
    const prompt = buildDeepDivePrompt({
      id: "api-clients",
      label: "API Clients & Helpers",
    });
    expect(prompt).toContain("tecture skill");
    expect(prompt).toContain("deep-dive");
    expect(prompt).toContain("`api-clients`");
    expect(prompt).toContain("API Clients & Helpers");
  });

  it("does not restate instructions the skill already owns", () => {
    const prompt = buildDeepDivePrompt({
      id: "api-clients",
      label: "API Clients & Helpers",
    });
    expect(prompt).not.toMatch(/descriptions\//);
    expect(prompt).not.toMatch(/prose only/i);
    expect(prompt).not.toMatch(/read its code/i);
    expect(prompt).not.toMatch(/dependencies/i);
  });

  it("is a single concise line", () => {
    const prompt = buildDeepDivePrompt({ id: "auth", label: "Auth Service" });
    expect(prompt.split("\n")).toHaveLength(1);
  });

  it("omits the parenthetical when the label equals the id", () => {
    const prompt = buildDeepDivePrompt({ id: "worker", label: "worker" });
    expect(prompt).toContain("`worker`");
    expect(prompt).not.toContain("(worker)");
  });
});
