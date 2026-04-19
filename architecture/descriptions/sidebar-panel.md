The left-edge `DiagramList` plus the thin breadcrumb-style `TopBar` — together they form the navigation chrome around the canvas. Kept as one architecture component because both consume the same `ApiArchitectureSummary` and both mutate the same piece of state: the current diagram id in the URL hash.

## Responsibilities
- **DiagramList** — render every diagram from the summary, grouped by C4 `level`, with the active one highlighted. Clicking one pushes a new hash (`#/diagram/<slug>`).
- **TopBar** — show the architecture name, the currently-open diagram's name, and a link back to the top diagram.
- **KeyboardHint** — rendered beside the sidebar; surfaces the discoverable shortcuts (click to select, double-click to drill in, escape to close the detail panel).

## Tech Stack
- `react` function components, styled with `tailwindcss` v4.
- No local state — everything is derived from the summary + the route.
