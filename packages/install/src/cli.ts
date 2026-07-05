import { AGENTS, createTelemetry, runRemove, type Scope, type SyncOptions } from "@tecture/skill";
import { CODEGRAPH_PACKAGE, CodegraphSetupError } from "./codegraph.js";
import { runCheckWithCodegraph, runInstall } from "./install.js";

type Command = "sync" | "remove" | "check";

interface ParsedArgs {
  command: Command;
  agentIds: string[];
  scope?: Scope;
  yes: boolean;
  force: boolean;
  help: boolean;
}

const USAGE = `tecture installer — the architecture-docs skill + the required CodeGraph companion

Sets up everything Tecture needs in one command: installs the skill into your
agents, installs the CodeGraph CLI globally (${CODEGRAPH_PACKAGE}), configures
its MCP server for agents that support it (Claude Code, Cursor, Codex), and
indexes the current repository. CodeGraph is mandatory — if its setup fails,
nothing is installed.

Usage:
  npx @tecture/install@latest [options]        install or update (interactive)
  npx @tecture/install@latest --check          report installed vs available, change nothing
  npx @tecture/install@latest remove           uninstall the skill (CodeGraph is left in place)

Options:
  --agent <id>     target a specific agent (repeatable). Known: ${AGENTS.map((a) => a.id).join(", ")}
  --global         use the machine-wide skills directory
  --project        use this repo's skills directory (default)
  --check          report status only; make no changes
  -y, --yes        non-interactive; accept defaults (all agents, project scope)
  --force          reinstall/overwrite even if up to date or locally edited
  -h, --help       show this help

Note: always run with @latest — npx caches packages, so a bare
@tecture/install may re-run a stale installer and appear to do nothing.

Skill-only installs (no CodeGraph): npx @tecture/skill@latest`;

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    command: "sync",
    agentIds: [],
    yes: false,
    force: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "sync":
      case "install":
      case "update":
        parsed.command = "sync";
        break;
      case "remove":
      case "uninstall":
        parsed.command = "remove";
        break;
      case "check":
      case "--check":
        parsed.command = "check";
        break;
      case "--agent":
      case "-a": {
        const next = argv[i + 1];
        if (!next) throw new Error(`Missing value for ${arg}`);
        parsed.agentIds.push(next);
        i++;
        break;
      }
      case "--global":
        parsed.scope = "global";
        break;
      case "--project":
        parsed.scope = "project";
        break;
      case "-y":
      case "--yes":
        parsed.yes = true;
        break;
      case "--force":
        parsed.force = true;
        break;
      case "-h":
      case "--help":
        parsed.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

async function main(): Promise<void> {
  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`Error: ${(err as Error).message}\n`);
    console.error(USAGE);
    process.exit(2);
  }

  if (parsed.help) {
    console.log(USAGE);
    return;
  }

  const opts: SyncOptions = {
    agentIds: parsed.agentIds.length ? parsed.agentIds : undefined,
    scope: parsed.scope,
    yes: parsed.yes,
    force: parsed.force,
    cwd: process.cwd(),
  };

  if (parsed.command === "check") {
    await runCheckWithCodegraph(opts);
  } else if (parsed.command === "remove") {
    await runRemove(opts);
    console.log(
      "\nCodeGraph was left in place (other tools may use it). To remove it:\n" +
        `  codegraph uninstall\n  npm uninstall -g ${CODEGRAPH_PACKAGE}`,
    );
  } else {
    const companion = await runInstall(opts);
    // Anonymous, opt-out, best-effort — mirrors @tecture/skill's telemetry.
    await createTelemetry().capture("install.completed", {
      codegraph: companion.installedNow ? "installed" : "present",
      codegraphVersion: companion.codegraphVersion,
      codegraphTargets: companion.configuredTargets.join(","),
      indexed: companion.initialized,
    });
  }
}

main().catch((err) => {
  if (err instanceof CodegraphSetupError) {
    console.error(`\nError: ${err.message}`);
    console.error(
      "\nInstall aborted — the CodeGraph companion is required. To fix manually:",
    );
    for (const step of err.remedy) console.error(`  ${step}`);
    process.exit(1);
  }
  console.error(`\nError: ${(err as Error).message}`);
  process.exit(1);
});
