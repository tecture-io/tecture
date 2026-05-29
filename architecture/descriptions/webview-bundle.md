The webview entry point — a thin React shell that mounts the shared `@tecture/web` App inside the VS Code webview and feeds it a postMessage-backed data source. Built separately from the host code (Vite) into `media/webview/`, this is the only place the extension touches the browser/DOM side.

## Responsibilities
- Create a `createPostMessageDataSource()` that implements the same `WebDataSource` interface the browser uses, but sends each call as a `TectureRequest` over `acquireVsCodeApi().postMessage` and resolves it against the matching `TectureResponse` by id.
- Render `<App dataSource={...} showDiagramList={false} />`, hiding the floating diagram picker because the sidebar tree owns navigation in the editor.
- Signal `ready` to the host on mount, reload on `refresh`, navigate on `selectDiagram`, and report `diagramChanged` on hash change — with a dedupe guard so re-asserting the same slug never bounces a message back (no host↔webview loop).

## Tech Stack
- React 18 + Vite 5 + Tailwind 4, bundled to `media/webview/`
- `@tecture/web` App (aliased to source) and `@tecture/shared` message types
- VS Code webview `acquireVsCodeApi()` messaging bridge
