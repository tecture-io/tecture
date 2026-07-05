import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CODEGRAPH_TARGETS,
  CodegraphSetupError,
  ensureCodegraphCompanion,
  MIN_CODEGRAPH_VERSION,
  type CommandRunner,
  type RunOptions,
  type RunResult,
} from "../src/codegraph.js";

interface Call {
  cmd: string;
  args: string[];
  opts: RunOptions;
}

/** Scripted runner: each rule matches (cmd, first arg) and yields a result. */
function fakeRunner(
  script: Array<{
    match: (cmd: string, args: string[]) => boolean;
    result: RunResult | Error;
  }>,
  calls: Call[],
): CommandRunner {
  return async (cmd, args, opts) => {
    calls.push({ cmd, args, opts });
    for (const rule of script) {
      if (rule.match(cmd, args)) {
        if (rule.result instanceof Error) throw rule.result;
        return rule.result;
      }
    }
    throw new Error(`unexpected command: ${cmd} ${args.join(" ")}`);
  };
}

const ok = (stdout = ""): RunResult => ({ code: 0, stdout, stderr: "" });
const fail = (code: number, stderr = ""): RunResult => ({ code, stdout: "", stderr });

const versionOk = {
  match: (cmd: string, args: string[]) => cmd === "codegraph" && args[0] === "--version",
  result: ok("codegraph 1.2.0\n"),
};
const codegraphInstallOk = {
  match: (cmd: string, args: string[]) => cmd === "codegraph" && args[0] === "install",
  result: ok(),
};
const codegraphInitOk = {
  match: (cmd: string, args: string[]) => cmd === "codegraph" && args[0] === "init",
  result: ok(),
};
const npmOk = {
  match: (cmd: string) => cmd === "npm",
  result: ok(),
};

let cwd: string;

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), "tecture-install-test-"));
});

