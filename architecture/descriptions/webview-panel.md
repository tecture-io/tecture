`TecturePanel` — the host side of the webview, which owns the `WebviewPanel`, loads the bundled SPA into it, and brokers every message between the webview and the extension's data source. It is the transport boundary: the postMessage equivalent of the CLI server's Express layer.

## Responsibilities
- Create or reveal the single architecture panel, point its `localResourceRoots` at `media/webview`, and inject the built `index.html` (rewriting asset URIs to webview URIs).
- Receive `TectureRequest` messages from the webview, dispatch them through the message handler, and post the `TectureResponse` back by request id.
- Push host-originated `TectureEvent`s into the webview — `refresh` (reload after a file change) and `selectDiagram` (open a specific diagram from the tree).
- Relay the webview's `diagramChanged` notification up to the extension so the sidebar tree can follow the active diagram.

## Tech Stack
- TypeScript, VS Code `WebviewPanel` (`enableScripts`, `retainContextWhenHidden`, `asWebviewUri`)
- `@tecture/shared` request/response/event message types
