# @tecture/skill

One-command installer for the **architecture-docs** agent skill. Installs and
updates the skill across Claude Code, Cursor, GitHub Copilot, Codex, and
Windsurf — copying it into each agent's real skills directory (no symlinks, no
registry, no network).

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
