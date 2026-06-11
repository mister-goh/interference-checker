/**
 * src/data/congeners.ts
 *
 * Congener (same-group / chemically near-inseparable) impurity map.
 *
 * Certain elements co-occur and are extremely hard to separate, so a reagent of
 * one almost always carries the other as a trace impurity. In ICP-MS the
 * congener then produces isobaric (e.g. ⁹⁴Zr on ⁹⁴Mo) and polyatomic (ZrO⁺)
 * interferences. This map lets the app auto-add those congeners to the sample.
 *
 * Basis (established chemistry / geochemistry, NOT lot-specific):
 *  - Zr ↔ Hf: lanthanide contraction makes their ionic radii nearly identical →
 *    near-inseparable; Hf reagents typically carry ~1–3% Zr and vice versa.
 *  - Nb ↔ Ta: classic difficult-to-separate pair (columbite–tantalite).
 *  - Lanthanides (REE): adjacent-Z neighbours co-occur most strongly; Y tracks
 *    the heavy REE (Y³⁺ radius ≈ Ho³⁺).
 *  - Te ↔ Se: chalcogen co-occurrence (anode slimes).
 *
 * `defaultImpurityPct` is a CONSERVATIVE default only — real levels depend on the
 * material, grade, and lot, so the UI lets the user override per their CoA.
 * These weights scale interference severity (see engine ElementWeights); they are
 * a "possibility alert", not a quantitative prediction.
 */

export interface Congener {
  symbol: string
  /** Default assumed impurity level (%) — user-overridable. */
  defaultImpurityPct: number
}

export const CONGENERS: Record<string, Congener[]> = {
  // ── Strong, near-inseparable pairs ──
  Hf: [{ symbol: 'Zr', defaultImpurityPct: 2 }],
  Zr: [{ symbol: 'Hf', defaultImpurityPct: 2 }],
  Nb: [{ symbol: 'Ta', defaultImpurityPct: 1 }],
  Ta: [{ symbol: 'Nb', defaultImpurityPct: 1 }],

  // ── Chalcogen pair ──
  Te: [{ symbol: 'Se', defaultImpurityPct: 0.5 }],
  Se: [{ symbol: 'Te', defaultImpurityPct: 0.5 }],

  // ── Rare earths — adjacent-Z neighbours (light → heavy), Y with heavy REE ──
  La: [{ symbol: 'Ce', defaultImpurityPct: 1 }, { symbol: 'Pr', defaultImpurityPct: 1 }],
  Ce: [{ symbol: 'La', defaultImpurityPct: 1 }, { symbol: 'Pr', defaultImpurityPct: 1 }, { symbol: 'Nd', defaultImpurityPct: 1 }],
  Pr: [{ symbol: 'Ce', defaultImpurityPct: 1 }, { symbol: 'La', defaultImpurityPct: 1 }, { symbol: 'Nd', defaultImpurityPct: 1 }],
  Nd: [{ symbol: 'Pr', defaultImpurityPct: 1 }, { symbol: 'Ce', defaultImpurityPct: 1 }, { symbol: 'Sm', defaultImpurityPct: 1 }],
  Sm: [{ symbol: 'Nd', defaultImpurityPct: 1 }, { symbol: 'Eu', defaultImpurityPct: 1 }, { symbol: 'Gd', defaultImpurityPct: 1 }],
  Eu: [{ symbol: 'Sm', defaultImpurityPct: 1 }, { symbol: 'Gd', defaultImpurityPct: 1 }],
  Gd: [{ symbol: 'Sm', defaultImpurityPct: 1 }, { symbol: 'Eu', defaultImpurityPct: 1 }, { symbol: 'Tb', defaultImpurityPct: 1 }, { symbol: 'Dy', defaultImpurityPct: 1 }],
  Tb: [{ symbol: 'Gd', defaultImpurityPct: 1 }, { symbol: 'Dy', defaultImpurityPct: 1 }],
  Dy: [{ symbol: 'Gd', defaultImpurityPct: 1 }, { symbol: 'Tb', defaultImpurityPct: 1 }, { symbol: 'Ho', defaultImpurityPct: 1 }, { symbol: 'Y', defaultImpurityPct: 1 }],
  Ho: [{ symbol: 'Dy', defaultImpurityPct: 1 }, { symbol: 'Er', defaultImpurityPct: 1 }, { symbol: 'Y', defaultImpurityPct: 1 }],
  Er: [{ symbol: 'Ho', defaultImpurityPct: 1 }, { symbol: 'Tm', defaultImpurityPct: 1 }, { symbol: 'Yb', defaultImpurityPct: 1 }, { symbol: 'Y', defaultImpurityPct: 1 }],
  Tm: [{ symbol: 'Er', defaultImpurityPct: 1 }, { symbol: 'Yb', defaultImpurityPct: 1 }],
  Yb: [{ symbol: 'Er', defaultImpurityPct: 1 }, { symbol: 'Tm', defaultImpurityPct: 1 }, { symbol: 'Lu', defaultImpurityPct: 1 }],
  Lu: [{ symbol: 'Yb', defaultImpurityPct: 1 }],
  Y: [{ symbol: 'Dy', defaultImpurityPct: 1 }, { symbol: 'Ho', defaultImpurityPct: 1 }, { symbol: 'Er', defaultImpurityPct: 1 }],
}

/** Congeners for an element symbol (empty array when none registered). */
export function getCongeners(symbol: string): Congener[] {
  return CONGENERS[symbol] ?? []
}
