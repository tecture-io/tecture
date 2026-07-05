import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// runSync resolves the bundled skill from dist/, which doesn't exist under
// vitest — point it at a payload dir each test fabricates.
const bundled = vi.hoisted(() => ({
  name: "architecture-docs",
  version: "9.9.9",
  payloadDir: "",
}));
vi.mock("../src/skill.js", () => ({
  loadBundledSkill: async () => ({ ...bundled }),
}));

import { compareVersions, runSync, type SyncHooks } from "../src/install.js";
import { skillTargetDir } from "../src/paths.js";
import { AGENTS, findAgent } from "../src/agents.js";

const CLAUDE = findAgent("claude-code")!;

let tmp: string;

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), "tecture-skill-test-"));
  bundled.version = "9.9.9";
  bundled.payloadDir = join(tmp, "payload", "architecture-docs");
  await mkdir(bundled.payloadDir, { recursive: true });
  await writeFile(join(bundled.payloadDir, "SKILL.md"), "# skill\n", "utf8");
  vi.stubEnv("DO_NOT_TRACK", "1"); // keep telemetry inert in tests
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(tmp, { recursive: true, force: true });
});

function opts(overrides: Partial<Parameters<typeof runSync>[0]> = {}) {
  return {
    agentIds: ["claude-code"],
    scope: "project" as const,
    yes: true,
    force: false,
    cwd: tmp,
    ...overrides,
  };
}

function targetDir(): string {
  return skillTargetDir(CLAUDE, "project", tmp, bundled.name);
}

describe("runSync (no hooks — pure skill install, unchanged behavior)", () => {
  it("installs the payload and writes .tecture.json with a checksum", async () => {
    await runSync(opts());
    const dir = targetDir();
    expect(existsSync(join(dir, "SKILL.md"))).toBe(true);
    const manifest = JSON.parse(await readFile(join(dir, ".tecture.json"), "utf8"));
    expect(manifest).toMatchObject({
      skill: "architecture-docs",
      version: "9.9.9",
      agent: "claude-code",
      scope: "project",
      installer: "@tecture/skill",
    });
    expect(manifest.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("re-running with the same version is a no-op (up-to-date)", async () => {
    await runSync(opts());
    const manifestPath = join(targetDir(), ".tecture.json");
    const before = await readFile(manifestPath, "utf8");
    await runSync(opts());
    const after = await readFile(manifestPath, "utf8");
    expect(after).toBe(before);
  });

  it("a newer bundled version updates the install", async () => {
    await runSync(opts());
    bundled.version = "10.0.0";
    await writeFile(join(bundled.payloadDir, "SKILL.md"), "# skill v10\n", "utf8");
    await runSync(opts());
    const manifest = JSON.parse(
      await readFile(join(targetDir(), ".tecture.json"), "utf8"),
    );
    expect(manifest.version).toBe("10.0.0");
    expect(await readFile(join(targetDir(), "SKILL.md"), "utf8")).toContain("v10");
  });

  it("locally-modified installs are skipped under --yes on update", async () => {
    await runSync(opts());
    await writeFile(join(targetDir(), "SKILL.md"), "# edited locally\n", "utf8");
    bundled.version = "10.0.1";
    await runSync(opts());
    expect(await readFile(join(targetDir(), "SKILL.md"), "utf8")).toContain(
      "edited locally",
    );
  });
});

describe("runSync hooks (the @tecture/install seam)", () => {
  it("calls afterTargetsChosen once with resolved agents/scope/cwd BEFORE any file copy", async () => {
    const calls: Array<{ agentIds: string[]; scope: string; cwd: string }> = [];
    const hooks: SyncHooks = {
      afterTargetsChosen: async (info) => {
        calls.push(info);
        // Nothing may exist on disk yet — that is the hard-fail guarantee.
        expect(existsSync(targetDir())).toBe(false);
      },
    };
    await runSync(opts({ agentIds: ["claude-code", "cursor"] }), hooks);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({
      agentIds: ["claude-code", "cursor"],
      scope: "project",
      cwd: tmp,
    });
  });

  it("a throwing hook aborts the run with zero skill files written", async () => {
    const hooks: SyncHooks = {
      afterTargetsChosen: async () => {
        throw new Error("companion failed");
      },
    };
    await expect(runSync(opts(), hooks)).rejects.toThrow("companion failed");
    for (const agent of AGENTS) {
      expect(existsSync(skillTargetDir(agent, "project", tmp, bundled.name))).toBe(
        false,
      );
    }
    // Only the fabricated payload dir exists in cwd — nothing else was created.
    expect((await readdir(tmp)).sort()).toEqual(["payload"]);
  });
});

describe("compareVersions", () => {
  it("orders dotted numeric versions", () => {
    expect(compareVersions("1.2.0", "1.2.0")).toBe(0);
    expect(compareVersions("1.2.0", "1.10.0")).toBe(-1);
    expect(compareVersions("2.0.0", "1.9.9")).toBe(1);
  });

  it("treats missing segments as zero", () => {
    expect(compareVersions("1.2", "1.2.0")).toBe(0);
    expect(compareVersions("1.2.1", "1.2")).toBe(1);
  });
});
