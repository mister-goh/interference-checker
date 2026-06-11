/**
 * src/data/periodic-table.test.ts
 *
 * Integrity guards for the hand-authored periodic-table layout map.
 * Catches typos / omissions in PERIODIC_LAYOUT against the dataset.
 */

import { describe, it, expect } from 'vitest'
import { ELEMENTS } from './isotopes'
import {
  PERIODIC_LAYOUT,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type ElementCategory,
} from './periodic-table'

describe('PERIODIC_LAYOUT completeness', () => {
  it('every dataset element has a layout entry', () => {
    const missing = ELEMENTS.filter((el) => !PERIODIC_LAYOUT[el.symbol]).map(
      (el) => el.symbol,
    )
    expect(missing).toEqual([])
  })

  it('every layout entry corresponds to a dataset element', () => {
    const datasetSymbols = new Set(ELEMENTS.map((el) => el.symbol))
    const extra = Object.keys(PERIODIC_LAYOUT).filter(
      (sym) => !datasetSymbols.has(sym),
    )
    expect(extra).toEqual([])
  })
})

describe('PERIODIC_LAYOUT coordinates', () => {
  it('no two elements share the same (period, group) cell', () => {
    const seen = new Map<string, string>()
    const collisions: string[] = []
    for (const [sym, { period, group }] of Object.entries(PERIODIC_LAYOUT)) {
      const key = `${period}:${group}`
      const prev = seen.get(key)
      if (prev) collisions.push(`${prev} & ${sym} @ ${key}`)
      else seen.set(key, sym)
    }
    expect(collisions).toEqual([])
  })

  it('group is within 1..18 and period within the allowed set', () => {
    const allowedPeriods = new Set([1, 2, 3, 4, 5, 6, 7, 9, 10])
    for (const { period, group } of Object.values(PERIODIC_LAYOUT)) {
      expect(group).toBeGreaterThanOrEqual(1)
      expect(group).toBeLessThanOrEqual(18)
      expect(allowedPeriods.has(period)).toBe(true)
    }
  })
})

describe('category metadata', () => {
  it('every category used has a Korean label', () => {
    for (const { category } of Object.values(PERIODIC_LAYOUT)) {
      expect(CATEGORY_LABELS[category]).toBeTruthy()
    }
  })

  it('CATEGORY_ORDER covers every label key exactly once', () => {
    const labelKeys = Object.keys(CATEGORY_LABELS) as ElementCategory[]
    expect([...CATEGORY_ORDER].sort()).toEqual([...labelKeys].sort())
    expect(new Set(CATEGORY_ORDER).size).toBe(CATEGORY_ORDER.length)
  })
})
