/**
 * src/lib/filtering.test.ts
 *
 * Unit tests for the status-filter logic (Phase 2 results filter).
 */

import { describe, it, expect } from 'vitest'
import {
  filterByStatus,
  filterByElements,
  countByStatus,
  STATUS_ORDER,
} from './filtering'
import type { Recommendation, RecommendationStatus } from '../types'

function makeRec(symbol: string, status: RecommendationStatus): Recommendation {
  return {
    elementSymbol: symbol,
    elementName: symbol,
    recommendedMass: 1,
    abundance: 100,
    interferences: [],
    status,
    recommendedMode: 'Standard',
    alternativeMasses: [],
    isotopes: [],
  }
}

const SAMPLE: Recommendation[] = [
  makeRec('A', 'clean'),
  makeRec('B', 'clean'),
  makeRec('C', 'avoidable'),
  makeRec('D', 'mode-required'),
  makeRec('E', 'difficult'),
  makeRec('F', 'not-analyzable'),
]

describe('STATUS_ORDER', () => {
  it('lists all five statuses best → worst with no duplicates', () => {
    expect(STATUS_ORDER).toEqual([
      'clean',
      'avoidable',
      'mode-required',
      'difficult',
      'not-analyzable',
    ])
    expect(new Set(STATUS_ORDER).size).toBe(STATUS_ORDER.length)
  })
})

describe('countByStatus', () => {
  it('counts each status and includes every status key (0 when absent)', () => {
    const counts = countByStatus(SAMPLE)
    expect(counts).toEqual({
      clean: 2,
      avoidable: 1,
      'mode-required': 1,
      difficult: 1,
      'not-analyzable': 1,
    })
  })

  it('returns all-zero counts for an empty list', () => {
    expect(countByStatus([])).toEqual({
      clean: 0,
      avoidable: 0,
      'mode-required': 0,
      difficult: 0,
      'not-analyzable': 0,
    })
  })

  it('count total equals input length', () => {
    const counts = countByStatus(SAMPLE)
    const sum = STATUS_ORDER.reduce((acc, s) => acc + counts[s], 0)
    expect(sum).toBe(SAMPLE.length)
  })
})

describe('filterByStatus', () => {
  it('keeps only recommendations whose status is active', () => {
    const active = new Set<RecommendationStatus>(['clean'])
    const out = filterByStatus(SAMPLE, active)
    expect(out.map((r) => r.elementSymbol)).toEqual(['A', 'B'])
  })

  it('supports multi-status selection', () => {
    const active = new Set<RecommendationStatus>(['avoidable', 'difficult'])
    const out = filterByStatus(SAMPLE, active)
    expect(out.map((r) => r.elementSymbol)).toEqual(['C', 'E'])
  })

  it('all statuses active returns the full list unchanged (order preserved)', () => {
    const active = new Set<RecommendationStatus>(STATUS_ORDER)
    const out = filterByStatus(SAMPLE, active)
    expect(out).toEqual(SAMPLE)
  })

  it('empty active set returns nothing', () => {
    const out = filterByStatus(SAMPLE, new Set<RecommendationStatus>())
    expect(out).toEqual([])
  })

  it('does not mutate the input array', () => {
    const before = [...SAMPLE]
    filterByStatus(SAMPLE, new Set<RecommendationStatus>(['clean']))
    expect(SAMPLE).toEqual(before)
  })
})

describe('filterByElements', () => {
  it('returns the list unchanged when symbols is null', () => {
    expect(filterByElements(SAMPLE, null)).toBe(SAMPLE)
  })

  it('keeps only recommendations whose element is in the set', () => {
    const out = filterByElements(SAMPLE, new Set(['A', 'D', 'F']))
    expect(out.map((r) => r.elementSymbol)).toEqual(['A', 'D', 'F'])
  })

  it('returns [] when no element matches', () => {
    expect(filterByElements(SAMPLE, new Set(['Zz']))).toEqual([])
  })

  it('preserves input order', () => {
    const out = filterByElements(SAMPLE, new Set(['F', 'A']))
    expect(out.map((r) => r.elementSymbol)).toEqual(['A', 'F'])
  })

  it('does not mutate the input array', () => {
    const before = [...SAMPLE]
    filterByElements(SAMPLE, new Set(['A']))
    expect(SAMPLE).toEqual(before)
  })
})

describe('filterByElements ∘ filterByStatus (composition)', () => {
  it('element filter then status filter yields the intersection', () => {
    // A(clean) B(clean) C(avoidable) D(mode-required) — keep {A,B,C}, then clean-only → {A,B}
    const elementFiltered = filterByElements(SAMPLE, new Set(['A', 'B', 'C']))
    const out = filterByStatus(
      elementFiltered,
      new Set<RecommendationStatus>(['clean']),
    )
    expect(out.map((r) => r.elementSymbol)).toEqual(['A', 'B'])
  })

  it('status counts after element filter reflect only the element-filtered subset', () => {
    const elementFiltered = filterByElements(SAMPLE, new Set(['A', 'C']))
    const counts = countByStatus(elementFiltered)
    expect(counts.clean).toBe(1) // only A
    expect(counts.avoidable).toBe(1) // only C
    expect(counts['mode-required']).toBe(0)
  })
})
