/**
 * src/lib/presets.test.ts
 *
 * Unit tests for element-preset localStorage management (Phase 2).
 * Mirrors the favorites test patterns in lib.test.ts.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadPresets,
  addPreset,
  updatePreset,
  removePreset,
  PRESET_STORAGE_KEY,
  PRESET_MAX_COUNT,
} from './presets'
import type { ElementPreset } from '../types'
import { PRESETS_SCHEMA_VERSION } from '../types'

// ── localStorage mock ─────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

function makePreset(name: string, symbols: string[], id?: string): ElementPreset {
  return {
    schemaVersion: PRESETS_SCHEMA_VERSION,
    id: id ?? `test-${name}`,
    name,
    symbols,
    savedAt: new Date().toISOString(),
  }
}

beforeEach(() => localStorageMock.clear())

// ── loadPresets ─────────────────────────────────────────────────────────────

describe('loadPresets', () => {
  it('returns [] when key is missing', () => {
    expect(loadPresets()).toEqual([])
  })

  it('returns [] on malformed JSON', () => {
    localStorageMock.setItem(PRESET_STORAGE_KEY, '{not json')
    expect(loadPresets()).toEqual([])
  })

  it('returns [] when stored value is not an array', () => {
    localStorageMock.setItem(PRESET_STORAGE_KEY, JSON.stringify({ a: 1 }))
    expect(loadPresets()).toEqual([])
  })

  it('drops entries with wrong schema version', () => {
    const good = makePreset('보증 금속', ['Fe', 'Cu'])
    const bad = { ...makePreset('x', ['Na']), schemaVersion: 999 }
    localStorageMock.setItem(PRESET_STORAGE_KEY, JSON.stringify([good, bad]))
    const loaded = loadPresets()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].name).toBe('보증 금속')
  })

  it('drops entries whose symbols is not a string array', () => {
    const bad = { ...makePreset('x', ['Na']), symbols: [1, 2, 3] }
    localStorageMock.setItem(PRESET_STORAGE_KEY, JSON.stringify([bad]))
    expect(loadPresets()).toEqual([])
  })
})

// ── addPreset ─────────────────────────────────────────────────────────────────

describe('addPreset', () => {
  it('adds a preset and persists it', () => {
    const { presets, error } = addPreset([], '보증 금속', ['Fe', 'Cu'])
    expect(error).toBeUndefined()
    expect(presets).toHaveLength(1)
    expect(presets[0].symbols).toEqual(['Fe', 'Cu'])
    expect(loadPresets()[0].name).toBe('보증 금속')
  })

  it('rejects an empty symbol set with a Korean error', () => {
    const { presets, error } = addPreset([], '빈 세트', [])
    expect(presets).toEqual([])
    expect(error).toBe('원소를 1개 이상 선택해 주세요.')
  })

  it('falls back to the first symbol when name is blank', () => {
    const { presets } = addPreset([], '   ', ['Na', 'K'])
    expect(presets[0].name).toBe('Na')
  })

  it('de-duplicates and trims symbols, preserving order', () => {
    const { presets } = addPreset([], 's', [' Fe ', 'Cu', 'Fe', ''])
    expect(presets[0].symbols).toEqual(['Fe', 'Cu'])
  })

  it('replaces an existing preset with the same name (dedup by name)', () => {
    const first = addPreset([], 'set', ['Fe']).presets
    const second = addPreset(first, 'set', ['Cu', 'Ni']).presets
    expect(second).toHaveLength(1)
    expect(second[0].symbols).toEqual(['Cu', 'Ni'])
  })

  it('prepends newest first', () => {
    const a = addPreset([], 'A', ['Fe']).presets
    const b = addPreset(a, 'B', ['Cu']).presets
    expect(b.map((p) => p.name)).toEqual(['B', 'A'])
  })

  it('enforces PRESET_MAX_COUNT', () => {
    let presets: ElementPreset[] = []
    for (let i = 0; i < PRESET_MAX_COUNT + 5; i++) {
      presets = addPreset(presets, `set-${i}`, ['Fe']).presets
    }
    expect(presets).toHaveLength(PRESET_MAX_COUNT)
  })
})

// ── updatePreset ──────────────────────────────────────────────────────────────

describe('updatePreset', () => {
  it('updates name and symbols by id', () => {
    const base = [makePreset('old', ['Fe'], 'id-1')]
    const { presets, error } = updatePreset(base, 'id-1', {
      name: 'new',
      symbols: ['Cu', 'Ni'],
    })
    expect(error).toBeUndefined()
    expect(presets[0].name).toBe('new')
    expect(presets[0].symbols).toEqual(['Cu', 'Ni'])
  })

  it('is a no-op when id is unknown', () => {
    const base = [makePreset('old', ['Fe'], 'id-1')]
    const { presets } = updatePreset(base, 'missing', { name: 'x' })
    expect(presets).toEqual(base)
  })

  it('rejects clearing symbols to empty with a Korean error', () => {
    const base = [makePreset('old', ['Fe'], 'id-1')]
    const { presets, error } = updatePreset(base, 'id-1', { symbols: [] })
    expect(presets).toEqual(base)
    expect(error).toBe('원소를 1개 이상 선택해 주세요.')
  })

  it('keeps the previous name when the new name is blank', () => {
    const base = [makePreset('keep', ['Fe'], 'id-1')]
    const { presets } = updatePreset(base, 'id-1', { name: '   ' })
    expect(presets[0].name).toBe('keep')
  })
})

// ── removePreset ──────────────────────────────────────────────────────────────

describe('removePreset', () => {
  it('removes by id and persists', () => {
    const base = [
      makePreset('a', ['Fe'], 'id-1'),
      makePreset('b', ['Cu'], 'id-2'),
    ]
    localStorageMock.setItem(PRESET_STORAGE_KEY, JSON.stringify(base))
    const out = removePreset(base, 'id-1')
    expect(out.map((p) => p.id)).toEqual(['id-2'])
    expect(loadPresets().map((p) => p.id)).toEqual(['id-2'])
  })

  it('is a no-op when id is unknown', () => {
    const base = [makePreset('a', ['Fe'], 'id-1')]
    expect(removePreset(base, 'missing')).toEqual(base)
  })
})
