import { describe, it, expect } from 'vitest';
import {
  attachStackLayerPorts,
  pickStackSide,
  restoreStackPortEndpoints,
  stackLayerNode,
} from './stackPorts.js';
import { exposedSides } from '../../rendering-elements/shapes/stack.js';

// A vertical stack of three 100x40 layers, 100x120 in all.
const boxes = [
  { id: 'UI', dx: 0, dy: -40, width: 100, height: 40 },
  { id: 'API', dx: 0, dy: 0, width: 100, height: 40 },
  { id: 'DB', dx: 0, dy: 40, width: 100, height: 40 },
];
const stackNode = () => ({ id: 'S', width: 100, height: 120, stackLayerBoxes: boxes });

describe('stack layer ports', () => {
  it('knows which sides of each layer lie on the outline', () => {
    expect(exposedSides(boxes[0], 100, 120)).toEqual(['NORTH', 'WEST', 'EAST']);
    expect(exposedSides(boxes[1], 100, 120)).toEqual(['WEST', 'EAST']);
    expect(exposedSides(boxes[2], 100, 120)).toEqual(['SOUTH', 'WEST', 'EAST']);
  });

  it('attaches along the flow where it can, and to the flanks where it cannot', () => {
    // LR: in from the west, out to the east, for every layer of a vertical stack.
    expect(pickStackSide(['WEST', 'EAST'], 'RIGHT', 'in')).toBe('WEST');
    expect(pickStackSide(['WEST', 'EAST'], 'RIGHT', 'out')).toBe('EAST');
    // TB: the top layer takes edges from above, a middle one from the west.
    expect(pickStackSide(['NORTH', 'WEST', 'EAST'], 'DOWN', 'in')).toBe('NORTH');
    expect(pickStackSide(['WEST', 'EAST'], 'DOWN', 'in')).toBe('WEST');
    expect(pickStackSide(['WEST', 'EAST'], 'DOWN', 'out')).toBe('EAST');
    expect(pickStackSide(['SOUTH', 'WEST', 'EAST'], 'DOWN', 'out')).toBe('SOUTH');
  });

  it('points an edge at a port on its layer and maps it back after layout', () => {
    const node = stackNode() as any;
    const edge = { start: 'X', end: 'S', endLayer: 'API', sources: ['X'], targets: ['S'] };
    const owners = attachStackLayerPorts([edge], { S: node }, () => 'RIGHT');

    expect(edge.targets).toEqual(['S::stack::API::WEST']);
    expect(node.ports).toEqual([
      expect.objectContaining({ id: 'S::stack::API::WEST', x: 0, y: 60 }),
    ]);
    expect(node.layoutOptions['elk.portConstraints']).toBe('FIXED_POS');

    restoreStackPortEndpoints([edge], owners);
    expect(edge.targets).toEqual(['S']);
  });

  it('matches the layer by id when ELK was handed the edge reversed', () => {
    const node = stackNode() as any;
    const edge = { start: 'S', end: 'X', startLayer: 'DB', sources: ['X'], targets: ['S'] };
    attachStackLayerPorts([edge], { S: node }, () => 'DOWN');
    // S is ELK's target, so the edge comes in by the bottom layer's free side.
    expect(edge.targets[0]).toMatch(/^S::stack::DB::/);
  });

  it('clips against the named layer alone', () => {
    const layer = stackLayerNode({ ...stackNode(), offset: { posX: 0, posY: 0 } } as any, 'API');
    expect(layer).toMatchObject({ x: 50, y: 60, width: 100, height: 40 });
    expect(layer.intersect!({ x: -50, y: 60 })).toEqual({ x: 0, y: 60 });
  });
});
