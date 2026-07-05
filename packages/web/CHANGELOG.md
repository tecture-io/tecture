# @tecture/web

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
