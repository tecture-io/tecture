// The agent directory matrix — the ONLY ongoing maintenance surface of this
// package. Each agent reads SKILL.md skills from its own location; we copy the
// skill into the right directory rather than relying on symlinks (which is the
// bug that makes `npx skills add` invisible to Claude Code).
//
// Paths are the agents' NATIVE SKILL.md skill directories, verified against
// each vendor's docs (June 2026). Note these intentionally differ from the
// MIT-licensed Agent Skill Manager (https://github.com/luongnv89/asm), which
// routes Cursor/Windsurf through their legacy "rules" trees and uses
// `.codex/skills` for Codex — none of which are the native skill locations.
// When an agent moves its skills directory, update the matching row and release.
//
// `global` paths may start with `~` (expanded to the user's home dir).
// `project` paths are relative to the current working directory.

export type Scope = "global" | "project";

export interface AgentDef {
  /** Stable id used by the --agent flag and the install manifest. */
  id: string;
  /** Human label shown in interactive prompts. */
  label: string;
  /** Directory that holds skills for this agent, per scope. */
  dirs: Record<Scope, string>;
}

export const AGENTS: AgentDef[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    dirs: { global: "~/.claude/skills", project: ".claude/skills" },
  },
  {
    id: "cursor",
    label: "Cursor",
    dirs: { global: "~/.cursor/skills", project: ".cursor/skills" },
  },
  {
    id: "copilot",
    label: "GitHub Copilot",
    // Copilot is the odd one out: project skills live under .github/skills,
    // global skills under the copilot config dir.
    dirs: { global: "~/.config/github-copilot/skills", project: ".github/skills" },
  },
  {
    id: "codex",
    label: "Codex",
    // Codex CLI's native skill discovery uses the cross-agent `.agents/skills`
    // tree (project: scanned from cwd up to repo root), not `.codex/skills`.
    // https://developers.openai.com/codex/skills
    dirs: { global: "~/.agents/skills", project: ".agents/skills" },
  },
  {
    id: "windsurf",
    label: "Windsurf",
    // Project skills live in .windsurf/skills; the user-level dir is under the
    // Codeium config tree, not ~/.windsurf. (.windsurf/rules is a separate,
    // older mechanism.) https://docs.windsurf.com/windsurf/cascade/skills
    dirs: { global: "~/.codeium/windsurf/skills", project: ".windsurf/skills" },
  },
];

export function findAgent(id: string): AgentDef | undefined {
  return AGENTS.find((a) => a.id === id);
}
