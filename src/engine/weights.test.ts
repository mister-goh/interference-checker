/**
 * src/engine/weights.test.ts
 *
 * Verifies the optional ElementWeights parameter:
 *  - omitting it (or passing all-1) preserves the original result
 *  - a congener weight < 1 scales the abundance product and can demote severity
 */

import { describe, it, expect } from 'vitest'
import { generateInterferences } from './interference'
import type { MatrixState } from '../types'

// Ar-only background; isobaric generation depends only on the composition.
const M: MatrixState = { Ar: true, H: false, N: false, O: false, C: false, Cl: false }

function zrAt94(weights?: Record<string, number>) {
  // Zr in the sample → ⁹⁴Zr⁺ isobaric at m/z 94 (Zr-94 ≈ 17.4% abundance)
  const list = generateInterferences(94, { Zr: 1 }, M, weights)
  return list.find((i) => i.type === 'isobaric' && i.composition.includes('Zr'))
}

describe('ElementWeights — default invariance', () => {
  it('omitting weights equals passing all-1 weights', () => {
    const a = generateInterferences(94, { Zr: 1 }, M)
    const b = generateInterferences(94, { Zr: 1 }, M, { Zr: 1 })
    expect(b).toEqual(a)
  })

  it('unweighted ⁹⁴Zr isobaric is high severity', () => {
    const zr = zrAt94()
    expect(zr).toBeDefined()
    expect(zr!.severity).toBe('high')
  })
})

describe('ElementWeights — congener down-weighting', () => {
  it('a 2% impurity weight scales the abundance product proportionally', () => {
    const base = zrAt94()!
    const weighted = zrAt94({ Zr: 0.02 })!
    expect(weighted.precursorAbundanceProduct).toBeCloseTo(
      base.precursorAbundanceProduct * 0.02,
      6,
    )
  })

  it('a 2% impurity weight demotes ⁹⁴Zr from high to medium', () => {
    const weighted = zrAt94({ Zr: 0.02 })!
    // 17.4% × 0.02 ≈ 0.35% → medium (0.01 ≤ p < 1.0)
    expect(weighted.severity).toBe('medium')
  })
})
