import {
  confirm,
  runCheck,
  runSync,
  type SyncOptions,
} from "@tecture/skill";
import {
  defaultRunner,
  ensureCodegraphCompanion,
  type CommandRunner,
  type CompanionResult,
} from "./codegraph.js";

/**
 * Full Tecture install: CodeGraph companion first (mandatory — a failure
 * aborts before any skill file is written), then the skill itself via
 * @tecture/skill's runSync.
 */
export async function runInstall(
  opts: SyncOptions,
  runner: CommandRunner = defaultRunner,
): Promise<CompanionResult> {
  let companion: CompanionResult | undefined;
  await runSync(opts, {
    // Runs after agents/scope are resolved and BEFORE any skill file is
    // written — a companion failure aborts with nothing on disk.
    afterTargetsChosen: async (info) => {
      companion = await ensureCodegraphCompanion(
        {
          cwd: info.cwd,
          scope: info.scope,
          agentIds: info.agentIds,
          yes: opts.yes,
          confirmFn: confirm,
        },
        runner,
      );
    },
  });
  if (!companion) {
    // Unreachable: runSync either called the hook or threw.
    throw new Error("companion setup did not run");
  }
  return companion;
}

/** Skill check (via @tecture/skill) plus a CodeGraph companion status section. */
export async function runCheckWithCodegraph(
  opts: SyncOptions,
  runner: CommandRunner = defaultRunner,
): Promise<void> {
  await runCheck(opts);

  console.log("\nCodeGraph companion:");
  let version: string | null = null;
  try {
    const res = await runner("codegraph", ["--version"], {
      io: "capture",
      timeoutMs: 15_000,
    });
    version =
      res.code === 0 ? (/(\d+\.\d+\.\d+)/.exec(res.stdout)?.[1] ?? null) : null;
  } catch {
    version = null;
  }
  if (!version) {
    console.log("  NOT INSTALLED — run npx @tecture/install@latest to set it up.");
    return;
  }
  console.log(`  codegraph ${version}`);
  try {
    const res = await runner("codegraph", ["status", "--json"], {
      cwd: opts.cwd,
      io: "capture",
      timeoutMs: 30_000,
    });
    if (res.code === 0) {
      const status = JSON.parse(res.stdout) as {
        initialized?: boolean;
        fileCount?: number;
        pendingChanges?: { added?: number; modified?: number; removed?: number };
      };
      const pending =
        (status.pendingChanges?.added ?? 0) +
        (status.pendingChanges?.modified ?? 0) +
        (status.pendingChanges?.removed ?? 0);
      console.log(
        status.initialized
          ? `  index: initialized (${status.fileCount ?? "?"} files, ${pending} pending change(s))`
          : "  index: NOT INITIALIZED here — run `codegraph init` in this repo.",
      );
    } else {
      console.log(
        "  index: NOT INITIALIZED here — run `codegraph init` in this repo.",
      );
    }
  } catch {
    console.log("  index: status unavailable.");
  }
}
