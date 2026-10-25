# @tecture/web

## Unreleased

- `App` takes an optional `appearance?: GraphAppearance` prop (type from
  `@tecture/shared`) that restyles edge labels, edges, nodes, containers, the
  canvas grid, minimap, controls, legend and per-type colours. Omitting it keeps
  the built-in look. Pass the output of `mergeAppearance()` to apply untrusted
  overrides safely. Requires the matching `@tecture/shared` release, which adds
  these exports.
- The onboarding tour now remembers being closed: a reload (a changed
  `reloadKey`) no longer reopens it, so it shows once per mount instead of on
  every architecture load. Data sources can implement the new optional
  `isOnboardingDismissed()` / `dismissOnboarding()` to add a persistent
  **Don't show again** button (hidden when they're absent), and `App` gains a
  `showOnboardingKey` prop that reopens the tour whenever it changes.
- A reload (a changed `reloadKey`) no longer resets the view. The current
  architecture stays on screen while the new one loads, then swaps in place:
  camera position and zoom, the selected node and its open detail panel are
  kept, and the panel doesn't replay its slide-in. The loading splash now shows
  only on the first load. If the selected node is gone after a reload, its
  panel closes.
- Node drags and resizes are no longer lost or reverted around a reload: a
  save still pending (150 ms debounce) or in flight when a reload lands is kept,
  and leaving a diagram right after a drag no longer drops the save.

## 0.2.0

- Added drift surfacing. When the host provides a drift report (from the
  architecture-docs skill's CodeGraph evidence script), the viewer shows a
  severity-colored **Drift: N** pill that expands into a grouped findings list —
  generation time, stale-index banner, per-finding evidence — and the node detail
  panel gains an **Evidence** section listing the findings that touch that node.
  `WebDataSource` gains an optional `loadDrift()`, implemented by
  `createHttpDataSource` against `GET /api/architecture/drift`. Hosts without
  drift support are unaffected — no report, no UI.

## 0.1.1

- Added a first-run onboarding wizard. On every architecture load the viewer shows a
  short, dismissable tour: an intro with the architecture's name and description, then
  two looping animated demos — clicking a component to open its detail panel, and
  double-clicking a container to drill into its sub-diagram. A floating help (`?`)
  button replays the tour, and the animations respect `prefers-reduced-motion`. No API
  changes — embedders get the wizard automatically.

## 0.1.0

- First public release of the Tecture viewer as a reusable React component library.
  Exports `App` (`@tecture/web/App`), the `WebDataSource` contract +
  `createHttpDataSource(baseUrl?)` (`@tecture/web/architecture/dataSource`), and a
  precompiled stylesheet (`@tecture/web/styles.css`) so consumers need no Tailwind setup.
- `createHttpDataSource` now accepts an optional `baseUrl` prefix, letting the viewer
  talk to a server mounted under any path (e.g. a per-repo endpoint namespace). Defaults
  to `""`, preserving the previous absolute `/api/...` behaviour.
- React and `react-dom` are peer dependencies; the diagram libraries
  (`@xyflow/react`, `elkjs`, `mermaid`, `markdown-to-jsx`) and `@tecture/shared` are
  regular dependencies, externalized from the bundle. Consumers should also import
  `@xyflow/react/dist/style.css` alongside `@tecture/web/styles.css`.
