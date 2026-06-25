# @tecture/web

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
