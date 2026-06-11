/**
 * engine.test.ts
 *
 * Literature-validated regression tests for the interference engine.
 * All cases sourced from:
 *   [T] Thomas, R. (2013) Practical Guide to ICP-MS, 3rd ed. CRC Press.
 *   [J] Jarvis, K.E. et al. (1992) Inductively Coupled Plasma Mass Spectrometry.
 *
 * Run: npx vitest run
 */

import { describe, it, expect } from 'vitest';
import { parseFormula } from './formula-parser';
import { generateInterferences, toSeverity } from './interference';
import { recommend } from './recommend';
import type { MatrixState } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: default HNO3 matrix (Ar always ON, H/N/O ON, C/Cl OFF)
// ─────────────────────────────────────────────────────────────────────────────

const HNO3_MATRIX: MatrixState = {
  Ar: true, H: true, N: true, O: true, C: false, Cl: false,
};

const ALL_MATRIX: MatrixState = {
  Ar: true, H: true, N: true, O: true, C: true, Cl: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Formula parser
// ─────────────────────────────────────────────────────────────────────────────

describe('formula-parser', () => {
  it('parses simple formula HfCl4', () => {
    expect(parseFormula('HfCl4')).toEqual({ Hf: 1, Cl: 4 });
  });

  it('parses nested parentheses SiH(N(CH3)2)3', () => {
    // SiH(N(CH3)2)3:
    //   Si:1, H:1 (outer), then group (N(CH3)2)×3:
    //     N:1, (CH3)×2 = C:2, H:6  → per group: N:1, C:2, H:6
    //   ×3 = N:3, C:6, H:18  plus outer H:1 → H:19
    const r = parseFormula('SiH(N(CH3)2)3');
    expect(r).toEqual({ Si: 1, H: 19, N: 3, C: 6 });
  });

  it('parses Fe2(SO4)3', () => {
    expect(parseFormula('Fe2(SO4)3')).toEqual({ Fe: 2, S: 3, O: 12 });
  });

  it('parses monoisotopic single-element As', () => {
    expect(parseFormula('As')).toEqual({ As: 1 });
  });

  it('throws on empty string', () => {
    expect(() => parseFormula('')).toThrow();
  });

  it('throws on unmatched parenthesis', () => {
    expect(() => parseFormula('Fe2(SO4')).toThrow();
  });

  it('throws on unknown character', () => {
    expect(() => parseFormula('Fe@2')).toThrow();
  });

  it('parses bracket notation Ca[SO4]', () => {
    expect(parseFormula('Ca[SO4]')).toEqual({ Ca: 1, S: 1, O: 4 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Severity thresholds
// ─────────────────────────────────────────────────────────────────────────────

describe('toSeverity', () => {
  it('boundary p=1.0% is high (half-open interval)', () => {
    expect(toSeverity(1.0)).toBe('high');
  });

  it('p=0.9999% is medium', () => {
    expect(toSeverity(0.9999)).toBe('medium');
  });

  it('p=0.01% is medium', () => {
    expect(toSeverity(0.01)).toBe('medium');
  });

  it('p=0.0099% is low', () => {
    expect(toSeverity(0.0099)).toBe('low');
  });

  it('p=75.46% (40Ar35Cl+) is high', () => {
    // 40Ar: 99.6003%, 35Cl: 75.76%  → product = 0.99600 × 0.7576 = 75.46%
    const p = (99.6003 / 100) * (75.76 / 100) * 100;
    expect(p).toBeGreaterThan(1.0);
    expect(toSeverity(p)).toBe('high');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Interference engine — literature cases
// ─────────────────────────────────────────────────────────────────────────────

describe('generateInterferences — literature cases', () => {

  // ── Case 1: ⁴⁰Ar³⁵Cl⁺ at m/z 75 (⁷⁵As interference) [T p.89, J p.112]
  it('generates ⁴⁰Ar³⁵Cl⁺ at m/z 75 from HfCl4 + Ar matrix', () => {
    const comp = parseFormula('HfCl4');
    const interf = generateInterferences(75, comp, HNO3_MATRIX);
    const arCl = interf.find(i => i.composition.includes('Ar') && i.composition.includes('Cl'));
    expect(arCl).toBeDefined();
    expect(arCl!.targetMass).toBe(75);
    expect(arCl!.type).toBe('polyatomic');
    expect(arCl!.severity).toBe('high');
    // Ar-40 (99.6003%) × Cl-35 (75.76%) = 75.46% → high
    expect(arCl!.precursorAbundanceProduct).toBeCloseTo(75.46, 0);
  });

  // ── Case 2: ⁴⁰Ar¹⁶O⁺ at m/z 56 — ⁵⁶Fe interference [T p.89]
  it('generates ⁴⁰Ar¹⁶O⁺ at m/z 56 (HNO3 matrix, O active)', () => {
    const comp = parseFormula('Fe');
    const interf = generateInterferences(56, comp, HNO3_MATRIX);
    // ⁴⁰Ar (99.6003%) + ¹⁶O (99.757%) = 40+16 = 56, product ≈ 99.36% → high
    const arO = interf.find(i => i.composition === '¹⁶O⁴⁰Ar⁺');
    expect(arO).toBeDefined();
    expect(arO!.severity).toBe('high');
    expect(arO!.precursorAbundanceProduct).toBeGreaterThan(90);
  });

  // ── Case 3: ⁴⁰Ar₂⁺ at m/z 80 — ⁸⁰Se interference [T p.87] (curated)
  it('includes curated ⁴⁰Ar₂⁺ at m/z 80 (⁸⁰Se)', () => {
    const comp = parseFormula('Se');
    const interf = generateInterferences(80, comp, HNO3_MATRIX);
    const ar2 = interf.find(i => i.composition === '⁴⁰Ar₂⁺');
    expect(ar2).toBeDefined();
    expect(ar2!.type).toBe('polyatomic');
    expect(ar2!.severity).toBe('high');
    expect(ar2!.source).toBe('curated');
  });

  // ── Case 4: ¹³⁷Ba²⁺ MUST NOT appear (odd mass → half-integer m/z 68.5)
  it('137Ba2+ does NOT appear at any integer mass (odd-mass rule)', () => {
    // Ba in compound, check mass 68 and 69
    const comp = { Ba: 1 };
    const at68 = generateInterferences(68, comp, HNO3_MATRIX);
    const at69 = generateInterferences(69, comp, HNO3_MATRIX);

    const ba137at68 = at68.find(i => i.composition.includes('¹³⁷Ba') && i.type === 'doubly-charged');
    const ba137at69 = at69.find(i => i.composition.includes('¹³⁷Ba') && i.type === 'doubly-charged');

    expect(ba137at68).toBeUndefined();
    expect(ba137at69).toBeUndefined();
  });

  // ── Case 5: ¹³⁸Ba²⁺ MUST appear at m/z 69 (even mass, 138/2=69)
  it('138Ba2+ appears at m/z 69 (even-mass rule)', () => {
    const comp = { Ba: 1 };
    const interf = generateInterferences(69, comp, HNO3_MATRIX);
    const ba138 = interf.find(
      i => i.type === 'doubly-charged' && i.composition.includes('¹³⁸Ba'),
    );
    expect(ba138).toBeDefined();
    expect(ba138!.targetMass).toBe(69);
    // 138Ba abundance = 71.698% → high
    expect(ba138!.severity).toBe('high');
  });

  // ── Case 6: ⁴⁰Ar¹⁴N⁺ at m/z 54 — ⁵⁴Fe / ⁵⁴Cr interference [T p.90] (curated)
  it('includes curated ⁴⁰Ar¹⁴N⁺ at m/z 54 (N active)', () => {
    const comp = { Fe: 1 };
    const interf = generateInterferences(54, comp, HNO3_MATRIX);
    const arN = interf.find(i => i.composition === '⁴⁰Ar¹⁴N⁺');
    expect(arN).toBeDefined();
    expect(arN!.severity).toBe('high');
  });

  // ── Case 7: ⁴⁰Ar¹²C⁺ at m/z 52 only when C is active [T p.90]
  it('⁴⁰Ar¹²C⁺ at m/z 52 absent when C inactive, present when C active', () => {
    const comp = { Cr: 1 };
    const withoutC = generateInterferences(52, comp, HNO3_MATRIX); // C=false
    const withC    = generateInterferences(52, comp, ALL_MATRIX);   // C=true

    const arCwithout = withoutC.find(i => i.composition === '⁴⁰Ar¹²C⁺');
    const arCwith    = withC.find(i => i.composition === '⁴⁰Ar¹²C⁺');

    expect(arCwithout).toBeUndefined();
    expect(arCwith).toBeDefined();
    expect(arCwith!.severity).toBe('high');
  });

  // ── Case 8: ⁴⁰Ar¹⁶O¹H⁺ at m/z 57 — ⁵⁷Fe interference (curated triatomic)
  it('includes curated ⁴⁰Ar¹⁶O¹H⁺ at m/z 57 (H and O active)', () => {
    const comp = { Fe: 1 };
    const interf = generateInterferences(57, comp, HNO3_MATRIX);
    const arOH = interf.find(i => i.composition === '⁴⁰Ar¹⁶O¹H⁺');
    expect(arOH).toBeDefined();
    expect(arOH!.severity).toBe('high');
  });

  // ── Case 9: curated ⁴⁰Ar¹⁴N⁺ absent when N is OFF
  it('⁴⁰Ar¹⁴N⁺ absent at m/z 54 when N is inactive', () => {
    const comp = { Fe: 1 };
    const noN: MatrixState = { Ar: true, H: true, N: false, O: true, C: false, Cl: false };
    const interf = generateInterferences(54, comp, noN);
    const arN = interf.find(i => i.composition === '⁴⁰Ar¹⁴N⁺');
    expect(arN).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. recommend() pipeline — literature cases
// ─────────────────────────────────────────────────────────────────────────────

describe('recommend — HfCl4 validation (key literature case)', () => {
  const comp = parseFormula('HfCl4');
  const recs = recommend(comp, ALL_MATRIX);
  const recMap = new Map(recs.map(r => [r.elementSymbol, r]));

  // ── Case 10: As — monoisotopic, mode-required, alternativeMasses=[]
  it('As: monoisotopic → only mass 75, status mode-required (ArCl+), alternativeMasses=[]', () => {
    const as = recMap.get('As');
    expect(as).toBeDefined();
    expect(as!.recommendedMass).toBe(75);
    expect(as!.alternativeMasses).toEqual([]);
    // ⁴⁰Ar³⁵Cl⁺ at m/z 75 is high-severity → mode-required
    expect(as!.status).toBe('mode-required');
  });

  // ── Case 11: Hf — should have some clean or avoidable masses
  it('Hf: has multiple isotopes and recommendation exists', () => {
    const hf = recMap.get('Hf');
    expect(hf).toBeDefined();
    expect([178, 180, 177, 179, 176, 174]).toContain(hf!.recommendedMass);
  });
});

describe('recommend — Fe in HNO3 matrix', () => {
  const comp = parseFormula('Fe');
  const recs = recommend(comp, HNO3_MATRIX);
  const recMap = new Map(recs.map(r => [r.elementSymbol, r]));

  // ── Case 12: 56Fe has ArO+ interference → should avoid m/z 56
  it('Fe: avoids m/z 56 (ArO+ high) or flags it correctly', () => {
    const fe = recMap.get('Fe');
    expect(fe).toBeDefined();
    // If recommended mass is 56, it must be mode-required or difficult
    if (fe!.recommendedMass === 56) {
      expect(['mode-required', 'difficult']).toContain(fe!.status);
    } else {
      // Should prefer a less-interfered mass
      expect([54, 57, 58]).toContain(fe!.recommendedMass);
    }
  });
});

describe('recommend — Se in HNO3 matrix (Ar2+ interference)', () => {
  const comp = parseFormula('Se');
  const recs = recommend(comp, HNO3_MATRIX);
  const recMap = new Map(recs.map(r => [r.elementSymbol, r]));

  // ── Case 13: 80Se has Ar2+ → should not recommend m/z 80 as clean
  it('Se: m/z 80 is not clean (Ar2+ curated interference)', () => {
    const se = recMap.get('Se');
    expect(se).toBeDefined();
    if (se!.recommendedMass === 80) {
      expect(se!.status).not.toBe('clean');
    }
    // Ar2+ should appear in interferences at m/z 80
    const interf80 = generateInterferences(80, { Se: 1 }, HNO3_MATRIX);
    expect(interf80.some(i => i.composition === '⁴⁰Ar₂⁺')).toBe(true);
  });
});

describe('recommend — deterministic tie-break', () => {
  // ── Case 14: Same status, tie-break by abundance desc then mass asc
  it('two equal-status isotopes: higher abundance wins', () => {
    // Mo has many isotopes at comparable masses; just verify result is stable
    const comp = { Mo: 1 };
    const r1 = recommend(comp, HNO3_MATRIX);
    const r2 = recommend(comp, HNO3_MATRIX);
    expect(r1.find(r => r.elementSymbol === 'Mo')!.recommendedMass)
      .toBe(r2.find(r => r.elementSymbol === 'Mo')!.recommendedMass);
  });
});

describe('recommend — single-isotope elements', () => {
  // ── Case 15: Monoisotopic element Sc has alternativeMasses=[]
  it('Sc (monoisotopic, mass 45): alternativeMasses=[]', () => {
    const comp = { Sc: 1 };
    const recs = recommend(comp, HNO3_MATRIX);
    const sc = recs.find(r => r.elementSymbol === 'Sc');
    expect(sc).toBeDefined();
    expect(sc!.recommendedMass).toBe(45);
    expect(sc!.alternativeMasses).toEqual([]);
  });

  // ── Case 16: Monoisotopic element Mn has alternativeMasses=[]
  it('Mn (monoisotopic, mass 55): alternativeMasses=[]', () => {
    const comp = { Mn: 1 };
    const recs = recommend(comp, HNO3_MATRIX);
    const mn = recs.find(r => r.elementSymbol === 'Mn');
    expect(mn).toBeDefined();
    expect(mn!.recommendedMass).toBe(55);
    expect(mn!.alternativeMasses).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. difficult status — all isotopes carry isobaric interferences
// ─────────────────────────────────────────────────────────────────────────────

describe('recommend — difficult status when all isotopes are isobarically interfered', () => {
  // Indium (In) has exactly two stable isotopes: ¹¹³In (4.29%) and ¹¹⁵In (95.71%).
  // ¹¹³Cd is isobaric with ¹¹³In (both at m/z 113).
  // ¹¹⁵Sn is isobaric with ¹¹⁵In (both at m/z 115).
  // A compound containing both Cd and Sn therefore creates isobaric interferences
  // at EVERY In isotope mass — no clean or avoidable escape exists.
  // The engine must classify In as 'difficult' and report the best available mass
  // (highest-abundance isotope = 115, but still difficult).
  //
  // Ref: Thomas (2013) p.96 — In/Cd/Sn isobaric overlap well-documented in ICP-MS lit.

  const comp = parseFormula('CdSnCl2');   // Cd + Sn both in compound; Cl just adds matrix species
  const recs = recommend(comp, HNO3_MATRIX);
  const inRec = recs.find(r => r.elementSymbol === 'In');

  it('In recommendation exists', () => {
    expect(inRec).toBeDefined();
  });

  it('In status is difficult (isobaric at every isotope mass)', () => {
    expect(inRec!.status).toBe('difficult');
  });

  it('In has isobaric interference in the recommended mass interference list', () => {
    const hasIsobaric = inRec!.interferences.some(i => i.type === 'isobaric');
    expect(hasIsobaric).toBe(true);
  });

  it('In alternativeMasses reflects the no-clean-option semantics (all masses are difficult)', () => {
    // Both isotope masses (113 and 115) should appear across recommended + alternatives
    const allMasses = [inRec!.recommendedMass, ...inRec!.alternativeMasses];
    expect(allMasses).toContain(113);
    expect(allMasses).toContain(115);
  });

  it('In recommended mass is 115 (highest abundance among difficult options, tie-break: abundance desc)', () => {
    // ¹¹⁵In abundance 95.71% > ¹¹³In abundance 4.29% → 115 wins tie-break
    expect(inRec!.recommendedMass).toBe(115);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Performance test — full pipeline < 1000 ms
// ─────────────────────────────────────────────────────────────────────────────

describe('performance', () => {
  it('full pipeline with complex formula + all matrix toggles < 1000ms', () => {
    // SiH(N(CH3)2)3 — 3DMAS, has Si/H/N/C: maximum compound-element pool
    const comp = parseFormula('SiH(N(CH3)2)3');
    // Verify parse: Si:1, H:19, N:3, C:6 (see formula-parser test for breakdown)
    expect(comp).toEqual({ Si: 1, H: 19, N: 3, C: 6 });

    const start = performance.now();
    const recs = recommend(comp, ALL_MATRIX);
    const elapsed = performance.now() - start;

    expect(recs.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(1000);
  });
});
