import { Position, type InternalNode } from "@xyflow/react";

type NodeLike = Pick<InternalNode, "internals" | "measured">;

function getNodeCenter(node: NodeLike) {
  return {
    x: node.internals.positionAbsolute.x + (node.measured?.width ?? 0) / 2,
    y: node.internals.positionAbsolute.y + (node.measured?.height ?? 0) / 2,
  };
}

export function getClosestSide(nodeA: NodeLike, nodeB: NodeLike): Position {
  const centerA = getNodeCenter(nodeA);
  const centerB = getNodeCenter(nodeB);

  const horizontalDiff = Math.abs(centerA.x - centerB.x);
  const verticalDiff = Math.abs(centerA.y - centerB.y);

  if (horizontalDiff > verticalDiff) {
    return centerA.x > centerB.x ? Position.Left : Position.Right;
  }
  return centerA.y > centerB.y ? Position.Top : Position.Bottom;
}

function getParams(
  nodeA: NodeLike,
  nodeB: NodeLike,
  handleType: "source" | "target",
): [number, number, Position] {
  const centerA = getNodeCenter(nodeA);
  const centerB = getNodeCenter(nodeB);

  const horizontalDiff = Math.abs(centerA.x - centerB.x);
  const verticalDiff = Math.abs(centerA.y - centerB.y);

  let position: Position;
  if (horizontalDiff > verticalDiff) {
    position = centerA.x > centerB.x ? Position.Left : Position.Right;
  } else {
    position = centerA.y > centerB.y ? Position.Top : Position.Bottom;
  }

  const [x, y] = getHandleCoordsByPosition(nodeA, position, handleType);
  return [x, y, position];
}

function getHandleCoordsByPosition(
  node: NodeLike,
  handlePosition: Position,
  handleType: "source" | "target",
): [number, number] {
  const bounds = node.internals.handleBounds?.[handleType];
  const handle = bounds?.find((h) => h.position === handlePosition);

  if (!handle) {
    return [
      node.internals.positionAbsolute.x + (node.measured?.width ?? 0) / 2,
      node.internals.positionAbsolute.y + (node.measured?.height ?? 0) / 2,
    ];
  }

  let offsetX = handle.width / 2;
  let offsetY = handle.height / 2;

  switch (handlePosition) {
    case Position.Left:
      offsetX = 0;
      break;
    case Position.Right:
      offsetX = handle.width;
      break;
    case Position.Top:
      offsetY = 0;
      break;
    case Position.Bottom:
      offsetY = handle.height;
      break;
  }

  const x = node.internals.positionAbsolute.x + handle.x + offsetX;
  const y = node.internals.positionAbsolute.y + handle.y + offsetY;
  return [x, y];
}

export function getEdgeParams(source: NodeLike, target: NodeLike) {
  const [sx, sy, sourcePos] = getParams(source, target, "source");
  const [tx, ty, targetPos] = getParams(target, source, "target");
  return { sx, sy, tx, ty, sourcePos, targetPos };
}
