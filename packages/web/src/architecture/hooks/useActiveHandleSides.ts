import { useMemo } from "react";
import { useNodeId, useStore, type ReactFlowState } from "@xyflow/react";
import { getClosestSide } from "../edges/utils";

export function useActiveHandleSides(): Set<string> {
  const nodeId = useNodeId();

  const activeSides = useStore((state: ReactFlowState) => {
    if (!nodeId) return new Set<string>();
    const thisNode = state.nodeLookup.get(nodeId);
    if (!thisNode) return new Set<string>();

    const sides = new Set<string>();
    for (const edge of state.edges) {
      let otherNodeId: string | null = null;
      if (edge.source === nodeId) otherNodeId = edge.target;
      else if (edge.target === nodeId) otherNodeId = edge.source;
      if (!otherNodeId) continue;

      const otherNode = state.nodeLookup.get(otherNodeId);
      if (!otherNode) continue;
      sides.add(getClosestSide(thisNode, otherNode));
    }
    return sides;
  });

  return useMemo(() => activeSides, [activeSides]);
}
