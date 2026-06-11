/**
 * src/engine/oxide.test.ts
 *
 * Tests for three-atom oxide species: metal dioxide MO₂⁺ and hydroxide MOH⁺.
 */

import { describe, it, expect } from 'vitest'
import { generateInterferences } from './interference'
import type { MatrixState } from '../types'

const O_ON: MatrixState = { Ar: true, H: false, N: false, O: true, C: false, Cl: false }
const O_H_ON: MatrixState = { Ar: true, H: true, N: false, O: true, C: false, Cl: false }
const O_OFF: MatrixState = { Ar: true, H: false, N: false, O: false, C: false, Cl: false }

const hfDioxide = (mass: number, matrix: MatrixState, weights?: Record<string, number>) =>
  generateInterferences(mass, { Hf: 1 }, matrix, weights).filter(
    (i) => i.composition.includes('Hf') && i.composition.includes('O'),
  )

describe('MO₂⁺ metal dioxide', () => {
  it('generates ¹⁷⁷Hf¹⁶O₂⁺ at m/z 209 (→ ²⁰⁹Bi), high severity', () => {
    const hits = hfDioxide(209, O_ON)
    const mo2 = hits.find((i) => i.composition.includes('O₂'))
    expect(mo2).toBeDefined()
    expect(mo2!.type).toBe('polyatomic')
    expect(mo2!.precursorElements.sort()).toEqual(['Hf', 'O'])
    expect(mo2!.severity).toBe('high') // ¹⁷⁷Hf 18.6% × ¹⁶O² ≈ 18.5%
  })

  it('generates ¹⁸⁰Hf¹⁶O₂⁺ at m/z 212', () => {
    const mo2 = hfDioxide(212, O_ON).find((i) => i.composition.includes('O₂'))
    expect(mo2).toBeDefined()
  })

  it('generates the mixed ¹⁶O¹⁸O variant at m/z 211', () => {
    const mixed = hfDioxide(211, O_ON).find(
      (i) => i.composition.includes('¹⁶O') && i.composition.includes('¹⁸O'),
    )
    expect(mixed).toBeDefined()
    // ¹⁷⁷Hf(18.6%) × ¹⁶O(99.76%) × ¹⁸O(0.205%) ≈ 0.038% → medium
    expect(mixed!.severity).toBe('medium')
  })

  it('is NOT generated when oxygen is inactive', () => {
    expect(hfDioxide(209, O_OFF)).toEqual([])
  })

  it('a congener weight (2%) demotes ¹⁷⁷HfO₂ from high to medium and scales the product', () => {
    const base = hfDioxide(209, O_ON).find((i) => i.composition.includes('O₂'))!
    const weighted = hfDioxide(209, O_ON, { Hf: 0.02 }).find((i) => i.composition.includes('O₂'))!
    expect(weighted.precursorAbundanceProduct).toBeCloseTo(base.precursorAbundanceProduct * 0.02, 6)
    expect(weighted.severity).toBe('medium')
  })
})

describe('MOH⁺ hydroxide', () => {
  it('generates ¹⁷⁷Hf¹⁶O¹H⁺ at m/z 194 when hydrogen is active', () => {
    const moh = generateInterferences(194, { Hf: 1 }, O_H_ON).find(
      (i) => i.composition.includes('Hf') && i.composition.includes('¹H'),
    )
    expect(moh).toBeDefined()
    expect(moh!.precursorElements.sort()).toEqual(['H', 'Hf', 'O'])
  })

  it('is NOT generated when hydrogen is inactive (but MO₂ still is)', () => {
    const noH = generateInterferences(194, { Hf: 1 }, O_ON).filter((i) =>
      i.composition.includes('Hf'),
    )
    expect(noH.find((i) => i.composition.includes('¹H'))).toBeUndefined()
    // MO₂ at 209 does not depend on H
    expect(hfDioxide(209, O_ON).length).toBeGreaterThan(0)
  })
})

describe('curated override of a generated triatomic', () => {
  it('⁴⁰Ar¹⁶O¹H⁺ at m/z 57 is the curated literature entry, not the calculated one', () => {
    const list = generateInterferences(57, {}, O_H_ON)
    const arOH = list.find((i) => i.composition === '⁴⁰Ar¹⁶O¹H⁺')
    expect(arOH).toBeDefined()
    expect(arOH!.source).toBe('curated')
  })
})
