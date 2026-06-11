/**
 * src/lib/formula-detect.test.ts
 */

import { describe, it, expect } from 'vitest';
import { looksLikeFormula } from './formula-detect';

describe('looksLikeFormula', () => {
  it('accepts real formulas', () => {
    expect(looksLikeFormula('La(CH3)3')).toBe(true);
    expect(looksLikeFormula('HfCl4')).toBe(true);
    expect(looksLikeFormula('SiH(N(CH3)2)3')).toBe(true);
    expect(looksLikeFormula('Fe2(SO4)3')).toBe(true);
    expect(looksLikeFormula('La')).toBe(true); // single real element
  });

  it('rejects names that the bare parser would mis-read as a single symbol', () => {
    expect(looksLikeFormula('Iron')).toBe(false); // { Iron } — not a real element
    expect(looksLikeFormula('Tin')).toBe(false);
    expect(looksLikeFormula('CpHf')).toBe(false); // Cp is not an element
  });

  it('rejects descriptive names with whitespace', () => {
    expect(looksLikeFormula('Cyclopentadienyl trisdimethylamino hafnium')).toBe(false);
    expect(looksLikeFormula('hafnium tetrachloride')).toBe(false);
  });

  it('rejects blank/garbage', () => {
    expect(looksLikeFormula('')).toBe(false);
    expect(looksLikeFormula('   ')).toBe(false);
    expect(looksLikeFormula('123')).toBe(false);
    expect(looksLikeFormula('!!')).toBe(false);
  });
});
