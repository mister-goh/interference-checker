/**
 * src/lib/sorting.ts
 *
 * Shared sort comparators for the recommendations table.
 * Single source of truth consumed by BOTH:
 *   - ResultsTable column defs (sortingFn props) — prevents table/export drift
 *   - applySorting() used by export handlers in App.tsx
 *
 * TanStack Table sortingFn signature: (rowA, rowB, columnId) => number
 * Raw comparator signature: (a: Recommendation, b: Recommendation) => number
 *
 * Export handlers use the raw comparators via applySorting().
 * ResultsTable column defs use the TanStack wrappers (sortingFnElementSymbol,
 * sortingFnRecommendedMass).
 */

import type { Row } from '@tanstack/react-table'
import type { SortingState } from '@tanstack/react-table'
import type { Recommendation } from '../types'

// ── Raw comparators ───────────────────────────────────────────────────────────

/**
 * Compare two Recommendations by elementSymbol (alphanumeric, case-insensitive).
 * Matches TanStack's built-in 'alphanumeric' sortingFn behaviour.
 */
export function compareElementSymbol(
  a: Recommendation,
  b: Recommendation,
): number {
  return a.elementSymbol.localeCompare(b.elementSymbol, undefined, {
    sensitivity: 'base',
    numeric: true,
  })
}

/**
 * Compare two Recommendations by elementName (alphabetic, case-insensitive).
 */
export function compareElementName(
  a: Recommendation,
  b: Recommendation,
): number {
  return a.elementName.localeCompare(b.elementName, undefined, {
    sensitivity: 'base',
  })
}

/**
 * Compare two Recommendations by recommendedMass (numeric ascending).
 * Matches TanStack's built-in 'basic' sortingFn behaviour for numbers.
 */
export function compareRecommendedMass(
  a: Recommendation,
  b: Recommendation,
): number {
  return a.recommendedMass - b.recommendedMass
}

// ── TanStack sortingFn wrappers ───────────────────────────────────────────────
// Pass these directly to columnHelper.accessor({ sortingFn: ... }) in ResultsTable.

export function sortingFnElementSymbol(
  rowA: Row<Recommendation>,
  rowB: Row<Recommendation>,
): number {
  return compareElementSymbol(rowA.original, rowB.original)
}

export function sortingFnElementName(
  rowA: Row<Recommendation>,
  rowB: Row<Recommendation>,
): number {
  return compareElementName(rowA.original, rowB.original)
}

export function sortingFnRecommendedMass(
  rowA: Row<Recommendation>,
  rowB: Row<Recommendation>,
): number {
  return compareRecommendedMass(rowA.original, rowB.original)
}

// ── applySorting ──────────────────────────────────────────────────────────────

/**
 * Apply a TanStack SortingState to a Recommendation array.
 * Used by export handlers to reproduce the on-screen sort order without
 * accessing the table instance.
 *
 * Supported column ids: 'elementSymbol', 'elementName', 'recommendedMass'.
 * Unknown column ids are ignored (no-op for that column).
 */
export function applySorting(
  rows: Recommendation[],
  sorting: SortingState,
): Recommendation[] {
  if (sorting.length === 0) return rows
  const sorted = [...rows]
  sorted.sort((a, b) => {
    for (const col of sorting) {
      let cmp = 0
      if (col.id === 'elementSymbol') {
        cmp = compareElementSymbol(a, b)
      } else if (col.id === 'elementName') {
        cmp = compareElementName(a, b)
      } else if (col.id === 'recommendedMass') {
        cmp = compareRecommendedMass(a, b)
      }
      if (cmp !== 0) return col.desc ? -cmp : cmp
    }
    return 0
  })
  return sorted
}
