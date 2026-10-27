---
'mermaid': minor
---

feat: add `flowchart.tightPacking` to shrink the gaps in a flowchart's layout

With `tightPacking: true`, the gaps between nodes, between levels and inside subgraph frames are cut to about 40% of their usual size in both the ELK and dagre layouts, while keeping a short straight run before each arrowhead.
