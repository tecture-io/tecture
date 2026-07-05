import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Scope } from "@tecture/skill";
import { compareVersions } from "@tecture/skill";

/**
 * CodeGraph companion setup — the mandatory half of `npx @tecture/install`.
 *
 * Tecture's architecture-docs skill hard-requires CodeGraph (discovery,
 * deep-dives, and the evidence/drift check all read its index), so this module
 * makes a machine ready end-to-end: global CLI on PATH, MCP server configured
 * for the agents that support it, and the repo indexed. Any failure throws
 * CodegraphSetupError — the caller aborts the whole install before a single
 * skill file is written.
 */

export const CODEGRAPH_PACKAGE = "@colbymchenry/codegraph";

/**
 * Floor version: latest release at time of writing — ships index schema 6
 * (>= the evidence script's minimum of 2) and the `install --yes --target
 * --location` flag surface this module drives.
 */
export const MIN_CODEGRAPH_VERSION = "1.2.0";

/**
 * tecture agent id -> codegraph MCP target id. Agents absent here (copilot,
 * windsurf) have no CodeGraph MCP integration — the skill uses the codegraph
 * CLI there, which works because the binary is installed globally.
 */
export const CODEGRAPH_TARGETS: Record<string, string> = {
  "claude-code": "claude",
  cursor: "cursor",
  codex: "codex",
};

export class CodegraphSetupError extends Error {
  constructor(
    message: string,
    public readonly remedy: string[],
  ) {
    super(message);
    this.name = "CodegraphSetupError";
  }
}

export interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

export interface RunOptions {
  cwd?: string;
  /** inherit = stream to the user (progress-bearing commands); capture = read output. */
  io: "inherit" | "capture";
  timeoutMs?: number;
}

export type CommandRunner = (
  cmd: string,
  args: string[],
  opts: RunOptions,
) => Promise<RunResult>;

const isWindows = process.platform === "win32";

export const defaultRunner: CommandRunner = (cmd, args, opts) =>
  new Promise((resolvePromise, reject) => {
    // shell:true on Windows: npm-installed CLIs are .cmd shims, which Node
    // refuses to spawn directly (EINVAL since the CVE-2024-27980 fix). Safe
    // here because every argument is a fixed token — no user input, and cwd
    // travels via the option, never as an argument.
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      shell: isWindows,
      stdio: opts.io === "inherit" ? "inherit" : ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        // Locked decision: tecture-driven codegraph runs never phone home.
        CODEGRAPH_TELEMETRY: "0",
        // Keep CI logs readable — codegraph's progress writes raw ANSI.
        ...(process.stdout.isTTY ? {} : { CODEGRAPH_ASCII: "1" }),
      },
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr?.on("data", (d: Buffer) => (stderr += d.toString()));
    let timer: NodeJS.Timeout | undefined;
    if (opts.timeoutMs) {
      timer = setTimeout(() => child.kill("SIGTERM"), opts.timeoutMs);
      timer.unref();
    }
    child.on("error", (err) => {
      if (timer) clearTimeout(timer);
      reject(err); // ENOENT lands here on POSIX
    });
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      resolvePromise({ code, stdout, stderr });
    });
  });

export interface CompanionOptions {
  cwd: string;
  scope: Scope;
  agentIds: string[];
  yes: boolean;
  confirmFn?: (message: string, def?: boolean) => Promise<boolean>;
}

export interface CompanionResult {
  codegraphVersion: string;
  /** Whether this run installed or upgraded the global CLI. */
  installedNow: boolean;
  /** codegraph MCP target ids that were configured. */
  configuredTargets: string[];
  /** Whether `codegraph init` ran (or the repo was already initialized). */
  initialized: boolean;
}

const VERSION_RE = /(\d+\.\d+\.\d+)/;

async function detectVersion(runner: CommandRunner): Promise<string | null> {
  let result: RunResult;
  try {
    result = await runner("codegraph", ["--version"], {
      io: "capture",
      timeoutMs: 15_000,
    });
  } catch {
    return null; // spawn ENOENT — not installed
  }
  // With shell:true (Windows) a missing command exits non-zero instead of
  // erroring — treat any non-zero / non-semver output as "not installed".
  if (result.code !== 0) return null;
  return VERSION_RE.exec(result.stdout)?.[1] ?? null;
}

function npmInstallRemedy(cwd: string): string[] {
  return [
    `npm install -g ${CODEGRAPH_PACKAGE}`,
    `cd ${cwd} && codegraph init`,
    "npx @tecture/install@latest",
  ];
}

function looksLikePermissionError(result: RunResult): boolean {
  return /EACCES|EPERM|permission denied/i.test(result.stderr + result.stdout);
}

/**
 * Ensure the CodeGraph companion is fully set up. Steps: detect -> install or
 * upgrade (global npm) -> configure MCP for supported agents -> init/index the
 * repo. Every failure throws CodegraphSetupError with exact manual remedies.
 */
