import * as vscode from "vscode";
import {
  VscodeFsArchitectureDataSource,
  VscodeFsLayoutStore,
  getArchitecturePath,
  resolveArchitectureRoot,
  resolveLayoutsRoot,
} from "./dataSource";
import { TecturePanel } from "./panel";
import { TectureTreeDataProvider } from "./treeView";
import { createTelemetry, type Reporter } from "./telemetry";
import type { MessageDeps } from "./messaging";

let activeDeps: MessageDeps | undefined;
let telemetry: Reporter | undefined;

// Open a repo-root-relative file (or reveal a directory) inside the workspace, rejecting any path
// that is absolute or escapes the workspace folder.
async function openFileInWorkspace(
  folder: vscode.WorkspaceFolder,
  relPath: string,
): Promise<void> {
  const trimmed = relPath.replace(/\/+$/, "");
  const segments = trimmed.split("/").filter((s) => s.length > 0);
  if (
    trimmed.length === 0 ||
    relPath.startsWith("/") ||
    /^[a-zA-Z]:/.test(trimmed) ||
    segments.includes("..")
  ) {
    void vscode.window.showErrorMessage(
      `Tecture: refusing to open unsafe path "${relPath}"`,
    );
    return;
  }

  const target = vscode.Uri.joinPath(folder.uri, ...segments);
  const root = folder.uri.path.replace(/\/+$/, "");
  if (target.path !== root && !target.path.startsWith(`${root}/`)) {
    void vscode.window.showErrorMessage(
      `Tecture: path "${relPath}" escapes the workspace`,
    );
    return;
  }

  try {
    const stat = await vscode.workspace.fs.stat(target);
    if (stat.type & vscode.FileType.Directory) {
      await vscode.commands.executeCommand("revealInExplorer", target);
    } else {
      const doc = await vscode.workspace.openTextDocument(target);
      await vscode.window.showTextDocument(doc, { preview: false });
    }
  } catch {
    void vscode.window.showErrorMessage(`Tecture: could not open "${relPath}"`);
  }
}

function buildDeps(folder: vscode.WorkspaceFolder): MessageDeps {
  return {
    source: new VscodeFsArchitectureDataSource(resolveArchitectureRoot(folder)),
    layouts: new VscodeFsLayoutStore(resolveLayoutsRoot(folder)),
    openFile: (path) => openFileInWorkspace(folder, path),
  };
}

function getWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
  const folders = vscode.workspace.workspaceFolders;
  return folders && folders.length > 0 ? folders[0] : undefined;
}

export function activate(context: vscode.ExtensionContext): void {
  telemetry = createTelemetry();
  context.subscriptions.push({ dispose: () => telemetry?.dispose() });
  telemetry.capture("extension.activated");

  const folder = getWorkspaceFolder();
  if (!folder) {
    void vscode.window.showWarningMessage(
      "Tecture: open a workspace folder to view architecture diagrams.",
    );
    return;
  }

  activeDeps = buildDeps(folder);

  const treeProvider = new TectureTreeDataProvider(activeDeps.source);
  const treeView = vscode.window.createTreeView("tectureDiagrams", {
    treeDataProvider: treeProvider,
  });
  context.subscriptions.push(treeView);

  const fireRefresh = () => {
    treeProvider.refresh();
    TecturePanel.current?.postEvent({ type: "refresh" });
  };

  // Follow the active diagram in the sidebar tree. Only sync when the view is
  // already visible (never force it open), and no-op when the slug is already
  // selected — together with the webview-side dedupe this prevents any loop.
  const revealDiagram = async (slug: string) => {
    if (!treeView.visible) return;
    if (treeView.selection[0]?.id === slug) return;
    await treeProvider.ensureLoaded();
    const item = treeProvider.getItem(slug);
    if (item) await treeView.reveal(item, { select: true, focus: false });
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "tecture.open",
      async (slug?: unknown) => {
        if (!activeDeps) return;
        telemetry?.capture("architecture.opened");
        const panel = await TecturePanel.createOrShow(
          context.extensionUri,
          activeDeps,
          (changedSlug) => void revealDiagram(changedSlug),
          telemetry,
        );
        if (typeof slug === "string" && slug.length > 0) {
          panel.postEvent({ type: "selectDiagram", slug });
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("tecture.refresh", fireRefresh),
  );

  // File watchers track the configured architecture folder plus its layout
  // store (architecture/.tecture); rebuilt whenever the configured path changes.
  let watchers: vscode.Disposable[] = [];
  const disposeWatchers = () => {
    for (const w of watchers) w.dispose();
    watchers = [];
  };
  const createWatchers = (target: vscode.WorkspaceFolder) => {
    const archPath = getArchitecturePath(target);
    const layoutsRoot = resolveLayoutsRoot(target);

    const isLayoutFile = (uri: vscode.Uri) =>
      uri.path.startsWith(`${layoutsRoot.path}/`) && uri.path.endsWith(".json");

    const onFsEvent = (uri: vscode.Uri) => {
      // Layout files are written only by the webview's own drag-persistence and
      // are already reflected in its in-memory state. Reacting to them would
      // round-trip our own write back as a destructive full reload (flicker +
      // viewport reset). Architecture doc edits (manifest/diagrams/descriptions)
      // live outside the layouts root and still refresh the UI normally.
      if (isLayoutFile(uri)) return;
      fireRefresh();
    };

    for (const glob of [`${archPath}/**`, `${archPath}/.tecture/**`]) {
      const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(target, glob),
      );
      watcher.onDidChange(onFsEvent);
      watcher.onDidCreate(onFsEvent);
      watcher.onDidDelete(onFsEvent);
      watchers.push(watcher);
    }
  };
  createWatchers(folder);
  context.subscriptions.push({ dispose: disposeWatchers });

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration("tecture.architecturePath")) return;
      const target = getWorkspaceFolder();
      if (!target) return;
      activeDeps = buildDeps(target);
      treeProvider.setSource(activeDeps.source);
      TecturePanel.current?.setDeps(activeDeps);
      disposeWatchers();
      createWatchers(target);
      fireRefresh();
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      const next = getWorkspaceFolder();
      if (!next) {
        activeDeps = undefined;
        disposeWatchers();
        return;
      }
      activeDeps = buildDeps(next);
      treeProvider.setSource(activeDeps.source);
      TecturePanel.current?.setDeps(activeDeps);
      disposeWatchers();
      createWatchers(next);
      fireRefresh();
    }),
  );
}

export function deactivate(): void {
  TecturePanel.current?.dispose();
  telemetry?.dispose();
  telemetry = undefined;
  activeDeps = undefined;
}
