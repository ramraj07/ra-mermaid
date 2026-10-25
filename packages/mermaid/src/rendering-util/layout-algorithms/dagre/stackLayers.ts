import intersectRect from '../../rendering-elements/intersect/intersect-rect.js';
import { exposedSides, type StackSide } from '../../rendering-elements/shapes/stack.js';
import type { StackLayerBox } from '../../types.js';

interface P {
  x: number;
  y: number;
}

interface StackNode {
  x: number;
  y: number;
  width: number;
  height: number;
  stackLayerBoxes?: StackLayerBox[];
  intersect?: (point: P) => P;
  [key: string]: any;
}

interface StackEdge {
  points?: P[];
  startLayer?: string;
  endLayer?: string;
}

/** How far out from a layer the route turns in towards it. */
const APPROACH = 16;

const NORMAL: Record<StackSide, P> = {
  NORTH: { x: 0, y: -1 },
  SOUTH: { x: 0, y: 1 },
  WEST: { x: -1, y: 0 },
  EAST: { x: 1, y: 0 },
};

const inside = (node: StackNode, p: P, tol = 1) =>
  Math.abs(p.x - node.x) <= node.width / 2 + tol && Math.abs(p.y - node.y) <= node.height / 2 + tol;

/** How far `p` lies beyond `side` of the stack's outline; negative when it does not. */
const beyond = (node: StackNode, p: P, side: StackSide) => {
  switch (side) {
    case 'NORTH':
      return node.y - node.height / 2 - p.y;
    case 'SOUTH':
      return p.y - (node.y + node.height / 2);
    case 'WEST':
      return node.x - node.width / 2 - p.x;
    case 'EAST':
      return p.x - (node.x + node.width / 2);
  }
};

/**
 * A laid-out stack narrowed to one of its layers, for clipping an edge's end
 * against that layer rather than against the stack as a whole.
 */
export function stackLayerNode<T extends StackNode>(node: T, layerId: string | undefined): T {
  const box = node?.stackLayerBoxes?.find((b) => b.id === layerId);
  if (!box) {
    return node;
  }
  const layer: T = {
    ...node,
    x: node.x + box.dx,
    y: node.y + box.dy,
    width: box.width,
    height: box.height,
  };
  layer.intersect = (point: P) => intersectRect(layer, point);
  return layer;
}

/**
 * Re-route the last stretch of `points` so it ends on `layerId` of `stack`.
 *
 * dagre lays a stack out as one node and routes the edge to its outline. The
 * route is kept up to where it reaches the stack, then turns in to the layer
 * through a side of the stack the layer reaches: the side the route lies furthest
 * beyond if the layer is on it, else the nearer of the stack's flanks. The route goes
 * round the outside of the stack, never across another layer.
 */
function routeEndToLayer(points: P[], stack: StackNode, layerId: string): P[] {
  const box = stack?.stackLayerBoxes?.find((b) => b.id === layerId);
  if (!box || points.length < 2) {
    return points;
  }
  const route = [...points];
  while (route.length > 1 && inside(stack, route[route.length - 1])) {
    route.pop();
  }
  const from = route[route.length - 1];

  const sides = exposedSides(box, stack.width, stack.height);
  // Of the sides the route already lies clear of, the one it is furthest beyond.
  const clear = (side: StackSide) => beyond(stack, from, side) >= APPROACH;
  const facing = sides
    .filter(clear)
    .sort((a, b) => beyond(stack, from, b) - beyond(stack, from, a))[0];
  const flank = (pair: [StackSide, StackSide], axis: 'x' | 'y') => {
    const [low, high] = pair;
    const options = pair.filter((side) => sides.includes(side));
    if (options.length < 2) {
      return options[0];
    }
    return from[axis] < stack[axis] ? low : high;
  };
  const side = facing ?? flank(['WEST', 'EAST'], 'x') ?? flank(['NORTH', 'SOUTH'], 'y') ?? sides[0];
  if (!side) {
    return points;
  }

  const n = NORMAL[side];
  const layerX = stack.x + box.dx;
  const layerY = stack.y + box.dy;
  // The point on the layer's side, on its centre line.
  const target = {
    x: n.x === 0 ? layerX : layerX + (n.x * box.width) / 2,
    y: n.y === 0 ? layerY : layerY + (n.y * box.height) / 2,
  };
  const approach = { x: target.x + n.x * APPROACH, y: target.y + n.y * APPROACH };
  // Coming from beside the stack rather than beyond this side: go round the
  // corner first, staying clear of the stack.
  const corner = clear(side)
    ? []
    : [n.x === 0 ? { x: from.x, y: approach.y } : { x: approach.x, y: from.y }];
  return [...route, ...corner, approach, target];
}

/**
 * Point an edge's ends at the stack layers it names, for dagre.
 *
 * @returns The nodes to clip the edge's ends against: the named layers, or the
 * nodes themselves when an end names no layer.
 */
export function routeEdgeToStackLayers<T extends StackNode>(
  edge: StackEdge,
  startNode: T,
  endNode: T
): { startNode: T; endNode: T } {
  if (!edge.points) {
    return { startNode, endNode };
  }
  if (edge.endLayer) {
    edge.points = routeEndToLayer(edge.points, endNode, edge.endLayer);
  }
  if (edge.startLayer) {
    edge.points = routeEndToLayer([...edge.points].reverse(), startNode, edge.startLayer).reverse();
  }
  return {
    startNode: stackLayerNode(startNode, edge.startLayer),
    endNode: stackLayerNode(endNode, edge.endLayer),
  };
}
