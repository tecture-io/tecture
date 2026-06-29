PostHog Cloud (`us.i.posthog.com`) — the external analytics service that receives anonymous, opt-out usage telemetry from the three Tecture deployables. Every surface (CLI viewer, VS Code extension, skill installer) reports into the *same* PostHog project under one anonymous id, so usage joins a single funnel. The only network dependency in the whole system; it is non-essential and fully disableable.

## Responsibilities
- Ingest fire-and-forget usage events sent with the embedded public project key (`phc_wTpB…`) — never any architecture content, only coarse signals like C4 level and node/edge counts.
- Each emitter honours `DO_NOT_TRACK=1` and `TECTURE_TELEMETRY=0/off`, persists a random id under `~/.config/tecture/` so repeat runs count as one user, and degrades to a silent no-op when disabled or offline.

## Tech Stack
- PostHog Cloud (US region) over HTTPS
- Reached directly from `telemetry.ts` in `@tecture/core`, `tecture-vscode`, and `@tecture/skill` (no shared client — each deployable posts independently)
