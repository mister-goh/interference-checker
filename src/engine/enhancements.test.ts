/**
 * src/engine/enhancements.test.ts
 *
 * Tests for the interference-coverage enhancements:
 *   1. Doubly-charged M²⁺ via the IE₂ < IE₁(Ar) criterion (Ca, Th, U, … added;
 *      non-formers like Zn/Hg correctly excluded even at even masses).
 *   2. Oxide-formation factor down-weighting poor oxide-formers (Na, Zn) while
 *      leaving refractory oxides (Ti) unchanged.
 *   3. Argon-dimer background triatomics Ar₂X⁺ (calculated) with curated override.
 *   4. New curated species (N₂O⁺, Ar₂H⁺).
 *
 * Sources for the chemistry: Thomas, R. (2013) Practical Guide to ICP-MS, 3rd ed.;
 * IE₂ data per src/data/ionization-energies.ts.
 */

import { describe, it, expect } from 'vitest'
import { generateInterferences } from './interference'
import { SECOND_IONIZATION_ENERGY, AR_FIRST_IONIZATION_EV } from '../data/ionization-energies'
import { oxideFactorOf } from '../data/oxide-factors'
import type { MatrixState } from '../types'

const HNO3: MatrixState = { Ar: true, H: true, N: true, O: true, C: false, Cl: false }
const O_ON: MatrixState = { Ar: true, H: false, N: false, O: true, C: false, Cl: false }
const BARE: MatrixState = { Ar: true, H: false, N: false, O: false, C: false, Cl: false }

// ─────────────────────────────────────────────────────────────────────────────
// 1. Doubly-charged via IE₂ criterion
// ─────────────────────────────────────────────────────────────────────────────

describe('doubly-charged — IE₂ criterion (new formers)', () => {
  it('²³²Th²⁺ appears at m/z 116 (Th IE₂ = 11.5 eV < 15.76)', () => {
    const list = generateInterferences(116, { Th: 1 }, HNO3)
    const th = list.find(i => i.type === 'doubly-charged' && i.composition.includes('²³²Th'))
    expect(th).toBeDefined()
    expect(th!.targetMass).toBe(116)
    // ²³²Th is 100% abundant → high
    expect(th!.severity).toBe('high')
  })

  it('²³⁸U²⁺ appears at m/z 119 (U IE₂ = 14.72 eV < 15.76)', () => {
    const list = generateInterferences(119, { U: 1 }, HNO3)
    const u = list.find(i => i.type === 'doubly-charged' && i.composition.includes('²³⁸U'))
    expect(u).toBeDefined()
    expect(u!.severity).toBe('high') // ²³⁸U 99.27%
  })

  it('⁴⁰Ca²⁺ appears at m/z 20 (Ca IE₂ = 11.87 eV < 15.76)', () => {
    const list = generateInterferences(20, { Ca: 1 }, BARE)
    const ca = list.find(i => i.type === 'doubly-charged' && i.composition.includes('⁴⁰Ca'))
    expect(ca).toBeDefined()
    expect(ca!.severity).toBe('high') // ⁴⁰Ca 96.94%
  })

  it('the IE₂ data places these formers below the Ar threshold', () => {
    for (const sym of ['Ca', 'Sc', 'Ti', 'V', 'Y', 'Zr', 'Nb', 'Sn', 'Hf', 'Th', 'U']) {
      expect(SECOND_IONIZATION_ENERGY[sym]).toBeLessThan(AR_FIRST_IONIZATION_EV)
    }
  })
})

