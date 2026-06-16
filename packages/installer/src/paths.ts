import { homedir } from "node:os";
import { isAbsolute, resolve } from "node:path";
import type { AgentDef, Scope } from "./agents.js";

/** Expand a leading `~` to the user's home directory. */
export function expandHome(p: string): string {
  if (p === "~") return homedir();
  if (p.startsWith("~/")) return resolve(homedir(), p.slice(2));
  return p;
}

/** Absolute directory that holds skills for an agent at a given scope. */
export function skillsDir(agent: AgentDef, scope: Scope, cwd: string): string {
  const raw = agent.dirs[scope];
  if (scope === "global") return expandHome(raw);
  return isAbsolute(raw) ? raw : resolve(cwd, raw);
}

/** Absolute directory the skill itself is installed into. */
export function skillTargetDir(
  agent: AgentDef,
  scope: Scope,
  cwd: string,
  skillName: string,
): string {
  return resolve(skillsDir(agent, scope, cwd), skillName);
}
