/**
 * src/lib/formula-detect.ts
 *
 * Decide whether a typed string is a chemical formula (vs. a compound name).
 *
 * The engine parser (engine/formula-parser) treats any capitalized word as a
 * symbol, so "Iron" parses to { Iron: 1 }. To avoid mis-reading names as
 * formulas we additionally require every parsed symbol to be a real element.
 */

import { parseFormula } from '../engine/formula-parser';
import { ELEMENT_BY_SYMBOL } from '../data/isotopes';

/**
 * True only when `text` parses as a formula AND every symbol is a real element.
 * Whitespace (present in descriptive names) is rejected up front.
 */
export function looksLikeFormula(text: string): boolean {
  const t = text.trim();
  if (!t || /\s/.test(t)) return false;
  try {
    const composition = parseFormula(t);
    return Object.keys(composition).every((sym) => sym in ELEMENT_BY_SYMBOL);
  } catch {
    return false;
  }
}
