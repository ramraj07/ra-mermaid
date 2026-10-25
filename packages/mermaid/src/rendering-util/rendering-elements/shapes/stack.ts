import type { D3Selection } from '../../../types.js';
import type { Node, StackLayerBox } from '../../types.js';
import { getNodeClasses } from './util.js';
import { squareRect } from './squareRect.js';
import intersect from '../intersect/index.js';

export type StackSide = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';

const EPS = 0.5;

/** The sides of a layer that lie on the stack's outline, i.e. where an edge can reach it. */
export function exposedSides(box: StackLayerBox, width: number, height: number): StackSide[] {
  const sides: StackSide[] = [];
  if (box.dy - box.height / 2 <= -height / 2 + EPS) {
    sides.push('NORTH');
  }
  if (box.dy + box.height / 2 >= height / 2 - EPS) {
    sides.push('SOUTH');
  }
  if (box.dx - box.width / 2 <= -width / 2 + EPS) {
    sides.push('WEST');
  }
  if (box.dx + box.width / 2 >= width / 2 - EPS) {
    sides.push('EAST');
  }
  return sides;
}

const isHorizontal = (dir: string | undefined) => dir === 'LR' || dir === 'RL';

/**
 * Stacked subgraph shape (flowchart `@{ layout: stack }`).
 *
 * Each member is drawn as an ordinary rectangle node, then the rectangles are
 * pushed together with no gap and stretched to a common width (a vertical
 * stack) or height (a horizontal one), so they share their borders:
 *
 *   ┌──────────────┐
 *   │   Frontend   │
 *   ├──────────────┤
 *   │     API      │
 *   ├──────────────┤
 *   │   Database   │
 *   └──────────────┘
 *
 * The layout sees the whole stack as one node. Where each layer ended up is
 * recorded on `node.stackLayerBoxes`, which the layouts read to attach an
 * edge to the layer it names instead of to the stack as a whole.
 */
export async function stack<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const shapeSvg = parent
    .insert('g')
    .attr('class', getNodeClasses(node, 'stack-node'))
    .attr('id', node.domId ?? node.id);

  const horizontal = isHorizontal(node.dir);
  const layers = (node.stackLayers ?? []).map((layer) => ({
    ...layer,
    look: node.look,
    useHtmlLabels: node.useHtmlLabels,
  }));

  const placed: { layer: Node; el: D3Selection<SVGGElement>; width: number; height: number }[] = [];
  for (const layer of layers) {
    const el = await squareRect(shapeSvg, layer);
    placed.push({ layer, el, width: layer.width ?? 0, height: layer.height ?? 0 });
  }

  // Bring every layer to the same cross-axis size. A plain rect is stretched in
  // place: drawing it again at the new size would also re-wrap its label. A
  // hand-drawn one is a rough path that can only be drawn again.
  const cross = Math.max(0, ...placed.map((p) => (horizontal ? p.height : p.width)));
  for (const p of placed) {
    if ((horizontal ? p.height : p.width) === cross) {
      continue;
    }
    if (node.look === 'handDrawn') {
      p.el.remove();
      const sized = horizontal ? { ...p.layer, height: cross } : { ...p.layer, width: cross };
      p.el = await squareRect(shapeSvg, sized);
      p.layer = sized;
    } else {
      p.el
        .select('rect.label-container')
        .attr(horizontal ? 'y' : 'x', -cross / 2)
        .attr(horizontal ? 'height' : 'width', cross);
    }
    if (horizontal) {
      p.height = cross;
    } else {
      p.width = cross;
    }
  }

  const total = placed.reduce((sum, p) => sum + (horizontal ? p.width : p.height), 0);
  const width = horizontal ? total : cross;
  const height = horizontal ? cross : total;
  const reversed = node.dir === 'BT' || node.dir === 'RL';

  const boxes: StackLayerBox[] = [];
  let cursor = -total / 2;
  for (const p of reversed ? [...placed].reverse() : placed) {
    const length = horizontal ? p.width : p.height;
    const dx = horizontal ? cursor + length / 2 : 0;
    const dy = horizontal ? 0 : cursor + length / 2;
    cursor += length;
    p.el.attr('transform', `translate(${dx}, ${dy})`);
    boxes.push({ id: p.layer.id, dx, dy, width: p.width, height: p.height });
  }

  node.width = width;
  node.height = height;
  node.stackLayerBoxes = boxes;

  node.calcIntersect = function (bounds, point) {
    return intersect.rect(bounds, point);
  };

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
