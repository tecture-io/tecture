import * as vscode from "vscode";
import { handleRequest, type MessageDeps } from "./messaging";
import type {
  TectureEvent,
  TectureNotification,
  TectureRequest,
} from "@tecture/shared";

const textDecoder = new TextDecoder("utf-8");

export class TecturePanel {
  static current: TecturePanel | undefined;
  private static readonly viewType = "tecture.architecture";

  private onDiagramChanged?: (slug: string) => void;

  static async createOrShow(
    extensionUri: vscode.Uri,
    deps: MessageDeps,
    onDiagramChanged?: (slug: string) => void,
  ): Promise<TecturePanel> {
    const column =
      vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

    if (TecturePanel.current) {
      TecturePanel.current.onDiagramChanged = onDiagramChanged;
      TecturePanel.current.panel.reveal(column);
      return TecturePanel.current;
    }

    const webviewRoot = vscode.Uri.joinPath(extensionUri, "media", "webview");
    const panel = vscode.window.createWebviewPanel(
      TecturePanel.viewType,
      "Tecture Architecture",
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [webviewRoot],
      },
    );

    const instance = new TecturePanel(panel, extensionUri, deps, onDiagramChanged);
    await instance.init();
    TecturePanel.current = instance;
    return instance;
  }

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    private readonly extensionUri: vscode.Uri,
    private deps: MessageDeps,
    onDiagramChanged?: (slug: string) => void,
  ) {
    this.onDiagramChanged = onDiagramChanged;
    this.panel.onDidDispose(() => this.dispose(), null);
    this.panel.webview.onDidReceiveMessage(async (raw) => {
      const notification = asNotification(raw);
      if (notification) {
        if (notification.type === "diagramChanged") {
          this.onDiagramChanged?.(notification.slug);
        }
        return;
      }
      if (!isRequest(raw)) return;
      const response = await handleRequest(raw, this.deps);
      this.panel.webview.postMessage(response);
    });
  }

  private async init(): Promise<void> {
    this.panel.webview.html = await this.composeHtml();
  }

  setDeps(deps: MessageDeps): void {
    this.deps = deps;
  }

  postEvent(event: TectureEvent): void {
    void this.panel.webview.postMessage(event);
  }

  dispose(): void {
    TecturePanel.current = undefined;
    this.panel.dispose();
  }

  private async composeHtml(): Promise<string> {
    const webviewRoot = vscode.Uri.joinPath(
      this.extensionUri,
      "media",
      "webview",
    );
    const htmlUri = vscode.Uri.joinPath(webviewRoot, "index.html");
    const raw = textDecoder.decode(
      await vscode.workspace.fs.readFile(htmlUri),
    );

    const webview = this.panel.webview;
    const nonce = makeNonce();

    const csp = [
      "default-src 'none'",
      `script-src 'nonce-${nonce}' ${webview.cspSource}`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `font-src ${webview.cspSource} data:`,
      `img-src ${webview.cspSource} data: blob:`,
      "connect-src 'none'",
    ].join("; ");

    let html = raw;

    // Rewrite Vite's relative asset URLs (./assets/...) to webview URIs.
    html = html.replace(
      /(href|src)="\.\/([^"]+)"/g,
      (_match, attr: string, path: string) => {
        const uri = webview.asWebviewUri(
          vscode.Uri.joinPath(webviewRoot, path),
        );
        return `${attr}="${uri.toString()}"`;
      },
    );

    // Add nonce to every script tag Vite emitted.
    html = html.replace(/<script\b/g, `<script nonce="${nonce}"`);

    // Inject CSP meta into <head>.
    html = html.replace(
      /<head>/,
      `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}">`,
    );

    return html;
  }
}

function isRequest(value: unknown): value is TectureRequest {
  return (
    !!value &&
    typeof value === "object" &&
    "type" in value &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "string"
  );
}

function asNotification(value: unknown): TectureNotification | undefined {
  if (!value || typeof value !== "object" || "id" in value) return undefined;
  const type = (value as { type?: unknown }).type;
  if (type === "ready") return { type: "ready" };
  if (type === "diagramChanged") {
    const slug = (value as { slug?: unknown }).slug;
    if (typeof slug === "string") return { type: "diagramChanged", slug };
  }
  return undefined;
}

function makeNonce(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 32; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}
