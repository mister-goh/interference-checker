/**
 * src/lib/custom-congeners.ts
 *
 * localStorage persistence for user-defined custom congener impurities —
 * a map of element symbol → impurity percentage (0 < pct ≤ 100).
 *
 * Versioned key + validation, mirroring lib/favorites.ts and lib/theme.ts.
 * Only measurable elements are accepted (the picker enforces this; load also
 * guards against stale/invalid entries).
 */

import { ELEMENTS } from '../data/isotopes'

export const CUSTOM_CONGENER_STORAGE_KEY = 'isotope-custom-congeners-v1'

const MEASURABLE = new Set(
  ELEMENTS.filter((e) => e.icpmsMeasurable).map((e) => e.symbol),
)

/**
 * Load custom congeners from localStorage. Returns {} on any error / missing key.
 * Drops entries whose value is out of range or whose symbol is not measurable.
 */
export function loadCustomCongeners(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CUSTOM_CONGENER_STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {}
    }
    const out: Record<string, number> = {}
    for (const [sym, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (
        typeof v === 'number' &&
        Number.isFinite(v) &&
        v > 0 &&
        v <= 100 &&
        MEASURABLE.has(sym)
      ) {
        out[sym] = v
      }
    }
    return out
  } catch {
    return {}
  }
}

/** Persist custom congeners. Best-effort — silently ignores quota/availability errors. */
export function saveCustomCongeners(map: Record<string, number>): void {
  try {
    localStorage.setItem(CUSTOM_CONGENER_STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* localStorage unavailable — keep in-memory only for this session */
  }
}
