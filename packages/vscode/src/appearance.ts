import * as vscode from "vscode";

export const APPEARANCE_SECTION = "tecture.graph";

/**
 * Raw `tecture.graph.*` values (VS Code nests the dotted keys into one object).
 * Untrusted: the webview validates them with mergeAppearance(). Window scope,
 * so multi-root workspaces share one look.
 */
export function readAppearanceOverrides(): unknown {
  return vscode.workspace.getConfiguration("tecture").get("graph") ?? {};
}

/**
 * Inline `<script>` that seeds the first appearance before the bundle runs, so
 * the webview never paints the defaults first. `<` is escaped so a setting
 * value cannot close the script tag.
 */
export function appearanceBootScript(nonce: string, overrides: unknown): string {
  const json = JSON.stringify(overrides ?? {}).replace(/</g, "\\u003c");
  return `<script nonce="${nonce}">window.__TECTURE_APPEARANCE__=${json};</script>`;
}