export async function ensureCodegraphCompanion(
  opts: CompanionOptions,
  runner: CommandRunner = defaultRunner,
): Promise<CompanionResult> {
  // 1. Detect.
  let version = await detectVersion(runner);
  let installedNow = false;

  // 2. Install or upgrade when missing/below the floor.
  const belowFloor =
    version !== null && compareVersions(version, MIN_CODEGRAPH_VERSION) < 0;
  if (version === null || belowFloor) {
    if (!opts.yes) {
      const question =
        version === null
          ? `Tecture requires the CodeGraph companion (${CODEGRAPH_PACKAGE}). Install it globally with npm? (~50 MB, one time)`
          : `Tecture requires CodeGraph >= ${MIN_CODEGRAPH_VERSION} (found ${version}). Upgrade the global install now?`;
      const ok = opts.confirmFn ? await opts.confirmFn(question, true) : true;
      if (!ok) {
        throw new CodegraphSetupError(
          "CodeGraph is required — install declined.",
          npmInstallRemedy(opts.cwd),
        );
      }
    } else if (belowFloor) {
      console.log(
        `  upgrading codegraph ${version} → latest (required ≥ ${MIN_CODEGRAPH_VERSION})`,
      );
    }

    let result: RunResult;
    try {
      result = await runner("npm", ["install", "-g", CODEGRAPH_PACKAGE], {
        io: "inherit",
        timeoutMs: 600_000,
      });
    } catch (err) {
      throw new CodegraphSetupError(
        `npm is not available (${(err as Error).message}).`,
        ["Install Node.js/npm, then:", ...npmInstallRemedy(opts.cwd)],
      );
    }
    if (result.code !== 0) {
      const permission = looksLikePermissionError(result);
      throw new CodegraphSetupError(
        `npm install -g ${CODEGRAPH_PACKAGE} failed (exit ${result.code}).`,
        permission
          ? [
              "npm's global prefix is not writable. Either:",
              "  - use a Node version manager (nvm/fnm) so globals live in your home dir, or",
              '  - npm config set prefix "$HOME/.npm-global" && add $HOME/.npm-global/bin to PATH, or',
              `  - sudo npm install -g ${CODEGRAPH_PACKAGE}   (last resort)`,
              "then re-run: npx @tecture/install@latest",
            ]
          : npmInstallRemedy(opts.cwd),
      );
    }

    version = await detectVersion(runner);
    if (version === null) {
      throw new CodegraphSetupError(
        "codegraph is still not on PATH after installing.",
        [
          "Open a new terminal (PATH may be stale), or check that `npm bin -g` is on your PATH.",
          ...npmInstallRemedy(opts.cwd),
        ],
      );
    }
    installedNow = true;
  }

  // 3. Configure the MCP server for agents that support it.
  const targets = opts.agentIds
    .map((id) => CODEGRAPH_TARGETS[id])
    .filter((t): t is string => typeof t === "string");
  const configuredTargets = [...new Set(targets)];
  if (configuredTargets.length > 0) {
    // Always pass all three flags: bare `--yes` defaults to --target=auto
    // --location=global, which would configure agents the user did not pick.
    const location = opts.scope === "project" ? "local" : "global";
    const args = [
      "install",
      "--yes",
      "--target",
      configuredTargets.join(","),
      "--location",
      location,
    ];
    const result = await runner("codegraph", args, {
      cwd: opts.cwd,
      io: "inherit",
      timeoutMs: 120_000,
    });
    if (result.code !== 0) {
      throw new CodegraphSetupError(
        `codegraph install failed (exit ${result.code}).`,
        [`codegraph ${args.join(" ")}`, "npx @tecture/install@latest"],
      );
    }
  } else {
    console.log(
      "  note: the selected agents have no CodeGraph MCP integration (Copilot/Windsurf) — the skill will use the codegraph CLI directly.",
    );
  }

  // 4. Init/index the repo. Global-scope runs from a non-repo cwd (e.g. $HOME)
  // would trip codegraph's unsafe-root refusal — print the per-repo step instead.
  let initialized = false;
  if (opts.scope === "project" || existsSync(join(opts.cwd, ".git"))) {
    console.log(
      "  Indexing repository with CodeGraph (one-time; large repos can take a few minutes)…",
    );
    const result = await runner("codegraph", ["init"], {
      cwd: opts.cwd,
      io: "inherit",
      timeoutMs: 1_800_000,
    });
    if (result.code !== 0) {
      throw new CodegraphSetupError(
        `codegraph init failed (exit ${result.code}).`,
        [`cd ${opts.cwd}`, "codegraph init"],
      );
    }
    initialized = true; // fresh init and already-initialized both exit 0
  } else {
    console.log(
      "  note: no repository at the current directory — run `codegraph init` inside each repository you want indexed.",
    );
  }

  return {
    codegraphVersion: version,
    installedNow,
    configuredTargets,
    initialized,
  };
}
