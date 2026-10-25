---
'mermaid': minor
---

feat: add stacked flowchart subgraphs via `subgraphId@{ layout: stack }`

A subgraph annotated with `@{ layout: stack }` now renders its nodes as flush, equal-width boxes stacked in one block. Edges to a node in the stack still attach to that node's box, with both the ELK and dagre layouts.
