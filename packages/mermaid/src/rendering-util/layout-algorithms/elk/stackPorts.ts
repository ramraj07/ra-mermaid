import intersectRect from '../../rendering-elements/intersect/intersect-rect.js';
import type { StackLayerBox } from '../../types.js';
import { exposedSides, type StackSide as ElkSide } from '../../rendering-elements/shapes/stack.js';

type ElkDirection = 'RIGHT' | 'LEFT' | 'DOWN' | 'UP';

interface StackNode {
  id: string;
  width?: number;
  height?: number;
  parentId?: string;
  stackLayerBoxes?: StackLayerBox[];
  ports?: { id: string; x: number; y: number; width: number; height: number; layoutOptions: any }[];
  layoutOptions?: Record<string, unknown>;
  offset?: { posX: number; posY: number };
  intersect?: (point: { x: number; y: number }) => { x: number; y: number } | null;
  [key: string]: any;
}

interface StackEdge {
  start?: string;
  end?: string;
  startLayer?: string;
  endLayer?: string;
  sources: string[];
  targets: string[];
}

const FORWARD: Record<ElkDirection, ElkSide> = {
  DOWN: 'SOUTH',
  UP: 'NORTH',
  RIGHT: 'EAST',
  LEFT: 'WEST',
};

const OPPOSITE: Record<ElkSide, ElkSide> = {
  NORTH: 'SOUTH',
  SOUTH: 'NORTH',
  EAST: 'WEST',
  WEST: 'EAST',
};

/**
 * The side an edge attaches to a layer by. An edge leaves by the side the flow
 * runs out of, and arrives by the side it runs in from, when the layer is on
 * that side of the stack. A layer in the middle of a stack that runs along the
 * flow has neither, so the edge comes in from the left (or top) and leaves to
 * the right (or bottom), which keeps incoming and outgoing edges apart.
 */
export function pickStackSide(
  sides: ElkSide[],
  flow: ElkDirection,
  role: 'out' | 'in'
): ElkSide | undefined {
  const forward = FORWARD[flow];
  const preferred = role === 'out' ? forward : OPPOSITE[forward];
  if (sides.includes(preferred)) {
    return preferred;
  }
  const vertical = flow === 'DOWN' || flow === 'UP';
  const lateral: ElkSide = vertical
    ? role === 'out'
      ? 'EAST'
      : 'WEST'
    : role === 'out'
      ? 'SOUTH'
      : 'NORTH';
  if (sides.includes(lateral)) {
    return lateral;
  }
  return sides.find((side) => side !== OPPOSITE[preferred]) ?? sides[0];
}

function portPosition(box: StackLayerBox, side: ElkSide, width: number, height: number) {
  const cx = width / 2 + box.dx;
  const cy = height / 2 + box.dy;
  switch (side) {
    case 'WEST':
      return { x: 0, y: cy };
    case 'EAST':
      return { x: width, y: cy };
    case 'NORTH':
      return { x: cx, y: 0 };
    case 'SOUTH':
      return { x: cx, y: height };
  }
}

/**
 * Point every ELK edge that names a stack layer at a port on that layer.
 *
 * The stack is a single ELK node, so without this ELK would attach the edge
 * anywhere on its outline. A port pinned at the layer's centre line, on a side
 * of the stack the layer reaches, makes ELK route the edge to that layer.
 * Runs last while building the graph, so everything before it sees plain node
 * ids; `restoreStackPortEndpoints` maps the ports back once ELK is done.
 *
 * @returns Each port id, mapped to the stack node that owns it.
 */
export function attachStackLayerPorts(
  edges: StackEdge[],
  nodeDb: Record<string, StackNode>,
  flowOf: (node: StackNode) => ElkDirection
): Map<string, string> {
  const owners = new Map<string, string>();
  for (const edge of edges) {
    for (const end of ['sources', 'targets'] as const) {
      const id = edge[end]?.[0];
      const node = id === undefined ? undefined : nodeDb[id];
      if (!node?.stackLayerBoxes) {
        continue;
      }
      // Ends may have been swapped for a reversed edge, so match on the id.
      const layerId =
        id === edge.start ? edge.startLayer : id === edge.end ? edge.endLayer : undefined;
      const box = node.stackLayerBoxes.find((b) => b.id === layerId);
      if (!box) {
        continue;
      }
      const width = node.width ?? 0;
      const height = node.height ?? 0;
      const side = pickStackSide(
        exposedSides(box, width, height),
        flowOf(node),
        end === 'sources' ? 'out' : 'in'
      );
      if (!side) {
        continue;
      }
      const portId = `${node.id}::stack::${box.id}::${side}`;
      if (!owners.has(portId)) {
        owners.set(portId, node.id);
        node.ports ??= [];
        node.ports.push({
          id: portId,
          ...portPosition(box, side, width, height),
          width: 0,
          height: 0,
          layoutOptions: { 'elk.port.side': side },
        });
        node.layoutOptions = { ...node.layoutOptions, 'elk.portConstraints': 'FIXED_POS' };
      }
      edge[end] = [portId];
    }
  }
  return owners;
}

/** Put the stack node ids back on edges that ELK routed to a stack layer port. */
export function restoreStackPortEndpoints(
  edges: StackEdge[] | undefined,
  owners: Map<string, string>
): void {
  if (!owners.size) {
    return;
  }
  for (const edge of edges ?? []) {
    edge.sources = edge.sources?.map((id) => owners.get(id) ?? id);
    edge.targets = edge.targets?.map((id) => owners.get(id) ?? id);
  }
}

/**
 * A laid-out stack narrowed to one of its layers, so an edge's end is clipped
 * against that layer rather than against the stack as a whole.
 */
export function stackLayerNode<T extends StackNode>(node: T, layerId: string | undefined): T {
  const box = node.stackLayerBoxes?.find((b) => b.id === layerId);
  if (!box || !node.offset) {
    return node;
  }
  const x = node.offset.posX + (node.width ?? 0) / 2 + box.dx;
  const y = node.offset.posY + (node.height ?? 0) / 2 + box.dy;
  const layer: T = {
    ...node,
    x,
    y,
    width: box.width,
    height: box.height,
    offset: { ...node.offset, posX: x - box.width / 2, posY: y - box.height / 2 },
  };
  layer.intersect = (point: { x: number; y: number }) => intersectRect(layer, point);
  return layer;
}
