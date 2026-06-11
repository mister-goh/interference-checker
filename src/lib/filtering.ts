/**
 * src/lib/filtering.ts
 *
 * Pure status-filter logic for the results table (Phase 2).
 * Kept UI-free so it can be unit-tested without React.
 */

import type { Recommendation, RecommendationStatus } from '../types'

/** Canonical display order for status chips (best → worst). */
export const STATUS_ORDER: readonly RecommendationStatus[] = [
  'clean',
  'avoidable',
  'mode-required',
  'difficult',
  'not-analyzable',
]

/** Keep only recommendations whose status is in the active set. */
export function filterByStatus(
  recs: Recommendation[],
  active: ReadonlySet<RecommendationStatus>,
): Recommendation[] {
  return recs.filter((r) => active.has(r.status))
}

/**
 * Keep only recommendations whose element is in the given symbol set.
 * Pass `null` to apply no element filter (returns the list unchanged).
 * Composes with filterByStatus — the two filters are orthogonal.
 */
export function filterByElements(
  recs: Recommendation[],
  symbols: ReadonlySet<string> | null,
): Recommendation[] {
  if (!symbols) return recs
  return recs.filter((r) => symbols.has(r.elementSymbol))
}

/** Count recommendations per status (every status key present, 0 when absent). */
export function countByStatus(
  recs: Recommendation[],
): Record<RecommendationStatus, number> {
  const counts: Record<RecommendationStatus, number> = {
    clean: 0,
    avoidable: 0,
    'mode-required': 0,
    difficult: 0,
    'not-analyzable': 0,
  }
  for (const r of recs) counts[r.status]++
  return counts
}
