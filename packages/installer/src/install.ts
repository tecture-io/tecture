import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { AGENTS, findAgent, type AgentDef, type Scope } from "./agents.js";
import { copyDir, hashDir, pathExists, removeDir } from "./fsutil.js";
import {
  MANIFEST_FILE,
  readManifest,
  writeManifest,
  type InstallManifest,
} from "./manifest.js";
import { skillTargetDir } from "./paths.js";
import { confirm, multiSelect, selectScope } from "./prompt.js";
import { loadBundledSkill, type BundledSkill } from "./skill.js";
import { createTelemetry } from "./telemetry.js";

export interface SyncOptions {
  agentIds?: string[];
  scope?: Scope;
  yes: boolean;
  force: boolean;
  cwd: string;
}

/** Compare dotted numeric versions. Returns -1, 0, or 1 (a relative to b). */
function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

interface Target {
  agent: AgentDef;
  scope: Scope;
  dir: string;
}

function resolveAgents(ids: string[] | undefined): AgentDef[] {
  if (!ids || ids.length === 0) return AGENTS;
  const out: AgentDef[] = [];
  for (const id of ids) {
    const agent = findAgent(id);
    if (!agent) {
      throw new Error(
        `Unknown agent "${id}". Known: ${AGENTS.map((a) => a.id).join(", ")}`,
      );
    }
    out.push(agent);
  }
  return out;
}

/** Agents that already have the skill installed somewhere (cwd or global). */
async function detectInstalledAgents(
  cwd: string,
  skillName: string,
): Promise<Set<string>> {
  const found = new Set<string>();
  for (const agent of AGENTS) {
    for (const scope of ["project", "global"] as Scope[]) {
      const dir = skillTargetDir(agent, scope, cwd, skillName);
      if (await pathExists(dir)) found.add(agent.id);
    }
  }
  return found;
}

async function chooseTargets(opts: SyncOptions, skill: BundledSkill): Promise<Target[]> {
  let agents: AgentDef[];
  let scope: Scope;

  if (opts.yes) {
    agents = resolveAgents(opts.agentIds);
    scope = opts.scope ?? "project";
  } else {
    if (opts.agentIds && opts.agentIds.length) {
      agents = resolveAgents(opts.agentIds);
    } else {
      const installed = await detectInstalledAgents(opts.cwd, skill.name);
      const preselected = AGENTS.filter((a) => installed.has(a.id)).map((a) => a.id);
      const picked = await multiSelect(
        "Which agents should get the architecture-docs skill?",
        AGENTS.map((a) => ({ label: a.label, value: a.id })),
        preselected,
      );
      agents = resolveAgents(picked);
    }
    scope = opts.scope ?? (await selectScope());
  }

  if (agents.length === 0) throw new Error("No agents selected.");
  return agents.map((agent) => ({
    agent,
    scope,
    dir: skillTargetDir(agent, scope, opts.cwd, skill.name),
  }));
}

type Action = "install" | "update" | "up-to-date";

interface Plan {
  target: Target;
  action: Action;
  installedVersion: string | null;
  locallyModified: boolean;
}

async function planTarget(
  target: Target,
  skill: BundledSkill,
  force: boolean,
): Promise<Plan> {
  const exists = await pathExists(target.dir);
  if (!exists) {
    return { target, action: "install", installedVersion: null, locallyModified: false };
  }
  const manifest = await readManifest(target.dir);
  const installedVersion = manifest?.version ?? "0.0.0";

  let locallyModified = false;
  if (manifest?.checksum) {
    const current = await hashDir(target.dir, [MANIFEST_FILE]);
    locallyModified = current !== manifest.checksum;
  }

  const cmp = compareVersions(skill.version, installedVersion);
  const action: Action = cmp > 0 || force ? "update" : "up-to-date";
  return { target, action, installedVersion, locallyModified };
}

async function applyInstall(
  plan: Plan,
  skill: BundledSkill,
  checksum: string,
): Promise<void> {
  const { dir, agent, scope } = plan.target;
  await mkdir(dirname(dir), { recursive: true });
  await removeDir(dir);
  await copyDir(skill.payloadDir, dir);
  const manifest: InstallManifest = {
    skill: skill.name,
    version: skill.version,
    agent: agent.id,
    scope,
    checksum,
    installedAt: new Date().toISOString(),
    installer: "@tecture/skill",
  };
  await writeManifest(dir, manifest);
}

