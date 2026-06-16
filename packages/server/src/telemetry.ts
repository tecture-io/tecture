import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { version as coreVersion } from "../package.json";

// PostHog *project* API key — a public client key, safe to embed. Same project
// as the VS Code extension + website, so standalone-viewer usage joins the same
// funnel. Empty string disables telemetry entirely.
const POSTHOG_KEY = "phc_wTpBpKNGhboxPitLJYLSi8aGGCaYJ7fHbvLAT93edmHp";
const POSTHOG_HOST = "https://us.i.posthog.com";

type EventProps = Record<string, string | number | boolean>;

export interface Reporter {
  /** Send an anonymous usage event. No-op when telemetry is disabled. */
  capture(event: string, properties?: EventProps): void;
}

const NOOP: Reporter = { capture() {} };

function disabledByEnv(): boolean {
  const dnt = process.env.DO_NOT_TRACK;
  if (dnt === "1" || dnt === "true") return true;
  const t = process.env.TECTURE_TELEMETRY?.toLowerCase();
  return t === "0" || t === "false" || t === "off" || t === "no";
}

/**
 * Anonymous, opt-out usage telemetry for the standalone viewer (only ever runs
 * for `npx @tecture/core` — the VS Code extension talks to its own host, not
 * this server, so there is no double-counting).
 *
 * - Opt-out: honors `DO_NOT_TRACK=1` and `TECTURE_TELEMETRY=0`, and prints a
 *   one-time notice on first run.
 * - Anonymous: a random id persisted under `~/.config/tecture/telemetry-id`
 *   (so repeat runs count as one user). No machine name, user, or repo data.
 * - NEVER sends architecture content: only the C4 level (1/2/3) and counts.
 */
export function createTelemetry(): Reporter {
  if (POSTHOG_KEY.length === 0 || disabledByEnv()) return NOOP;

  let distinctId: string;
  let firstRun = false;
  try {
    const dir = join(homedir(), ".config", "tecture");
    const idFile = join(dir, "telemetry-id");
    if (existsSync(idFile)) {
      distinctId = readFileSync(idFile, "utf8").trim() || randomUUID();
    } else {
      distinctId = randomUUID();
      mkdirSync(dir, { recursive: true });
      writeFileSync(idFile, distinctId);
      firstRun = true;
    }
  } catch {
    distinctId = randomUUID(); // ephemeral fallback if the config dir isn't writable
  }

  if (firstRun) {
    console.error(
      "\nTecture collects anonymous usage stats (which diagram levels are viewed, how often)\n" +
        "to help improve the tool. It never sends your architecture content, names, or paths.\n" +
        "Opt out any time: set TECTURE_TELEMETRY=0 (or DO_NOT_TRACK=1).\n",
    );
  }

  const superProps: EventProps = {
    coreVersion,
    nodeVersion: process.version,
    platform: process.platform,
  };

  return {
    capture(event, properties = {}) {
      const body = JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        distinct_id: distinctId,
        properties: { ...superProps, ...properties, $process_person_profile: false },
      });
      // Fire-and-forget: never block the server or throw on a dead network.
      void fetch(`${POSTHOG_HOST}/capture/`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      }).catch(() => {});
    },
  };
}
