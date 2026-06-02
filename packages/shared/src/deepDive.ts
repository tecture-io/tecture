import type { ArchitectureNode, NodeMetaType } from "./index";

/** Node types that map to first-party code worth a deep-dive. */
const CODE_NODE_TYPES: ReadonlySet<NodeMetaType> = new Set([
  "service",
  "frontend",
  "gateway",
]);

/**
 * Whether a node is worth deep-diving — i.e. first-party code the team owns.
 * True when the node carries a repo `path`, or its type is a code container
 * (service / frontend / gateway). People, external SaaS, and managed infra
 * (database / cache / queue / storage) have nothing in the repo to investigate.
 */
export function isDeepDivable(
  node: Pick<ArchitectureNode, "path" | "meta">,
): boolean {
  if (node.path) return true;
  const type = node.meta?.type;
  return type !== undefined && CODE_NODE_TYPES.has(type);
}

/**
 * Build the prompt a user copies into a coding agent to enrich one component's
 * description. It invokes the skill's deep-dive via its slash command, keyed on
 * the node `id` (unambiguous) — it deliberately does not restate how to deep-dive,
 * since the architecture-docs skill already owns that (which files to read,
 * dependencies to trace, the target description file, prose-only, etc.).
 */
export function buildDeepDivePrompt(
  node: Pick<ArchitectureNode, "id">,
): string {
  return `/architecture-docs deep-dive ${node.id}`;
}
