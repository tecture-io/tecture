import * as vscode from "vscode";
import {
  DescriptionNotFoundError,
  DiagramNotFoundError,
  emptyLayout,
  normalizeLayoutUpdate,
  SLUG_RE,
  type ArchitectureDataSource,
  type LayoutStore,
  type ApiDiagramLayoutUpdate,
  type DiagramFile,
  type DiagramLayoutFile,
  type ManifestFile,
} from "@tecture/shared";

const textDecoder = new TextDecoder("utf-8");
const textEncoder = new TextEncoder();

function isFileNotFound(err: unknown): boolean {
  if (err instanceof vscode.FileSystemError) {
    return err.code === "FileNotFound" || err.code === "EntryNotFound";
  }
  return false;
}

async function readJson<T>(uri: vscode.Uri): Promise<T> {
  const bytes = await vscode.workspace.fs.readFile(uri);
  return JSON.parse(textDecoder.decode(bytes)) as T;
}

async function writeJson(uri: vscode.Uri, value: unknown): Promise<void> {
  const json = JSON.stringify(value, null, 2) + "\n";
  await vscode.workspace.fs.writeFile(uri, textEncoder.encode(json));
}

export class VscodeFsArchitectureDataSource
  implements ArchitectureDataSource
{
  constructor(private readonly architectureRoot: vscode.Uri) {}

  async loadManifest(): Promise<ManifestFile> {
    const uri = vscode.Uri.joinPath(this.architectureRoot, "manifest.json");
    try {
      return await readJson<ManifestFile>(uri);
    } catch (err) {
      if (isFileNotFound(err)) {
        throw new Error(
          `architecture/manifest.json not found at ${uri.fsPath}`,
        );
      }
      throw err;
    }
  }

  async loadDiagram(slug: string): Promise<DiagramFile> {
    if (!SLUG_RE.test(slug)) throw new DiagramNotFoundError(slug);
    const uri = vscode.Uri.joinPath(
      this.architectureRoot,
      "diagrams",
      `${slug}.json`,
    );
    try {
      return await readJson<DiagramFile>(uri);
    } catch (err) {
      if (isFileNotFound(err)) throw new DiagramNotFoundError(slug);
      throw err;
    }
  }

  async loadDescription(nodeId: string): Promise<string> {
    if (!SLUG_RE.test(nodeId)) throw new DescriptionNotFoundError(nodeId);
    const uri = vscode.Uri.joinPath(
      this.architectureRoot,
      "descriptions",
      `${nodeId}.md`,
    );
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      return textDecoder.decode(bytes);
    } catch (err) {
      if (isFileNotFound(err)) throw new DescriptionNotFoundError(nodeId);
      throw err;
    }
  }
}

export class VscodeFsLayoutStore implements LayoutStore {
  constructor(private readonly layoutsRoot: vscode.Uri) {}

  async loadLayout(slug: string): Promise<DiagramLayoutFile> {
    if (!SLUG_RE.test(slug)) return emptyLayout(slug);
    const uri = vscode.Uri.joinPath(this.layoutsRoot, `${slug}.json`);
    try {
      return await readJson<DiagramLayoutFile>(uri);
    } catch (err) {
      if (isFileNotFound(err)) return emptyLayout(slug);
      throw err;
    }
  }

  async saveLayout(
    slug: string,
    update: ApiDiagramLayoutUpdate,
  ): Promise<DiagramLayoutFile> {
    const normalized = normalizeLayoutUpdate(slug, update);
    await vscode.workspace.fs.createDirectory(this.layoutsRoot);
    const target = vscode.Uri.joinPath(this.layoutsRoot, `${slug}.json`);
    const tmp = vscode.Uri.joinPath(this.layoutsRoot, `${slug}.json.tmp`);
    await writeJson(tmp, normalized);
    try {
      await vscode.workspace.fs.rename(tmp, target, { overwrite: true });
    } catch (err) {
      try {
        await vscode.workspace.fs.delete(tmp);
      } catch {
        // ignore cleanup failure
      }
      throw err;
    }
    return normalized;
  }
}

export function resolveArchitectureRoot(
  workspaceFolder: vscode.WorkspaceFolder,
): vscode.Uri {
  return vscode.Uri.joinPath(workspaceFolder.uri, "architecture");
}

export function resolveLayoutsRoot(
  workspaceFolder: vscode.WorkspaceFolder,
): vscode.Uri {
  return vscode.Uri.joinPath(workspaceFolder.uri, "architecture", ".tecture", "layouts");
}
