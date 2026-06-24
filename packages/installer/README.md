# @tecture/skill

One-command installer for the **architecture-docs** agent skill. Installs and
updates the skill across Claude Code, Cursor, GitHub Copilot, Codex, and
Windsurf — copying it into each agent's real skills directory (no symlinks, no
registry). The skill itself is bundled in the package, so installs work offline;
the only network call is an optional, anonymous usage ping (see
[Telemetry](#telemetry)).

## Usage

```bash
# Install or update (interactive — pick agents + scope)
npx @tecture/skill@latest

# Non-interactive (CI): all supported agents, project scope
npx @tecture/skill@latest --yes

# Just check what's installed vs available
npx @tecture/skill@latest --check

# Uninstall
npx @tecture/skill@latest remove
```

> Always run with `@latest`. npx caches packages, so a bare `@tecture/skill`
> can re-run a stale installer and appear to do nothing.

The bare command is a single smart action: it installs where the skill is
missing and updates where it's behind. There's no separate `install` vs
`update` step (both exist as aliases out of habit, but you never need them).

## Options

| Flag | Meaning |
| --- | --- |
| `--agent <id>` | Target one agent (repeatable). Ids: `claude-code`, `cursor`, `copilot`, `codex`, `windsurf` |
| `--global` | Machine-wide skills directory |
| `--project` | This repo's skills directory (default) |
| `--check` | Report status only; change nothing |
| `-y`, `--yes` | Non-interactive; accept defaults |
| `--force` | Reinstall/overwrite even if up to date or locally edited |
| `-h`, `--help` | Show help |

## How it works

The skill is **bundled inside this package** at build time and stamped with the
package version, so `@tecture/skill@X` always carries skill version `X`
(reproducible, offline). On install it writes a `.tecture.json` manifest next to
the skill recording the version and a content checksum; `--check` and updates use
that to detect what's behind and to avoid clobbering a locally-edited copy.

The agent → directory mapping lives in [`src/agents.ts`](src/agents.ts) — that
table is the only thing that needs maintenance as agents change their skill
locations. Path conventions are adapted from the MIT-licensed
[Agent Skill Manager](https://github.com/luongnv89/asm).

## Telemetry

After a successful install or update the installer sends one anonymous event so
we can see how widely the skill is adopted. It is **anonymous and minimal** — a
random per-machine id (shared with the standalone viewer so a person counts
once), the skill/installer version, your OS platform, and which agent(s) and
scope you installed to. It never sends your name, repo, file paths, or
architecture content.

The request fails silently: if you're offline or the endpoint is unreachable it
times out quickly and the install is unaffected. Opt out completely by setting
`TECTURE_TELEMETRY=0` (or the standard `DO_NOT_TRACK=1`).
