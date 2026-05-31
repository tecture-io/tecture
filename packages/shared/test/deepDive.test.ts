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
  it("keys the prompt and target file on the node id", () => {
    const prompt = buildDeepDivePrompt({
      id: "api-clients",
      label: "API Clients & Helpers",
      path: "packages/api/src/clients/",
    });
    expect(prompt).toContain("`api-clients`");
    expect(prompt).toContain("API Clients & Helpers");
    expect(prompt).toContain("`packages/api/src/clients/`");
    expect(prompt).toContain("architecture/descriptions/api-clients.md");
    expect(prompt).toContain("Prose only");
  });

  it("omits the path clause when the node has no path", () => {
    const prompt = buildDeepDivePrompt({ id: "auth", label: "Auth Service" });
    expect(prompt).toContain("Read its code and trace");
    expect(prompt).not.toContain("Read its code at");
  });

  it("omits the parenthetical when the label equals the id", () => {
    const prompt = buildDeepDivePrompt({ id: "worker", label: "worker" });
    expect(prompt).toContain("`worker`");
    expect(prompt).not.toContain("(worker)");
  });
});
