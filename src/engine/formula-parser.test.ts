/**
 * src/engine/formula-parser.test.ts
 */

import { describe, it, expect } from 'vitest';
import { parseFormula, FormulaParseError } from './formula-parser';

describe('parseFormula — base behavior (unchanged)', () => {
  it('parses simple and nested formulas', () => {
    expect(parseFormula('HfCl4')).toEqual({ Hf: 1, Cl: 4 });
    expect(parseFormula('Fe2(SO4)3')).toEqual({ Fe: 2, S: 3, O: 12 });
    expect(parseFormula('SiH(N(CH3)2)3')).toEqual({ Si: 1, H: 19, N: 3, C: 6 }); // tris(dimethylamino)silane

    expect(parseFormula('O2')).toEqual({ O: 2 }); // trailing count, not a charge
  });

  it('throws on garbage', () => {
    expect(() => parseFormula('')).toThrow(FormulaParseError);
    expect(() => parseFormula('!!')).toThrow(FormulaParseError);
  });
});

describe('parseFormula — hydrates', () => {
  it('sums hydrate segments with leading coefficients', () => {
    expect(parseFormula('CuSO4·5H2O')).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
    expect(parseFormula('MgSO4·7H2O')).toEqual({ Mg: 1, S: 1, O: 11, H: 14 });
  });

  it('accepts bullet, asterisk, and period as hydrate separators', () => {
    expect(parseFormula('CuSO4•5H2O')).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
    expect(parseFormula('CuSO4*5H2O')).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
    expect(parseFormula('CuSO4.5H2O')).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
  });
});

describe('parseFormula — ionic charges (ignored for composition)', () => {
  it('strips trailing charge notations', () => {
    expect(parseFormula('Fe³⁺')).toEqual({ Fe: 1 });
    expect(parseFormula('SO4^2-')).toEqual({ S: 1, O: 4 });
    expect(parseFormula('NH4+')).toEqual({ N: 1, H: 4 });
    expect(parseFormula('Cl-')).toEqual({ Cl: 1 });
  });

  it('does not strip plain trailing atom counts', () => {
    expect(parseFormula('H2O2')).toEqual({ H: 2, O: 2 });
    expect(parseFormula('CO2')).toEqual({ C: 1, O: 2 });
  });
});
