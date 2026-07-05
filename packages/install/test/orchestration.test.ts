import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// runInstall drives @tecture/skill's runSync, which loads the bundled skill
// from dist/ — absent under vitest. Fabricate a payload per test.
const bundled = vi.hoisted(() => ({
  name: "architecture-docs",
  version: "9.9.9",
  payloadDir: "",
}));
// The skill package resolves its bundle via its own internal module — mock at
// that layer so runSync itself stays real. (In the workspace, @tecture/skill
// resolves to its TypeScript source, so this path is the module runSync uses.)
vi.mock("../../installer/src/skill.js", () => ({
  loadBundledSkill: async () => ({ ...bundled }),
}));

import { findAgent } from "@tecture/skill";
import { skillTargetDir } from "../../installer/src/paths.js";
import { runInstall } from "../src/install.js";
import { CodegraphSetupError, type CommandRunner } from "../src/codegraph.js";

let cwd: string;

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), "tecture-orchestration-"));
  bundled.version = "9.9.9";
  bundled.payloadDir = join(cwd, "payload", "architecture-docs");
  await mkdir(bundled.payloadDir, { recursive: true });
  await writeFile(join(bundled.payloadDir, "SKILL.md"), "# skill\n", "utf8");
  vi.stubEnv("DO_NOT_TRACK", "1");
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(cwd, { recursive: true, force: true });
});

const okRunner: CommandRunner = async (cmd, args) => {
  if (cmd === "codegraph" && args[0] === "--version") {
    return { code: 0, stdout: "1.2.0", stderr: "" };
  }
  return { code: 0, stdout: "", stderr: "" };
};

function targetDir(): string {
  return skillTargetDir(findAgent("claude-code")!, "project", cwd, bundled.name);
}

function opts() {
  return {
    agentIds: ["claude-code"],
    scope: "project" as const,
    yes: true,
    force: false,
    cwd,
  };
}

describe("runInstall orchestration", () => {
  it("companion success -> skill installed, manifest written, result returned", async () => {
    const companion = await runInstall(opts(), okRunner);
    expect(companion.codegraphVersion).toBe("1.2.0");
    expect(companion.configuredTargets).toEqual(["claude"]);
    expect(companion.initialized).toBe(true);
    expect(existsSync(join(targetDir(), "SKILL.md"))).toBe(true);
    const manifest = JSON.parse(
      await readFile(join(targetDir(), ".tecture.json"), "utf8"),
    );
    expect(manifest.installer).toBe("@tecture/skill");
  });

  it("companion failure -> hard abort, ZERO skill files written", async () => {
    const failingRunner: CommandRunner = async (cmd, args) => {
      if (cmd === "codegraph" && args[0] === "--version") {
        throw new Error("spawn codegraph ENOENT");
      }
      if (cmd === "npm") return { code: 1, stdout: "", stderr: "boom" };
      return { code: 0, stdout: "", stderr: "" };
    };
    const err = await runInstall(opts(), failingRunner).catch((e) => e);
    expect(err).toBeInstanceOf(CodegraphSetupError);
    expect((err as CodegraphSetupError).remedy.length).toBeGreaterThan(0);
    expect(existsSync(targetDir())).toBe(false);
  });

  it("companion runs BEFORE any skill file lands (ordering probe)", async () => {
    let skillDirExistedDuringCompanion: boolean | null = null;
    const probeRunner: CommandRunner = async (cmd, args) => {
      if (cmd === "codegraph" && args[0] === "--version") {
        skillDirExistedDuringCompanion = existsSync(targetDir());
        return { code: 0, stdout: "1.2.0", stderr: "" };
      }
      return { code: 0, stdout: "", stderr: "" };
    };
    await runInstall(opts(), probeRunner);
    expect(skillDirExistedDuringCompanion).toBe(false);
    expect(existsSync(targetDir())).toBe(true);
  });
});
