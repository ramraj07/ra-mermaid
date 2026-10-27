/** How far `flowchart.tightPacking` shrinks the gaps a layout leaves between boxes. */
export const TIGHT_PACKING_FACTOR = 0.4;

/**
 * Smallest gap between ranks that tight packing leaves. An edge approaches its
 * target over about half the gap, and that run has to clear the 10px arrowhead.
 */
export const MIN_PACKED_RANK_GAP = 32;

/** `spacing` between ranks, packed by `packing` but never below `MIN_PACKED_RANK_GAP`. */
export const packRankGap = (spacing: number, packing: number) =>
  packing < 1 ? Math.max(MIN_PACKED_RANK_GAP, spacing * packing) : spacing;

/**
 * The factor to scale a layout's spacing by: `TIGHT_PACKING_FACTOR` for a
 * flowchart with `tightPacking` on, else 1. Other diagrams share the config
 * object, so the option is checked against the diagram type too.
 */
export const packingFactor = (data: {
  type?: string;
  config?: { flowchart?: { tightPacking?: boolean } };
}) =>
  data.type?.startsWith('flowchart') && data.config?.flowchart?.tightPacking
    ? TIGHT_PACKING_FACTOR
    : 1;
