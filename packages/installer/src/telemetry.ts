import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { version as installerVersion } from "../package.json";

// PostHog *project* API key — a public client key, safe to embed. Same project
// as the standalone viewer, VS Code extension, and website, so skill installs
// join the same funnel under one anonymous id. Empty string disables telemetry.
const POSTHOG_KEY = "phc_wTpBpKNGhboxPitLJYLSi8aGGCaYJ7fHbvLAT93edmHp";
const POSTHOG_HOST = "https://us.i.posthog.com";

// The CLI exits as soon as work is done, so a capture has to flush before then.
// Cap how long we will wait so a slow/hung network never stalls the installer.
const FLUSH_TIMEOUT_MS = 2000;

type EventProps = Record<string, string | number | boolean>;

export interface Reporter {
  /**
   * Send an anonymous usage event. Resolves once the request completes or the
   * timeout elapses — never rejects, never throws. No-op when disabled.
   */
  capture(event: string, properties?: EventProps): Promise<void>;
}

const NOOP: Reporter = { async capture() {} };

function disabledByEnv(): boolean {
  const dnt = process.env.DO_NOT_TRACK;
  if (dnt === "1" || dnt === "true") return true;
  const t = process.env.TECTURE_TELEMETRY?.toLowerCase();
  return t === "0" || t === "false" || t === "off" || t === "no";
}

/**
 * Anonymous, opt-out telemetry for the skill installer (`npx @tecture/skill`).
 *
 * - Opt-out: honors `DO_NOT_TRACK=1` and `TECTURE_TELEMETRY=0`. Unlike the
 *   viewer it prints NO notice — installs are one-shot, so a banner would just
 *   be noise on every run.
 * - Anonymous: reuses the random id at `~/.config/tecture/telemetry-id` shared
 *   with the viewer (so a person counts once across surfaces). No machine name,
 *   user, repo, or path data is ever sent — only which agent/scope/version.
 * - Resilient: any network failure (offline, DNS, timeout, firewall) is
 *   swallowed silently so it can never break or slow down an install.
 */
export function createTelemetry(): Reporter {
  if (POSTHOG_KEY.length === 0 || disabledByEnv()) return NOOP;

  let distinctId: string;
  try {
    const dir = join(homedir(), ".config", "tecture");
    const idFile = join(dir, "telemetry-id");
    if (existsSync(idFile)) {
      distinctId = readFileSync(idFile, "utf8").trim() || randomUUID();
    } else {
      distinctId = randomUUID();
      mkdirSync(dir, { recursive: true });
      writeFileSync(idFile, distinctId);
    }
  } catch {
    distinctId = randomUUID(); // ephemeral fallback if the config dir isn't writable
  }

  const superProps: EventProps = {
    installerVersion,
    nodeVersion: process.version,
    platform: process.platform,
  };

  return {
    async capture(event, properties = {}) {
      const body = JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        distinct_id: distinctId,
        properties: { ...superProps, ...properties, $process_person_profile: false },
      });
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FLUSH_TIMEOUT_MS);
      try {
        await fetch(`${POSTHOG_HOST}/capture/`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
          signal: controller.signal,
        });
      } catch {
        // Offline / DNS / timeout / firewall — telemetry must never surface.
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
