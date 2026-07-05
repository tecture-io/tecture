# @tecture/install

One-command Tecture setup: installs the **architecture-docs agent skill** and the **CodeGraph companion** it requires.

```bash
npx @tecture/install@latest
```

What it does, in order:

1. Resolves which agents get the skill (Claude Code, Cursor, GitHub Copilot, Codex, Windsurf) and at which scope — interactive, or `--yes` for all agents at project scope.
2. **CodeGraph companion (mandatory):**
   - Installs `@colbymchenry/codegraph` globally with npm when it's missing or older than the required floor (non-interactive runs upgrade with a printed notice).
   - Configures its MCP server for agents that support it (Claude Code, Cursor, Codex) — project scope writes repo-level config (`.mcp.json`), global scope writes machine-level config. Copilot and Windsurf have no CodeGraph MCP integration; the skill uses the `codegraph` CLI there.
   - Indexes the repository (`codegraph init` — one-time; large repos can take a few minutes).
3. Installs the skill files (delegated to [`@tecture/skill`](https://www.npmjs.com/package/@tecture/skill)).

**CodeGraph is not optional.** The skill hard-requires it (discovery, deep-dives, and the evidence/drift check all read its index), so if any companion step fails the install aborts with the exact manual commands to finish — and no skill files are written. Air-gapped or offline? Run the printed remedy commands when you're back online, or use `npx @tecture/skill@latest` for a skill-only install (the skill will still stop and ask for CodeGraph at authoring time).

Every codegraph process this installer spawns runs with `CODEGRAPH_TELEMETRY=0` — tecture never enables CodeGraph's telemetry on your behalf.

## Commands & options

```
npx @tecture/install@latest [options]        install or update (interactive)
npx @tecture/install@latest --check          report installed vs available, change nothing
npx @tecture/install@latest remove           uninstall the skill (CodeGraph is left in place)

--agent <id>     target a specific agent (repeatable): claude-code, cursor, copilot, codex, windsurf
--global         use the machine-wide skills directory
--project        use this repo's skills directory (default)
-y, --yes        non-interactive; accept defaults (all agents, project scope)
--force          reinstall/overwrite even if up to date or locally edited
```

`remove` uninstalls the skill only — CodeGraph may be used by other tools, so it stays; the command prints how to remove it (`codegraph uninstall`, `npm uninstall -g @colbymchenry/codegraph`).

Always run with `@latest` — npx caches packages, so a bare `@tecture/install` may re-run a stale installer.