afterEach(async () => {
  await rm(cwd, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function baseOpts(overrides: Record<string, unknown> = {}) {
  return {
    cwd,
    scope: "project" as const,
    agentIds: ["claude-code"],
    yes: true,
    ...overrides,
  };
}

describe("detection", () => {
  it("skips npm install when codegraph is present at the floor version", async () => {
    const calls: Call[] = [];
    const runner = fakeRunner([versionOk, codegraphInstallOk, codegraphInitOk], calls);
    const result = await ensureCodegraphCompanion(baseOpts(), runner);
    expect(result.installedNow).toBe(false);
    expect(result.codegraphVersion).toBe("1.2.0");
    expect(calls.some((c) => c.cmd === "npm")).toBe(false);
  });

  it("installs when the binary is missing (spawn error)", async () => {
    const calls: Call[] = [];
    let installed = false;
    const runner: CommandRunner = async (cmd, args, opts) => {
      calls.push({ cmd, args, opts });
      if (cmd === "codegraph" && args[0] === "--version") {
        if (!installed) throw new Error("spawn codegraph ENOENT");
        return ok("codegraph 1.3.0\n");
      }
      if (cmd === "npm") {
        installed = true;
        return ok();
      }
      return ok();
    };
    const result = await ensureCodegraphCompanion(baseOpts(), runner);
    expect(result.installedNow).toBe(true);
    expect(result.codegraphVersion).toBe("1.3.0");
    expect(calls.some((c) => c.cmd === "npm" && c.args.join(" ") === "install -g @colbymchenry/codegraph")).toBe(true);
  });

  it("treats garbage --version output as not installed", async () => {
    let asked = 0;
    const runner: CommandRunner = async (cmd, args) => {
      if (cmd === "codegraph" && args[0] === "--version") {
        asked += 1;
        return asked === 1 ? ok("segfault???") : ok("1.2.0");
      }
      return ok();
    };
    const result = await ensureCodegraphCompanion(baseOpts(), runner);
    expect(result.installedNow).toBe(true);
  });
});

describe("version floor / upgrade (grill decision 10)", () => {
  it("--yes upgrades silently and prints a notice with old version + floor", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    let upgraded = false;
    const runner: CommandRunner = async (cmd, args) => {
      if (cmd === "codegraph" && args[0] === "--version") {
        return ok(upgraded ? "1.9.0" : "1.1.0");
      }
      if (cmd === "npm") {
        upgraded = true;
        return ok();
      }
      return ok();
    };
    const result = await ensureCodegraphCompanion(baseOpts({ yes: true }), runner);
    expect(result.installedNow).toBe(true);
    const notice = log.mock.calls.map((c) => String(c[0])).find((l) => l.includes("upgrading codegraph"));
    expect(notice).toBeDefined();
    expect(notice).toContain("1.1.0");
    expect(notice).toContain(MIN_CODEGRAPH_VERSION);
  });

  it("interactive upgrade asks confirm; decline aborts with remedy", async () => {
    const confirmFn = vi.fn(async (_message: string, _def?: boolean) => false);
    const runner: CommandRunner = async (cmd, args) => {
      if (cmd === "codegraph" && args[0] === "--version") return ok("1.0.0");
      return ok();
    };
    const err = await ensureCodegraphCompanion(
      baseOpts({ yes: false, confirmFn }),
      runner,
    ).catch((e) => e);
    expect(err).toBeInstanceOf(CodegraphSetupError);
    expect(confirmFn).toHaveBeenCalledOnce();
    expect(confirmFn.mock.calls[0]?.[0]).toContain("1.0.0");
    expect((err as CodegraphSetupError).remedy.join("\n")).toContain(
      "npm install -g @colbymchenry/codegraph",
    );
  });
});

describe("npm failure remedies", () => {
  it("npm non-zero exit throws with the exact manual commands", async () => {
    const runner = fakeRunner(
      [
        {
          match: (cmd, args) => cmd === "codegraph" && args[0] === "--version",
          result: new Error("spawn codegraph ENOENT"),
        },
        { match: (cmd) => cmd === "npm", result: fail(1, "network timeout") },
      ],
      [],
    );
    const err = await ensureCodegraphCompanion(baseOpts(), runner).catch((e) => e);
    expect(err).toBeInstanceOf(CodegraphSetupError);
    const remedy = (err as CodegraphSetupError).remedy.join("\n");
    expect(remedy).toContain("npm install -g @colbymchenry/codegraph");
    expect(remedy).toContain("codegraph init");
    expect(remedy).toContain("npx @tecture/install@latest");
  });

  it("EACCES-flavored npm failure recommends nvm / npm prefix / sudo-last-resort", async () => {
    const runner = fakeRunner(
      [
        {
          match: (cmd, args) => cmd === "codegraph" && args[0] === "--version",
          result: new Error("spawn codegraph ENOENT"),
        },
        {
          match: (cmd) => cmd === "npm",
          result: fail(243, "EACCES: permission denied, mkdir '/usr/local/lib/node_modules'"),
        },
      ],
      [],
    );
    const err = await ensureCodegraphCompanion(baseOpts(), runner).catch((e) => e);
    expect(err).toBeInstanceOf(CodegraphSetupError);
    const remedy = (err as CodegraphSetupError).remedy.join("\n");
    expect(remedy).toContain("nvm");
    expect(remedy).toContain("npm config set prefix");
    expect(remedy).toContain("sudo npm install -g");
  });

  it("still-missing after npm install points at PATH", async () => {
    const runner = fakeRunner(
      [
        {
          match: (cmd, args) => cmd === "codegraph" && args[0] === "--version",
          result: new Error("spawn codegraph ENOENT"),
        },
        { match: (cmd) => cmd === "npm", result: ok() },
      ],
      [],
    );
    const err = await ensureCodegraphCompanion(baseOpts(), runner).catch((e) => e);
    expect(err).toBeInstanceOf(CodegraphSetupError);
    expect((err as CodegraphSetupError).remedy.join("\n")).toContain("PATH");
  });
});

describe("MCP configuration (grill decision 7 + explicit-flags guard)", () => {
  it.each([
    ["claude-code", "claude"],
    ["cursor", "cursor"],
    ["codex", "codex"],
  ])("maps tecture agent %s to codegraph target %s", async (agentId, target) => {
    const calls: Call[] = [];
    const runner = fakeRunner([versionOk, codegraphInstallOk, codegraphInitOk], calls);
    await ensureCodegraphCompanion(baseOpts({ agentIds: [agentId] }), runner);
    const install = calls.find((c) => c.cmd === "codegraph" && c.args[0] === "install");
    expect(install?.args).toEqual([
      "install",
      "--yes",
      "--target",
      target,
      "--location",
      "local",
    ]);
  });

  it("passes ALL selected mappable agents as one comma-separated --target", async () => {
    const calls: Call[] = [];
    const runner = fakeRunner([versionOk, codegraphInstallOk, codegraphInitOk], calls);
    await ensureCodegraphCompanion(
      baseOpts({ agentIds: ["claude-code", "cursor", "codex", "copilot", "windsurf"] }),
      runner,
    );
    const install = calls.find((c) => c.cmd === "codegraph" && c.args[0] === "install");
    expect(install?.args).toContain("claude,cursor,codex");
  });

  it("copilot/windsurf-only runs skip codegraph install but still detect + init", async () => {
    const calls: Call[] = [];
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const runner = fakeRunner([versionOk, codegraphInitOk], calls);
    const result = await ensureCodegraphCompanion(
      baseOpts({ agentIds: ["copilot", "windsurf"] }),
      runner,
    );
    expect(result.configuredTargets).toEqual([]);
    expect(calls.some((c) => c.args[0] === "install")).toBe(false);
    expect(calls.some((c) => c.args[0] === "init")).toBe(true);
    expect(log.mock.calls.flat().join("\n")).toContain("CLI directly");
  });

  it("global scope maps to --location global", async () => {
    const calls: Call[] = [];
    await mkdir(join(cwd, ".git"), { recursive: true }); // keep init running
    const runner = fakeRunner([versionOk, codegraphInstallOk, codegraphInitOk], calls);
    await ensureCodegraphCompanion(baseOpts({ scope: "global" }), runner);
    const install = calls.find((c) => c.args[0] === "install");
    expect(install?.args).toContain("global");
    expect(install?.args).not.toContain("local");
  });

  it("codegraph install failure aborts with the exact command as remedy", async () => {
    const runner = fakeRunner(
      [versionOk, { match: (cmd, args) => cmd === "codegraph" && args[0] === "install", result: fail(1) }],
      [],
    );
    const err = await ensureCodegraphCompanion(baseOpts(), runner).catch((e) => e);
    expect(err).toBeInstanceOf(CodegraphSetupError);
    expect((err as CodegraphSetupError).remedy.join("\n")).toContain(
      "install --yes --target claude --location local",
    );
  });
});

describe("init behavior", () => {
  it("runs init for project scope in a non-git cwd", async () => {
    const calls: Call[] = [];
    const runner = fakeRunner([versionOk, codegraphInstallOk, codegraphInitOk], calls);
    const result = await ensureCodegraphCompanion(baseOpts(), runner);
    const init = calls.find((c) => c.args[0] === "init");
    expect(init).toBeDefined();
    expect(init?.args).toEqual(["init"]); // no path arg — cwd travels via option
    expect(init?.opts.cwd).toBe(cwd);
    expect(result.initialized).toBe(true);
  });

  it("runs init for global scope when cwd is a git repo", async () => {
    await mkdir(join(cwd, ".git"), { recursive: true });
    const calls: Call[] = [];
    const runner = fakeRunner([versionOk, codegraphInstallOk, codegraphInitOk], calls);
    const result = await ensureCodegraphCompanion(baseOpts({ scope: "global" }), runner);
    expect(calls.some((c) => c.args[0] === "init")).toBe(true);
    expect(result.initialized).toBe(true);
  });

  it("skips init for global scope in a non-git cwd, with a per-repo instruction", async () => {
    const calls: Call[] = [];
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const runner = fakeRunner([versionOk, codegraphInstallOk], calls);
    const result = await ensureCodegraphCompanion(baseOpts({ scope: "global" }), runner);
    expect(calls.some((c) => c.args[0] === "init")).toBe(false);
    expect(result.initialized).toBe(false);
    expect(log.mock.calls.flat().join("\n")).toContain("codegraph init");
  });

  it("init failure aborts with cd + init remedy", async () => {
    const runner = fakeRunner(
      [versionOk, codegraphInstallOk, { match: (cmd, args) => cmd === "codegraph" && args[0] === "init", result: fail(1) }],
      [],
    );
    const err = await ensureCodegraphCompanion(baseOpts(), runner).catch((e) => e);
    expect(err).toBeInstanceOf(CodegraphSetupError);
    expect((err as CodegraphSetupError).remedy).toEqual([`cd ${cwd}`, "codegraph init"]);
  });
});

describe("call ordering", () => {
  it("runs version -> npm -> install -> init in order", async () => {
    const calls: Call[] = [];
    let installed = false;
    const runner: CommandRunner = async (cmd, args, opts) => {
      calls.push({ cmd, args, opts });
      if (cmd === "codegraph" && args[0] === "--version") {
        return installed ? ok("1.2.0") : fail(1);
      }
      if (cmd === "npm") {
        installed = true;
        return ok();
      }
      return ok();
    };
    await ensureCodegraphCompanion(baseOpts(), runner);
    const sequence = calls.map((c) => (c.cmd === "npm" ? "npm" : c.args[0]));
    expect(sequence).toEqual(["--version", "npm", "--version", "install", "init"]);
  });
});

describe("environment (locked decision 4)", () => {
  it("defaultRunner spawns with CODEGRAPH_TELEMETRY=0", async () => {
    const { defaultRunner } = await import("../src/codegraph.js");
    const result = await defaultRunner(
      process.execPath,
      ["-e", "console.log(process.env.CODEGRAPH_TELEMETRY)"],
      { io: "capture", timeoutMs: 15_000 },
    );
    expect(result.code).toBe(0);
    expect(result.stdout.trim()).toBe("0");
  });
});

describe("target map", () => {
  it("covers exactly the agents with a codegraph MCP integration", () => {
    expect(CODEGRAPH_TARGETS).toEqual({
      "claude-code": "claude",
      cursor: "cursor",
      codex: "codex",
    });
  });
});
