/**
 * src/lib/saved-analyses.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadSavedAnalyses,
  addSavedAnalysis,
  removeSavedAnalysis,
  renameSavedAnalysis,
  SAVED_ANALYSIS_STORAGE_KEY,
  SAVED_ANALYSIS_MAX_COUNT,
} from './saved-analyses'
import type { SavedAnalysis } from '../types'
import { SAVED_ANALYSIS_SCHEMA_VERSION } from '../types'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v
    },
    removeItem: (k: string) => {
      delete store[k]
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

function make(name: string, id = `id-${name}`): SavedAnalysis {
  return {
    schemaVersion: SAVED_ANALYSIS_SCHEMA_VERSION,
    id,
    name,
    savedAt: new Date().toISOString(),
    formula: 'HfCl4',
    compoundName: 'Hafnium tetrachloride',
    matrix: { Ar: true, H: true, N: true, O: true, C: false, Cl: true },
    caps: { KED: false, DRC: { NH3: true, O2: false, H2: false } },
    congenerEnabled: true,
    congenerOverrides: { Zr: 1.5 },
    customCongeners: { W: 1 },
    activePresetId: null,
    activeStatuses: ['clean', 'avoidable'],
    sorting: [{ id: 'elementSymbol', desc: false }],
  }
}

beforeEach(() => localStorageMock.clear())

describe('loadSavedAnalyses', () => {
  it('returns [] when key is missing', () => {
    expect(loadSavedAnalyses()).toEqual([])
  })

  it('returns [] on malformed JSON', () => {
    localStorageMock.setItem(SAVED_ANALYSIS_STORAGE_KEY, '{bad')
    expect(loadSavedAnalyses()).toEqual([])
  })

  it('drops entries failing schema validation', () => {
    const good = make('good')
    const bad = { ...make('bad'), matrix: 'nope' }
    localStorageMock.setItem(SAVED_ANALYSIS_STORAGE_KEY, JSON.stringify([good, bad]))
    const loaded = loadSavedAnalyses()
    expect(loaded.map((a) => a.name)).toEqual(['good'])
  })

  it('round-trips a saved analysis', () => {
    addSavedAnalysis([], make('A'))
    const loaded = loadSavedAnalyses()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].congenerOverrides).toEqual({ Zr: 1.5 })
    expect(loaded[0].activeStatuses).toEqual(['clean', 'avoidable'])
  })
})

describe('addSavedAnalysis', () => {
  it('rejects a blank name', () => {
    const { analyses, error } = addSavedAnalysis([], make('   '))
    expect(analyses).toEqual([])
    expect(error).toBe('분석 이름을 입력해 주세요.')
  })

  it('prepends newest-first', () => {
    const a = addSavedAnalysis([], make('A')).analyses
    const b = addSavedAnalysis(a, make('B')).analyses
    expect(b.map((x) => x.name)).toEqual(['B', 'A'])
  })

  it('replaces an existing entry with the same name', () => {
    const first = addSavedAnalysis([], make('set', 'id1')).analyses
    const second = addSavedAnalysis(first, make('set', 'id2')).analyses
    expect(second).toHaveLength(1)
    expect(second[0].id).toBe('id2')
  })

  it('enforces SAVED_ANALYSIS_MAX_COUNT', () => {
    let list: SavedAnalysis[] = []
    for (let i = 0; i < SAVED_ANALYSIS_MAX_COUNT + 3; i++) {
      list = addSavedAnalysis(list, make(`a-${i}`, `id-${i}`)).analyses
    }
    expect(list).toHaveLength(SAVED_ANALYSIS_MAX_COUNT)
  })
})

describe('removeSavedAnalysis / renameSavedAnalysis', () => {
  it('removes by id and persists', () => {
    const list = [make('A', 'id1'), make('B', 'id2')]
    localStorageMock.setItem(SAVED_ANALYSIS_STORAGE_KEY, JSON.stringify(list))
    const out = removeSavedAnalysis(list, 'id1')
    expect(out.map((a) => a.id)).toEqual(['id2'])
    expect(loadSavedAnalyses().map((a) => a.id)).toEqual(['id2'])
  })

  it('renames by id', () => {
    const list = [make('old', 'id1')]
    const { analyses } = renameSavedAnalysis(list, 'id1', 'new')
    expect(analyses[0].name).toBe('new')
  })

  it('rejects a blank rename', () => {
    const list = [make('old', 'id1')]
    const { analyses, error } = renameSavedAnalysis(list, 'id1', '  ')
    expect(analyses).toEqual(list)
    expect(error).toBe('분석 이름을 입력해 주세요.')
  })
})
