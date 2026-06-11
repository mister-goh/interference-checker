/**
 * src/lib/custom-congeners.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadCustomCongeners,
  saveCustomCongeners,
  CUSTOM_CONGENER_STORAGE_KEY,
} from './custom-congeners'

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

beforeEach(() => localStorageMock.clear())

describe('custom congeners persistence', () => {
  it('returns {} when key is missing', () => {
    expect(loadCustomCongeners()).toEqual({})
  })

  it('round-trips a valid map', () => {
    saveCustomCongeners({ W: 1.5, Mo: 0.3 })
    expect(loadCustomCongeners()).toEqual({ W: 1.5, Mo: 0.3 })
  })

  it('returns {} on malformed JSON', () => {
    localStorageMock.setItem(CUSTOM_CONGENER_STORAGE_KEY, '{bad')
    expect(loadCustomCongeners()).toEqual({})
  })

  it('returns {} when stored value is not an object', () => {
    localStorageMock.setItem(CUSTOM_CONGENER_STORAGE_KEY, JSON.stringify([1, 2]))
    expect(loadCustomCongeners()).toEqual({})
  })

  it('drops out-of-range values (≤0 or >100)', () => {
    localStorageMock.setItem(
      CUSTOM_CONGENER_STORAGE_KEY,
      JSON.stringify({ W: 0, Mo: 150, Ta: 2 }),
    )
    expect(loadCustomCongeners()).toEqual({ Ta: 2 })
  })

  it('drops non-measurable / unknown symbols', () => {
    localStorageMock.setItem(
      CUSTOM_CONGENER_STORAGE_KEY,
      JSON.stringify({ O: 1, Cl: 1, Zz: 1, Zr: 2 }),
    )
    // O and Cl are precursors (not measurable), Zz is unknown
    expect(loadCustomCongeners()).toEqual({ Zr: 2 })
  })
})
