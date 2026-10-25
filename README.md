# mermaidStacks

A fork of [Mermaid](https://github.com/mermaid-js/mermaid) that adds **stacked subgraphs** to flowcharts: the nodes of a subgraph drawn as touching, equal-width boxes in one block, with links to any node still landing on its own box.

**[Try it in the playground →](https://ramraj07.github.io/ra-mermaid/)**

Everything else is unchanged from upstream Mermaid. For the rest of the syntax, see the [Mermaid documentation](https://mermaid.js.org/).

## Stacked subgraphs

Add `id@{ layout: stack }` after a subgraph:

```text
flowchart LR
    User --> UI
    Admin --> DB
    subgraph S [Our stack]
        UI[Frontend]
        API[API layer]
        DB[(Database)]
    end
    S@{ layout: stack }
    API --> Logs
    DB --> Backup
```

`Frontend`, `API layer` and `Database` are drawn as one block of three boxes, top to bottom. `User --> UI` lands on the Frontend box, `API --> Logs` leaves from the API box, and so on.

> GitHub renders `mermaid` code blocks with upstream Mermaid, which ignores `layout: stack`. Paste the example into the [playground](https://ramraj07.github.io/ra-mermaid/) to see it stacked.

### How it behaves

- **Order:** boxes follow the order the subgraph's body lists them. Put `direction LR` inside the subgraph to stack them left to right, or `BT` / `RL` to reverse the order.
- **Shape:** every box is drawn as a rectangle, whatever shape its node was given. Node styles and classes still apply to each box.
- **Links:** a link to a node in the stack attaches to that node's box, on a side of the stack the box reaches. A link to the subgraph id (`X --> S`) attaches to the stack as a whole.
- **Not supported yet:**
  - Links between two nodes of the same stack are not drawn.
  - The subgraph's title is not drawn.
  - A stack can't contain another subgraph. If it does, it is drawn as a normal subgraph.
- **Layouts:** works with both ELK (the default here) and dagre:
  - With ELK, each linked box gets its own fixed connection point (a "port") on the stack's outline.
  - With dagre, the end of the link is rerouted around the stack onto the box.

## Use this build

The playground hosts the built bundles, so a page can load this fork directly:

```html
<pre class="mermaid">
flowchart LR
  subgraph S
    A
    B
  end
  S@{ layout: stack }
  X --> B
</pre>
<script type="module">
  import mermaid from 'https://ramraj07.github.io/ra-mermaid/mermaid.esm.min.mjs';
  import layouts from 'https://ramraj07.github.io/ra-mermaid/mermaid-layout-elk.esm.min.mjs';

  mermaid.registerLayoutLoaders(layouts);
  mermaid.initialize({ startOnLoad: true });
</script>
```

The site is rebuilt from `develop` on every push (see [`deploy-playground.yml`](.github/workflows/deploy-playground.yml)). The playground itself is [`playground/index.html`](playground/index.html).

## Develop locally

```bash
npm install -g pnpm@10.30.3
pnpm install
pnpm dev
```

`pnpm dev` prints the local URL; open `/dev/example.html` and type a diagram into the box at the bottom. Stack-related code lives in:

- [`flowDb.ts`](packages/mermaid/src/diagrams/flowchart/flowDb.ts): turns a stacked subgraph into one `stack` node and redirects links to it.
- [`shapes/stack.ts`](packages/mermaid/src/rendering-util/rendering-elements/shapes/stack.ts): draws the boxes.
- [`elk/stackPorts.ts`](packages/mermaid/src/rendering-util/layout-algorithms/elk/stackPorts.ts) and [`dagre/stackLayers.ts`](packages/mermaid/src/rendering-util/layout-algorithms/dagre/stackLayers.ts): attach links to the right box.

## License

MIT, like upstream Mermaid. See [LICENSE](LICENSE).
