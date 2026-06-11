/**
 * src/data/compound-aliases.test.ts
 *
 * Integrity guards for the curated abbreviation alias table.
 * Ensures every stored formula is engine-parseable and lookups behave.
 */

import { describe, it, expect } from 'vitest'
import {
  COMPOUND_ALIASES,
  resolveAlias,
  searchAliases,
} from './compound-aliases'
import { parseFormula } from '../engine/formula-parser'

describe('COMPOUND_ALIASES data integrity', () => {
  it('every formula parses to a non-empty composition', () => {
    for (const entry of COMPOUND_ALIASES) {
      const composition = parseFormula(entry.formula)
      expect(Object.keys(composition).length, `${entry.canonicalName} (${entry.formula})`).toBeGreaterThan(0)
    }
  })

  it('every entry has at least one alias key', () => {
    for (const entry of COMPOUND_ALIASES) {
      expect(entry.aliases.length, entry.canonicalName).toBeGreaterThan(0)
    }
  })

  it('no duplicate alias keys across entries (case-insensitive)', () => {
    const seen = new Map<string, string>()
    const dupes: string[] = []
    for (const entry of COMPOUND_ALIASES) {
      for (const a of entry.aliases) {
        const key = a.toLowerCase()
        const prev = seen.get(key)
        if (prev) dupes.push(`"${a}" in ${prev} & ${entry.canonicalName}`)
        else seen.set(key, entry.canonicalName)
      }
    }
    expect(dupes).toEqual([])
  })
})

describe('resolveAlias', () => {
  it('matches an abbreviation case-insensitively', () => {
    expect(resolveAlias('btbas')?.formula).toBe('C8H22N2Si')
    expect(resolveAlias('  3DMAS  ')?.formula).toBe('C6H19N3Si')
  })

  it('matches the canonical name case-insensitively', () => {
    expect(resolveAlias('cyclopentyl methyl ether')?.cid).toBe(138539)
  })

  it('returns null for unknown / empty input', () => {
    expect(resolveAlias('NOT_A_REAL_COMPOUND')).toBeNull()
    expect(resolveAlias('')).toBeNull()
  })
})

describe('searchAliases', () => {
  it('finds entries by partial abbreviation', () => {
    const hits = searchAliases('TEMA')
    const names = hits.map((h) => h.canonicalName)
    expect(names).toContain('Tetrakis(ethylmethylamino)hafnium')
    expect(names).toContain('Tetrakis(ethylmethylamino)zirconium')
  })

  it('finds entries by partial canonical name', () => {
    const hits = searchAliases('octamethyl')
    expect(hits[0]?.formula).toBe('C8H24O4Si4')
  })

  it('respects the result limit', () => {
    expect(searchAliases('a', 2).length).toBeLessThanOrEqual(2)
  })

  it('returns [] for empty input', () => {
    expect(searchAliases('')).toEqual([])
  })
})