describe('doubly-charged — non-formers excluded (IE₂ ≥ 15.76)', () => {
  it('Zn produces NO M²⁺ at m/z 32 despite ⁶⁴Zn being even (IE₂ = 17.96 eV)', () => {
    const list = generateInterferences(32, { Zn: 1 }, BARE)
    const zn = list.find(i => i.type === 'doubly-charged' && i.composition.includes('Zn'))
    expect(zn).toBeUndefined()
    expect(SECOND_IONIZATION_ENERGY['Zn']).toBeGreaterThan(AR_FIRST_IONIZATION_EV)
  })

  it('Hg produces NO M²⁺ at m/z 100 despite ²⁰⁰Hg being even (IE₂ = 18.76 eV)', () => {
    const list = generateInterferences(100, { Hg: 1 }, BARE)
    const hg = list.find(i => i.type === 'doubly-charged' && i.composition.includes('Hg'))
    expect(hg).toBeUndefined()
  })

  it('regression: ¹³⁸Ba²⁺ still appears at m/z 69 (Ba remains a former)', () => {
    const list = generateInterferences(69, { Ba: 1 }, HNO3)
    const ba = list.find(i => i.type === 'doubly-charged' && i.composition.includes('¹³⁸Ba'))
    expect(ba).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Oxide-formation factor
// ─────────────────────────────────────────────────────────────────────────────

describe('oxide factor — poor formers down-weighted, refractory unchanged', () => {
  it('oxideFactorOf: poor former Na = 0.1, refractory Ti = 1 (default)', () => {
    expect(oxideFactorOf('Na')).toBe(0.1)
    expect(oxideFactorOf('Ti')).toBe(1)
    expect(oxideFactorOf('Hf')).toBe(1)
  })

  it('²³Na¹⁶O⁺ at m/z 39 is scaled by the 0.1 oxide factor', () => {
    const naO = generateInterferences(39, { Na: 1 }, O_ON).find(
      i => i.composition === '¹⁶O²³Na⁺',
    )
    expect(naO).toBeDefined()
    // (100% × 99.757%) × 0.1 ≈ 9.98%  (would be 99.76% without the factor)
    expect(naO!.precursorAbundanceProduct).toBeCloseTo(9.976, 1)
  })

  it('⁴⁸Ti¹⁶O⁺ at m/z 64 keeps its full product (refractory, factor 1)', () => {
    const tiO = generateInterferences(64, { Ti: 1 }, O_ON).find(
      i => i.composition === '¹⁶O⁴⁸Ti⁺',
    )
    expect(tiO).toBeDefined()
    // ⁴⁸Ti 73.72% × ¹⁶O 99.757% ≈ 73.5% — unscaled
    expect(tiO!.precursorAbundanceProduct).toBeCloseTo(73.5, 0)
    expect(tiO!.severity).toBe('high')
  })

  it('a poor-former oxide can be demoted high→medium (⁶⁷Zn¹⁶O⁺ at m/z 83)', () => {
    const znO = generateInterferences(83, { Zn: 1 }, O_ON).find(
      i => i.composition === '¹⁶O⁶⁷Zn⁺',
    )
    expect(znO).toBeDefined()
    // ⁶⁷Zn 4.04% × ¹⁶O 99.757% × 0.1 ≈ 0.40% → medium (was 4.03% high)
    expect(znO!.severity).toBe('medium')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Argon-dimer background triatomics
// ─────────────────────────────────────────────────────────────────────────────

describe('Ar₂X⁺ background triatomics', () => {
  it('⁴⁰Ar₂¹⁴N⁺ generated at m/z 94 (N active)', () => {
    const list = generateInterferences(94, {}, HNO3)
    const ar2n = list.find(i => i.composition === '⁴⁰Ar₂¹⁴N⁺')
    expect(ar2n).toBeDefined()
    expect(ar2n!.type).toBe('polyatomic')
    expect(ar2n!.precursorElements.sort()).toEqual(['Ar', 'N'])
    expect(ar2n!.severity).toBe('high') // ~99%
  })

  it('Ar₂N⁺ is NOT generated when N is inactive', () => {
    const list = generateInterferences(94, {}, O_ON) // N off
    expect(list.find(i => i.composition === '⁴⁰Ar₂¹⁴N⁺')).toBeUndefined()
  })

  it('⁴⁰Ar₂¹⁶O⁺ at m/z 96 is the single curated entry (no duplicate)', () => {
    const list = generateInterferences(96, {}, O_ON)
    const ar2o = list.filter(i => i.composition === '⁴⁰Ar₂¹⁶O⁺')
    expect(ar2o).toHaveLength(1)
    expect(ar2o[0].source).toBe('curated')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. New curated species
// ─────────────────────────────────────────────────────────────────────────────

describe('new curated species', () => {
  it('¹⁴N₂¹⁶O⁺ (N₂O) at m/z 44 → ⁴⁴Ca, high, curated', () => {
    const list = generateInterferences(44, {}, HNO3)
    const n2o = list.find(i => i.composition === '¹⁴N₂¹⁶O⁺')
    expect(n2o).toBeDefined()
    expect(n2o!.source).toBe('curated')
    expect(n2o!.severity).toBe('high')
  })

  it('⁴⁰Ar₂¹H⁺ at m/z 81 → ⁸¹Br, curated override', () => {
    const list = generateInterferences(81, {}, HNO3)
    const ar2h = list.filter(i => i.composition === '⁴⁰Ar₂¹H⁺')
    expect(ar2h).toHaveLength(1)
    expect(ar2h[0].source).toBe('curated')
    expect(ar2h[0].severity).toBe('high')
  })

  it('N₂O requires both N and O active (gated by mergeCurated)', () => {
    const noN: MatrixState = { Ar: true, H: false, N: false, O: true, C: false, Cl: false }
    const list = generateInterferences(44, {}, noN)
    expect(list.find(i => i.composition === '¹⁴N₂¹⁶O⁺')).toBeUndefined()
  })
})
