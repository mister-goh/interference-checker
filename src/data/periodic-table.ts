/**
 * src/data/periodic-table.ts
 *
 * Hand-authored periodic-table layout (grid position) and category for every
 * element present in ELEMENTS (src/data/isotopes.ts). Kept separate from the
 * AUTO-GENERATED isotopes.ts so the engine/data tests are untouched.
 *
 * Coordinates: main block uses period 1–7 as grid rows and group 1–18 as
 * columns. Lanthanides/actinides (f-block) use period 9/10 and group 3–17
 * (La→3 … Lu→17; actinides Ac→3 … by atomic number), rendered as separate
 * rows below the main table. Elements absent from the dataset are simply
 * not listed (empty cells).
 */

export type ElementCategory =
  | 'alkali-metal'
  | 'alkaline-earth'
  | 'transition-metal'
  | 'post-transition-metal'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide'

export interface ElementLayout {
  period: number // 1–7 main block; 9 = lanthanide row, 10 = actinide row
  group: number // 1–18
  category: ElementCategory
}

export const PERIODIC_LAYOUT: Record<string, ElementLayout> = {
  // Period 1
  H: { period: 1, group: 1, category: 'nonmetal' },
  He: { period: 1, group: 18, category: 'noble-gas' },
  // Period 2
  Li: { period: 2, group: 1, category: 'alkali-metal' },
  Be: { period: 2, group: 2, category: 'alkaline-earth' },
  B: { period: 2, group: 13, category: 'metalloid' },
  C: { period: 2, group: 14, category: 'nonmetal' },
  N: { period: 2, group: 15, category: 'nonmetal' },
  O: { period: 2, group: 16, category: 'nonmetal' },
  F: { period: 2, group: 17, category: 'halogen' },
  Ne: { period: 2, group: 18, category: 'noble-gas' },
  // Period 3
  Na: { period: 3, group: 1, category: 'alkali-metal' },
  Mg: { period: 3, group: 2, category: 'alkaline-earth' },
  Al: { period: 3, group: 13, category: 'post-transition-metal' },
  Si: { period: 3, group: 14, category: 'metalloid' },
  P: { period: 3, group: 15, category: 'nonmetal' },
  S: { period: 3, group: 16, category: 'nonmetal' },
  Cl: { period: 3, group: 17, category: 'halogen' },
  Ar: { period: 3, group: 18, category: 'noble-gas' },
  // Period 4
  K: { period: 4, group: 1, category: 'alkali-metal' },
  Ca: { period: 4, group: 2, category: 'alkaline-earth' },
  Sc: { period: 4, group: 3, category: 'transition-metal' },
  Ti: { period: 4, group: 4, category: 'transition-metal' },
  V: { period: 4, group: 5, category: 'transition-metal' },
  Cr: { period: 4, group: 6, category: 'transition-metal' },
  Mn: { period: 4, group: 7, category: 'transition-metal' },
  Fe: { period: 4, group: 8, category: 'transition-metal' },
  Co: { period: 4, group: 9, category: 'transition-metal' },
  Ni: { period: 4, group: 10, category: 'transition-metal' },
  Cu: { period: 4, group: 11, category: 'transition-metal' },
  Zn: { period: 4, group: 12, category: 'transition-metal' },
  Ga: { period: 4, group: 13, category: 'post-transition-metal' },
  Ge: { period: 4, group: 14, category: 'metalloid' },
  As: { period: 4, group: 15, category: 'metalloid' },
  Se: { period: 4, group: 16, category: 'nonmetal' },
  Br: { period: 4, group: 17, category: 'halogen' },
  Kr: { period: 4, group: 18, category: 'noble-gas' },
  // Period 5
  Rb: { period: 5, group: 1, category: 'alkali-metal' },
  Sr: { period: 5, group: 2, category: 'alkaline-earth' },
  Y: { period: 5, group: 3, category: 'transition-metal' },
  Zr: { period: 5, group: 4, category: 'transition-metal' },
  Nb: { period: 5, group: 5, category: 'transition-metal' },
  Mo: { period: 5, group: 6, category: 'transition-metal' },
  Ru: { period: 5, group: 8, category: 'transition-metal' },
  Rh: { period: 5, group: 9, category: 'transition-metal' },
  Pd: { period: 5, group: 10, category: 'transition-metal' },
  Ag: { period: 5, group: 11, category: 'transition-metal' },
  Cd: { period: 5, group: 12, category: 'transition-metal' },
  In: { period: 5, group: 13, category: 'post-transition-metal' },
  Sn: { period: 5, group: 14, category: 'post-transition-metal' },
  Sb: { period: 5, group: 15, category: 'metalloid' },
  Te: { period: 5, group: 16, category: 'metalloid' },
  I: { period: 5, group: 17, category: 'halogen' },
  Xe: { period: 5, group: 18, category: 'noble-gas' },
  // Period 6 (La–Lu in lanthanide row below)
  Cs: { period: 6, group: 1, category: 'alkali-metal' },
  Ba: { period: 6, group: 2, category: 'alkaline-earth' },
  Hf: { period: 6, group: 4, category: 'transition-metal' },
  Ta: { period: 6, group: 5, category: 'transition-metal' },
  W: { period: 6, group: 6, category: 'transition-metal' },
  Re: { period: 6, group: 7, category: 'transition-metal' },
  Os: { period: 6, group: 8, category: 'transition-metal' },
  Ir: { period: 6, group: 9, category: 'transition-metal' },
  Pt: { period: 6, group: 10, category: 'transition-metal' },
  Au: { period: 6, group: 11, category: 'transition-metal' },
  Hg: { period: 6, group: 12, category: 'transition-metal' },
  Tl: { period: 6, group: 13, category: 'post-transition-metal' },
  Pb: { period: 6, group: 14, category: 'post-transition-metal' },
  Bi: { period: 6, group: 15, category: 'post-transition-metal' },
  // Lanthanides (row 9): La→g3 … Lu→g17
  La: { period: 9, group: 3, category: 'lanthanide' },
  Ce: { period: 9, group: 4, category: 'lanthanide' },
  Pr: { period: 9, group: 5, category: 'lanthanide' },
  Nd: { period: 9, group: 6, category: 'lanthanide' },
  Sm: { period: 9, group: 8, category: 'lanthanide' },
  Eu: { period: 9, group: 9, category: 'lanthanide' },
  Gd: { period: 9, group: 10, category: 'lanthanide' },
  Tb: { period: 9, group: 11, category: 'lanthanide' },
  Dy: { period: 9, group: 12, category: 'lanthanide' },
  Ho: { period: 9, group: 13, category: 'lanthanide' },
  Er: { period: 9, group: 14, category: 'lanthanide' },
  Tm: { period: 9, group: 15, category: 'lanthanide' },
  Yb: { period: 9, group: 16, category: 'lanthanide' },
  Lu: { period: 9, group: 17, category: 'lanthanide' },
  // Actinides (row 10): Ac→g3 … (Th→g4, U→g6)
  Th: { period: 10, group: 4, category: 'actinide' },
  U: { period: 10, group: 6, category: 'actinide' },
}

export const CATEGORY_LABELS: Record<ElementCategory, string> = {
  'alkali-metal': '알칼리 금속',
  'alkaline-earth': '알칼리 토금속',
  'transition-metal': '전이금속',
  'post-transition-metal': '전이후 금속',
  metalloid: '준금속',
  nonmetal: '비금속',
  halogen: '할로겐',
  'noble-gas': '비활성 기체',
  lanthanide: '란타넘족',
  actinide: '악티늄족',
}

/** Legend display order (metals → metalloids → nonmetals → f-block). */
export const CATEGORY_ORDER: ElementCategory[] = [
  'alkali-metal',
  'alkaline-earth',
  'transition-metal',
  'post-transition-metal',
  'metalloid',
  'nonmetal',
  'halogen',
  'noble-gas',
  'lanthanide',
  'actinide',
]