export async function runSync(opts: SyncOptions): Promise<void> {
  const skill = await loadBundledSkill();
  const checksum = await hashDir(skill.payloadDir, [MANIFEST_FILE]);
  const targets = await chooseTargets(opts, skill);

  let installed = 0;
  let updated = 0;
  let skipped = 0;
  const actedAgents = new Set<string>();
  let actedScope: Scope | undefined;

  for (const target of targets) {
    const plan = await planTarget(target, skill, opts.force);
    const where = `${target.agent.label} (${target.scope})`;

    if (plan.action === "up-to-date") {
      console.log(`  ✓ ${where} — already on ${skill.version}`);
      skipped++;
      continue;
    }

    if (plan.action === "update" && plan.locallyModified && !opts.force) {
      console.log(`  ! ${where} — installed copy was edited locally.`);
      const ok = opts.yes
        ? false
        : await confirm(`    Overwrite local changes with ${skill.version}?`, false);
      if (!ok) {
        console.log(`    skipped (kept local changes).`);
        skipped++;
        continue;
      }
    }

    await applyInstall(plan, skill, checksum);
    actedAgents.add(target.agent.id);
    actedScope = target.scope;
    if (plan.action === "install") {
      console.log(`  + ${where} — installed ${skill.version}`);
      installed++;
    } else {
      console.log(
        `  ↑ ${where} — updated ${plan.installedVersion} → ${skill.version}`,
      );
      updated++;
    }
  }

  console.log(
    `\nDone: ${installed} installed, ${updated} updated, ${skipped} unchanged.`,
  );

  if (installed > 0 || updated > 0) {
    // Anonymous, opt-out, best-effort. Awaited only so the one-shot CLI flushes
    // before exit; it never throws and is capped by its own timeout.
    await createTelemetry().capture("skill.installed", {
      skillName: skill.name,
      skillVersion: skill.version,
      installed,
      updated,
      scope: actedScope ?? "",
      agents: [...actedAgents].sort().join(","),
    });
  }
}

export async function runCheck(opts: SyncOptions): Promise<void> {
  const skill = await loadBundledSkill();
  const agents = resolveAgents(opts.agentIds);
  const scopes: Scope[] = opts.scope ? [opts.scope] : ["project", "global"];

  console.log(`Bundled architecture-docs version: ${skill.version}\n`);
  let any = false;
  for (const agent of agents) {
    for (const scope of scopes) {
      const dir = skillTargetDir(agent, scope, opts.cwd, skill.name);
      if (!(await pathExists(dir))) continue;
      any = true;
      const manifest = await readManifest(dir);
      const installedVersion = manifest?.version ?? "unknown";
      const cmp =
        installedVersion === "unknown"
          ? -1
          : compareVersions(skill.version, installedVersion);
      const status =
        cmp > 0 ? `update available → ${skill.version}` : "up to date";
      console.log(
        `  ${agent.label} (${scope}): ${installedVersion} — ${status}`,
      );
    }
  }
  if (!any) console.log("  No installations found.");
}

export async function runRemove(opts: SyncOptions): Promise<void> {
  const skill = await loadBundledSkill();
  const agents = resolveAgents(opts.agentIds);
  const scopes: Scope[] = opts.scope ? [opts.scope] : ["project", "global"];

  const present: Target[] = [];
  for (const agent of agents) {
    for (const scope of scopes) {
      const dir = skillTargetDir(agent, scope, opts.cwd, skill.name);
      if (await pathExists(dir)) present.push({ agent, scope, dir });
    }
  }

  if (present.length === 0) {
    console.log("Nothing to remove — no installations found.");
    return;
  }

  console.log("Will remove:");
  for (const t of present) console.log(`  - ${t.agent.label} (${t.scope}): ${t.dir}`);

  if (!opts.yes) {
    const ok = await confirm("\nRemove these?", false);
    if (!ok) {
      console.log("Aborted.");
      return;
    }
  }

  for (const t of present) {
    await removeDir(t.dir);
    console.log(`  ✗ removed ${t.agent.label} (${t.scope})`);
  }
}
