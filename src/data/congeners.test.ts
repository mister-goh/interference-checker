/**
 * src/data/congeners.test.ts
 *
 * Integrity guards for the curated congener map.
 */

import { describe, it, expect } from 'vitest'
import { ELEMENTS } from './isotopes'
import { CONGENERS, getCongeners } from './congeners'

const SYMBOLS = new Set(ELEMENTS.map((e) => e.symbol))

describe('CONGENERS integrity', () => {
  it('every host and congener symbol exists in the dataset', () => {
    for (const [host, list] of Object.entries(CONGENERS)) {
      expect(SYMBOLS.has(host), `host ${host}`).toBe(true)
      for (const c of list) {
        expect(SYMBOLS.has(c.symbol), `${host} → ${c.symbol}`).toBe(true)
      }
    }
  })

  it('no element is its own congener', () => {
    for (const [host, list] of Object.entries(CONGENERS)) {
      expect(list.some((c) => c.symbol === host), host).toBe(false)
    }
  })

  it('default impurity percentages are within (0, 100]', () => {
    for (const list of Object.values(CONGENERS)) {
      for (const c of list) {
        expect(c.defaultImpurityPct).toBeGreaterThan(0)
        expect(c.defaultImpurityPct).toBeLessThanOrEqual(100)
      }
    }
  })

  it('no duplicate congener symbol within a host entry', () => {
    for (const [host, list] of Object.entries(CONGENERS)) {
      const syms = list.map((c) => c.symbol)
      expect(new Set(syms).size, host).toBe(syms.length)
    }
  })

  it('strong pairs are symmetric (Hf↔Zr, Nb↔Ta, Te↔Se)', () => {
    const pairs: [string, string][] = [
      ['Hf', 'Zr'],
      ['Nb', 'Ta'],
      ['Te', 'Se'],
    ]
    for (const [a, b] of pairs) {
      expect(getCongeners(a).some((c) => c.symbol === b), `${a}→${b}`).toBe(true)
      expect(getCongeners(b).some((c) => c.symbol === a), `${b}→${a}`).toBe(true)
    }
  })

  it('getCongeners returns [] for an element with no registered congeners', () => {
    expect(getCongeners('Sn')).toEqual([])
    expect(getCongeners('Cl')).toEqual([])
  })
})
