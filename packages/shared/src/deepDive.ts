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
 * description. Keyed on the node `id` so the agent has no ambiguity about which
 * component to document or which file to rewrite.
 */
export function buildDeepDivePrompt(
  node: Pick<ArchitectureNode, "id" | "label" | "path">,
): string {
  const named = node.label && node.label !== node.id ? ` (${node.label})` : "";
  const read = node.path
    ? `Read its code at \`${node.path}\` and trace`
    : "Read its code and trace";
  return [
    `Use the tecture skill to deep-dive the architecture component \`${node.id}\`${named}.`,
    "",
    `${read} its real inbound and outbound dependencies through the repo, then rewrite \`architecture/descriptions/${node.id}.md\` with a detailed, code-grounded description — responsibilities, key files, dependencies, and tech stack. Prose only; do not change any diagram JSON.`,
  ].join("\n");
}
