import { describe, it, expect } from 'vitest';
import { routeEdgeToStackLayers } from './stackLayers.js';

// A vertical stack of three 100x40 layers centred on (200, 200).
const stack = () => ({
  id: 'S',
  x: 200,
  y: 200,
  width: 100,
  height: 120,
  stackLayerBoxes: [
    { id: 'UI', dx: 0, dy: -40, width: 100, height: 40 },
    { id: 'API', dx: 0, dy: 0, width: 100, height: 40 },
    { id: 'DB', dx: 0, dy: 40, width: 100, height: 40 },
  ],
});
const other = { id: 'X', x: 0, y: 200, width: 40, height: 40 };

describe('routeEdgeToStackLayers', () => {
  it('ends an edge from the left on the left side of its layer', () => {
    const edge = {
      endLayer: 'DB',
      points: [
        { x: 20, y: 200 },
        { x: 100, y: 200 },
        { x: 150, y: 200 },
      ],
    };
    const { endNode } = routeEdgeToStackLayers(edge, other, stack());
    expect(edge.points.slice(-2)).toEqual([
      { x: 134, y: 240 },
      { x: 150, y: 240 },
    ]);
    expect(endNode).toMatchObject({ x: 200, y: 240, width: 100, height: 40 });
  });

  it('goes round the stack to reach a middle layer from above', () => {
    const edge = {
      endLayer: 'API',
      points: [
        { x: 180, y: 60 },
        { x: 180, y: 110 },
        { x: 190, y: 140 },
      ],
    };
    routeEdgeToStackLayers(edge, other, stack());
    // Out to the flank level with the last bend, down beside the stack, then in.
    expect(edge.points.slice(1)).toEqual([
      { x: 180, y: 110 },
      { x: 134, y: 110 },
      { x: 134, y: 200 },
      { x: 150, y: 200 },
    ]);
  });

  it('starts an edge on its layer the same way', () => {
    const edge = {
      startLayer: 'API',
      points: [
        { x: 250, y: 200 },
        { x: 320, y: 200 },
        { x: 380, y: 200 },
      ],
    };
    const { startNode } = routeEdgeToStackLayers(edge, stack(), other);
    expect(edge.points.slice(0, 2)).toEqual([
      { x: 250, y: 200 },
      { x: 266, y: 200 },
    ]);
    expect(startNode).toMatchObject({ x: 200, y: 200, height: 40 });
  });

  it('leaves an edge without layers alone', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    const edge = { points };
    const result = routeEdgeToStackLayers(edge, other, other);
    expect(edge.points).toBe(points);
    expect(result.endNode).toBe(other);
  });
});
