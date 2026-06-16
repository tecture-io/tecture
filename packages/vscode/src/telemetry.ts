import * as vscode from "vscode";

// PostHog *project* API key — a public client key, safe to embed (same trust
// model as the web/mobile SDKs). Empty string = telemetry disabled (default),
// so the extension never phones home until a key is configured here.
const POSTHOG_KEY = "phc_wTpBpKNGhboxPitLJYLSi8aGGCaYJ7fHbvLAT93edmHp";
const POSTHOG_HOST = "https://us.i.posthog.com";

type EventProps = Record<string, string | number | boolean>;

export interface Reporter {
  /** Send an anonymous usage event. No-op when telemetry is disabled. */
  capture(event: string, properties?: EventProps): void;
  dispose(): void;
}

/**
 * Anonymous, opt-out usage telemetry for the extension host.
 *
 * - Respects VS Code's global `telemetry.telemetryLevel` via
 *   `vscode.env.isTelemetryEnabled` (and reacts to changes live) — no custom
 *   consent prompt, users control it with a setting they already own.
 * - Identifies by `vscode.env.machineId` (anonymous, stable per machine).
 * - NEVER sends repo content: only the C4 level (1/2/3) and counts. No diagram
 *   slugs, node names, file paths, or workspace identifiers.
 */
export function createTelemetry(): Reporter {
  const distinctId = vscode.env.machineId;
  const configured = POSTHOG_KEY.length > 0;
  let enabled = configured && vscode.env.isTelemetryEnabled;

  const sub = vscode.env.onDidChangeTelemetryEnabled((on) => {
    enabled = configured && on;
  });

  const ext = vscode.extensions.getExtension("Tecture.tecture-vscode");
  const superProps: EventProps = {
    extensionVersion: (ext?.packageJSON?.version as string) ?? "unknown",
    vscodeVersion: vscode.version,
    host: vscode.env.appName, // "Visual Studio Code" / "Cursor" / "Windsurf" — non-identifying
    platform: process.platform,
  };

  return {
    capture(event, properties = {}) {
      if (!enabled) return;
      const body = JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        distinct_id: distinctId,
        properties: {
          ...superProps,
          ...properties,
          // Keep events anonymous — don't build a person profile from these.
          $process_person_profile: false,
        },
      });
      // Fire-and-forget: must never block the UI or throw on a dead network.
      void fetch(`${POSTHOG_HOST}/capture/`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      }).catch(() => {});
    },
    dispose() {
      sub.dispose();
    },
  };
}
