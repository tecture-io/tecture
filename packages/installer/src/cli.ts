import { AGENTS, type Scope } from "./agents.js";
import { runCheck, runRemove, runSync, type SyncOptions } from "./install.js";

type Command = "sync" | "remove" | "check";

interface ParsedArgs {
  command: Command;
  agentIds: string[];
  scope?: Scope;
  yes: boolean;
  force: boolean;
  help: boolean;
}

const USAGE = `tecture skill installer — install & update the architecture-docs agent skill

Usage:
  npx @tecture/skill@latest [options]          install or update (interactive)
  npx @tecture/skill@latest --check            report installed vs available, change nothing
  npx @tecture/skill@latest remove             uninstall

Options:
  --agent <id>     target a specific agent (repeatable). Known: ${AGENTS.map((a) => a.id).join(", ")}
  --global         use the machine-wide skills directory
  --project        use this repo's skills directory (default)
  --check          report status only; make no changes
  -y, --yes        non-interactive; accept defaults (all agents, project scope)
  --force          reinstall/overwrite even if up to date or locally edited
  -h, --help       show this help

Note: always run with @latest — npx caches packages, so a bare
@tecture/skill may re-run a stale installer and appear to do nothing.

This installs the skill only. For the full Tecture setup — skill plus the
required CodeGraph companion (MCP server + code index) — use:
  npx @tecture/install@latest`;

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
        parsed.command = "check";
        break;
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
    await runCheck(opts);
  } else if (parsed.command === "remove") {
    await runRemove(opts);
  } else {
    await runSync(opts);
  }
}

main().catch((err) => {
  console.error(`\nError: ${(err as Error).message}`);
  process.exit(1);
});
