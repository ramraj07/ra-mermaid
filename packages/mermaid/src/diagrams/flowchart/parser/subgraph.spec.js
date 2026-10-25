import { FlowDB } from '../flowDb.js';
import flow from './flowParser.ts';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('when parsing subgraphs', function () {
  beforeEach(function () {
    flow.parser.yy = new FlowDB();
    flow.parser.yy.clear();
    flow.parser.yy.setGen('gen-2');
  });
  it('should handle subgraph with tab indentation', function () {
    const res = flow.parser.parse('graph TB\nsubgraph One\n\ta1-->a2\nend');
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.nodes.length).toBe(2);
    expect(subgraph.nodes[0]).toBe('a2');
    expect(subgraph.nodes[1]).toBe('a1');
    expect(subgraph.title).toBe('One');
    expect(subgraph.id).toBe('One');
  });
  it('should handle subgraph with chaining nodes indentation', function () {
    const res = flow.parser.parse('graph TB\nsubgraph One\n\ta1-->a2-->a3\nend');
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(3);
    expect(subgraph.nodes[0]).toBe('a3');
    expect(subgraph.nodes[1]).toBe('a2');
    expect(subgraph.nodes[2]).toBe('a1');
    expect(subgraph.title).toBe('One');
    expect(subgraph.id).toBe('One');
  });

  it('should handle subgraph with multiple words in title', function () {
    const res = flow.parser.parse('graph TB\nsubgraph "Some Title"\n\ta1-->a2\nend');
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(2);
    expect(subgraph.nodes[0]).toBe('a2');
    expect(subgraph.nodes[1]).toBe('a1');
    expect(subgraph.title).toBe('Some Title');
    expect(subgraph.id).toBe('subGraph0');
  });

  it('should handle subgraph with id and title notation', function () {
    const res = flow.parser.parse('graph TB\nsubgraph some-id[Some Title]\n\ta1-->a2\nend');
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(2);
    expect(subgraph.nodes[0]).toBe('a2');
    expect(subgraph.nodes[1]).toBe('a1');
    expect(subgraph.title).toBe('Some Title');
    expect(subgraph.id).toBe('some-id');
  });

  it.skip('should handle subgraph without id and space in title', function () {
    const res = flow.parser.parse('graph TB\nsubgraph Some Title\n\ta1-->a2\nend');
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(2);
    expect(subgraph.nodes[0]).toBe('a1');
    expect(subgraph.nodes[1]).toBe('a2');
    expect(subgraph.title).toBe('Some Title');
    expect(subgraph.id).toBe('some-id');
  });

  it('should handle subgraph id starting with a number', function () {
    const res = flow.parser.parse(`graph TD
    A[Christmas] -->|Get money| B(Go shopping)
    subgraph 1test
    A
    end`);

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(1);
    expect(subgraph.nodes[0]).toBe('A');
    expect(subgraph.id).toBe('1test');
  });

  it('should handle subgraphs1', function () {
    const res = flow.parser.parse('graph TD;A-->B;subgraph myTitle;c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_point');
  });
  it('should handle subgraphs with title in quotes', function () {
    const res = flow.parser.parse('graph TD;A-->B;subgraph "title in quotes";c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('title in quotes');

    expect(edges[0].type).toBe('arrow_point');
  });
  it('should handle subgraphs in old style that was broken', function () {
    const res = flow.parser.parse('graph TD;A-->B;subgraph old style that is broken;c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('old style that is broken');

    expect(edges[0].type).toBe('arrow_point');
  });
  it('should handle subgraphs with dashes in the title', function () {
    const res = flow.parser.parse('graph TD;A-->B;subgraph a-b-c;c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('a-b-c');

    expect(edges[0].type).toBe('arrow_point');
  });
  it('should handle subgraphs with id and title in brackets', function () {
    const res = flow.parser.parse('graph TD;A-->B;subgraph uid1[text of doom];c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('text of doom');
    expect(subgraph.id).toBe('uid1');

    expect(edges[0].type).toBe('arrow_point');
  });
  it('should handle subgraphs with id and title in brackets and quotes', function () {
    const res = flow.parser.parse('graph TD;A-->B;subgraph uid2["text of doom"];c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('text of doom');
    expect(subgraph.id).toBe('uid2');

    expect(edges[0].type).toBe('arrow_point');
  });
  it('should handle subgraphs with id and title in brackets without spaces', function () {
    const res = flow.parser.parse('graph TD;A-->B;subgraph uid2[textofdoom];c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('textofdoom');
    expect(subgraph.id).toBe('uid2');

    expect(edges[0].type).toBe('arrow_point');
  });

  it('should handle subgraphs2', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\n\n c-->d \nend\n');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_point');
  });

  it('should handle subgraphs3', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle   \n\n    c-->d \nend\n');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_point');
  });

  it('should handle nested subgraphs', function () {
    const str =
      'graph TD\n' +
      'A-->B\n' +
      'subgraph myTitle\n\n' +
      ' c-->d \n\n' +
      ' subgraph inner\n\n   e-->f \n end \n\n' +
      ' subgraph inner\n\n   h-->i \n end \n\n' +
      'end\n';
    const res = flow.parser.parse(str);
  });

  it('should handle subgraphs4', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\nc-->d\nend;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_point');
  });

  it('should handle subgraphs5', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\nc-- text -->d\nd-->e\n end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_point');
  });
  it('should handle subgraphs with multi node statements in it', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\na & b --> c & e\n end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_point');
  });
  it('should handle nested subgraphs 1', function () {
    const res = flow.parser.parse(`flowchart TB
    subgraph A
    b-->B
    a
    end
    a-->c
    subgraph B
      c
    end`);

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);

    const subgraphA = subgraphs.find((o) => o.id === 'A');
    const subgraphB = subgraphs.find((o) => o.id === 'B');

    expect(subgraphB.nodes[0]).toBe('c');
    expect(subgraphA.nodes).toContain('B');
    expect(subgraphA.nodes).toContain('b');
    expect(subgraphA.nodes).toContain('a');
    expect(subgraphA.nodes).not.toContain('c');
  });
  it('should handle nested subgraphs 2', function () {
    const res = flow.parser.parse(`flowchart TB
    b-->B
    a-->c
    subgraph B
      c
    end
    subgraph A
        a
        b
        B
    end`);

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);

    const subgraphA = subgraphs.find((o) => o.id === 'A');
    const subgraphB = subgraphs.find((o) => o.id === 'B');

    expect(subgraphB.nodes[0]).toBe('c');
    expect(subgraphA.nodes).toContain('B');
    expect(subgraphA.nodes).toContain('b');
    expect(subgraphA.nodes).toContain('a');
    expect(subgraphA.nodes).not.toContain('c');
  });
  it('should handle nested subgraphs 3', function () {
    const res = flow.parser.parse(`flowchart TB
    subgraph B
      c
    end
    a-->c
    subgraph A
      b-->B
      a
    end`);

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);

    const subgraphA = subgraphs.find((o) => o.id === 'A');
    const subgraphB = subgraphs.find((o) => o.id === 'B');
    expect(subgraphB.nodes[0]).toBe('c');
    expect(subgraphA.nodes).toContain('B');
    expect(subgraphA.nodes).toContain('b');
    expect(subgraphA.nodes).toContain('a');
    expect(subgraphA.nodes).not.toContain('c');
  });
  it('should correctly parse direction TD inside a subgraph', function () {
    const res = flow.parser.parse(`
      graph LR
        subgraph WithTD
          direction TD
          A1 --> A2
        end
    `);

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.dir).toBe('TD');
    expect(subgraph.nodes).toContain('A1');
    expect(subgraph.nodes).toContain('A2');
  });

  it('should attach `@{ view: collapsed }` metadata to a subgraph and collapse it', function () {
    flow.parser.parse(`
      graph TD
        subgraph one [My Group]
          A --> B
        end
        C --> A
        one@{ view: collapsed }
    `);

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    expect(subgraphs[0].metadata?.view).toBe('collapsed');

    const { nodes, edges } = flow.parser.yy.getData();
    const collapsed = nodes.find((n) => n.id === 'one');
    expect(collapsed?.shape).toBe('collapsedGroup');
    expect(collapsed?.isGroup).toBe(false);
    // Internal members are hidden
    expect(nodes.find((n) => n.id === 'A')).toBeUndefined();
    expect(nodes.find((n) => n.id === 'B')).toBeUndefined();
    // C --> A is redirected to the collapsed node, A --> B is dropped
    expect(edges.find((e) => e.start === 'C' && e.end === 'one')).toBeDefined();
    expect(edges.find((e) => e.end === 'A')).toBeUndefined();
  });

  describe('stacked subgraphs (`@{ layout: stack }`)', function () {
    const parseStack = (body) => {
      flow.parser.parse(body);
      return flow.parser.yy.getData();
    };

    it('draws the subgraph as one stack node with its members as layers, in order', function () {
      const { nodes } = parseStack(`
        flowchart LR
          subgraph S [Our stack]
            UI[Frontend]
            API[API layer]
            DB[(Database)]
          end
          S@{ layout: stack }
      `);
      const stack = nodes.find((n) => n.id === 'S');
      expect(stack?.shape).toBe('stack');
      expect(stack?.isGroup).toBe(false);
      expect(stack?.dir).toBe('TB');
      expect(stack?.stackLayers?.map((l) => [l.id, l.label])).toEqual([
        ['UI', 'Frontend'],
        ['API', 'API layer'],
        ['DB', 'Database'],
      ]);
      // The members are layers, not nodes of their own
      expect(nodes.map((n) => n.id)).toEqual(['S']);
    });

    it('keeps source order for a chain, which the member list holds newest first', function () {
      const { nodes } = parseStack(`
        flowchart TB
          subgraph S
            direction LR
            A ~~~ B ~~~ C
          end
          S@{ layout: stack }
      `);
      const stack = nodes.find((n) => n.id === 'S');
      expect(stack?.dir).toBe('LR');
      expect(stack?.stackLayers?.map((l) => l.id)).toEqual(['A', 'B', 'C']);
    });

    it('orders layers by the subgraph body even when a member was mentioned earlier', function () {
      const { nodes } = parseStack(`
        flowchart LR
          X --> DB
          subgraph S
            UI
            API
            DB
          end
          S@{ layout: stack }
      `);
      expect(nodes.find((n) => n.id === 'S')?.stackLayers?.map((l) => l.id)).toEqual([
        'UI',
        'API',
        'DB',
      ]);
    });

    it('redirects edges to the stack and keeps the layer each end attaches to', function () {
      const { edges } = parseStack(`
        flowchart LR
          User --> API
          subgraph S
            UI
            API
            DB
          end
          S@{ layout: stack }
          DB --> Backup
          Admin --> S
      `);
      const toApi = edges.find((e) => e.start === 'User');
      expect(toApi).toMatchObject({ end: 'S', endLayer: 'API', startLayer: undefined });
      expect(toApi?.id).toContain('API');
      expect(edges.find((e) => e.end === 'Backup')).toMatchObject({
        start: 'S',
        startLayer: 'DB',
      });
      // An edge to the subgraph itself attaches to the stack as a whole
      expect(edges.find((e) => e.start === 'Admin')).toMatchObject({
        end: 'S',
        endLayer: undefined,
      });
    });

    it('drops edges between layers of the same stack', function () {
      const { edges } = parseStack(`
        flowchart LR
          subgraph S
            A --> B
          end
          S@{ layout: stack }
      `);
      expect(edges).toHaveLength(0);
    });

    it('renders a stack that holds another subgraph as a normal subgraph', function () {
      const { nodes } = parseStack(`
        flowchart LR
          subgraph S
            subgraph Inner
              A
            end
            B
          end
          S@{ layout: stack }
      `);
      expect(nodes.find((n) => n.id === 'S')?.isGroup).toBe(true);
      expect(nodes.find((n) => n.id === 'B')).toBeDefined();
    });

    it('leaves a collapsed stack collapsed', function () {
      const { nodes } = parseStack(`
        flowchart LR
          subgraph S
            A
            B
          end
          S@{ layout: stack, view: collapsed }
      `);
      expect(nodes.find((n) => n.id === 'S')?.shape).toBe('collapsedGroup');
    });
  });
});
