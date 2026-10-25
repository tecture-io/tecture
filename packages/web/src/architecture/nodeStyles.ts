import {
  NODE_TYPE_KEYS,
  type GraphAppearance,
  type NodeTypeColors,
  type NodeTypeKey,
} from "@tecture/shared";

/** `fill` / `stroke` paint the path with the node type's accent colour. */
export interface IconPath {
  d: string;
  fill?: true;
  stroke?: true;
  strokeWidth?: number;
  opacity?: number;
}

interface NodeShape {
  label: string;
  iconPaths: IconPath[];
}

export interface NodeStyle extends NodeShape, NodeTypeColors {}

const styles: Record<Exclude<NodeTypeKey, "default">, NodeShape> = {
  system: {
    label: "System",
    iconPaths: [
      { d: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z", fill: true, opacity: 0.1 },
      { d: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z", stroke: true, strokeWidth: 1.5 },
      { d: "M3.27 6.96L12 12.01l8.73-5.05", stroke: true, strokeWidth: 1.5 },
      { d: "M12 22.08V12", stroke: true, strokeWidth: 1.5 },
    ],
  },
  person: {
    label: "Person",
    iconPaths: [
      { d: "M12 12a4 4 0 100-8 4 4 0 000 8z", fill: true, opacity: 0.1 },
      { d: "M12 12a4 4 0 100-8 4 4 0 000 8z", stroke: true, strokeWidth: 1.5 },
      { d: "M4 21a8 8 0 0116 0", stroke: true, strokeWidth: 1.5 },
    ],
  },
  service: {
    label: "Service",
    iconPaths: [
      { d: "M12 15a3 3 0 100-6 3 3 0 000 6z", fill: true, opacity: 0.1 },
      { d: "M12 15a3 3 0 100-6 3 3 0 000 6z", stroke: true, strokeWidth: 1.5 },
      { d: "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z", stroke: true, strokeWidth: 1.5 },
    ],
  },
  database: {
    label: "Database",
    iconPaths: [
      { d: "M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4v10c0 2.21-3.582 4-8 4s-8-1.79-8-4V7z", fill: true, opacity: 0.1 },
      { d: "M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4", stroke: true, strokeWidth: 1.5 },
    ],
  },
  queue: {
    label: "Queue",
    iconPaths: [
      { d: "M4 4h16v5H4zM4 13h16v5H4z", fill: true, opacity: 0.08 },
      { d: "M21 12l-18 0", stroke: true, strokeWidth: 1.5 },
      { d: "M4 4h16v5H4zM4 13h16v5H4z", stroke: true, strokeWidth: 1.5 },
      { d: "M8 8h.01M8 17h.01", stroke: true, strokeWidth: 2.5 },
    ],
  },
  gateway: {
    label: "Gateway",
    iconPaths: [
      { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", fill: true, opacity: 0.1 },
      { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", stroke: true, strokeWidth: 1.5 },
      { d: "M9 12l2 2 4-4", stroke: true, strokeWidth: 2 },
    ],
  },
  frontend: {
    label: "Frontend",
    iconPaths: [
      { d: "M3 5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z", fill: true, opacity: 0.1 },
      { d: "M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", stroke: true, strokeWidth: 1.5 },
      { d: "M3 13h18", stroke: true, strokeWidth: 1.5 },
      { d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3", stroke: true, strokeWidth: 1.5 },
    ],
  },
  cache: {
    label: "Cache",
    iconPaths: [
      { d: "M13 10V3L4 14h7v7l9-11h-7z", fill: true, opacity: 0.1 },
      { d: "M13 10V3L4 14h7v7l9-11h-7z", stroke: true, strokeWidth: 1.5 },
    ],
  },
  storage: {
    label: "Storage",
    iconPaths: [
      { d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z", fill: true, opacity: 0.1 },
      { d: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2h6l2-2h6a2 2 0 012 2v12z", stroke: true, strokeWidth: 1.5 },
    ],
  },
  external: {
    label: "External",
    iconPaths: [
      { d: "M12 21a9 9 0 100-18 9 9 0 000 18z", fill: true, opacity: 0.08 },
      { d: "M12 21a9 9 0 100-18 9 9 0 000 18z", stroke: true, strokeWidth: 1.5 },
      { d: "M3.6 9h16.8M3.6 15h16.8", stroke: true, strokeWidth: 1.5 },
      { d: "M12 3c2.2 2.5 3.5 5.5 3.5 9s-1.3 6.5-3.5 9c-2.2-2.5-3.5-5.5-3.5-9s1.3-6.5 3.5-9z", stroke: true, strokeWidth: 1.5 },
    ],
  },
};

const defaultShape: NodeShape = {
  label: "Component",
  iconPaths: [
    { d: "M20 7l-8-4-8 4v10l8 4 8-4V7z", fill: true, opacity: 0.1 },
    { d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", stroke: true, strokeWidth: 1.5 },
  ],
};

function toNodeTypeKey(type: string | undefined): NodeTypeKey {
  return type && (NODE_TYPE_KEYS as readonly string[]).includes(type)
    ? (type as NodeTypeKey)
    : "default";
}

export function getNodeStyle(
  appearance: GraphAppearance,
  type?: string,
): NodeStyle {
  const key = toNodeTypeKey(type);
  const shape = key === "default" ? defaultShape : styles[key];
  return { ...shape, ...appearance.nodeTypes[key] };
}
