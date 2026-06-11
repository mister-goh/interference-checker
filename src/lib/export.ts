/**
 * src/lib/export.ts
 *
 * SheetJS-based CSV and Excel export for the recommendations table.
 *
 * IMPORTANT — sort-order contract:
 *   The caller must pass `rows` as the already-sorted Recommendation array
 *   from the TanStack table instance:
 *     table.getRowModel().rows.map(r => r.original)
 *   This guarantees the exported file matches the on-screen row order exactly.
 *   No re-sort is applied here; this function is order-preserving.
 */

import * as XLSX from 'xlsx';
import type { Recommendation } from '../types';
import { STATUS_LABELS } from '../components/StatusBadge';

// ── Column definitions ────────────────────────────────────────────────────────

/** Headers match the ResultsTable column labels exactly. */
const HEADERS = [
  '원소',
  '추천 질량 (m/z)',
  '존재비 (%)',
  '판정',
  '권장 모드',
  '주요 간섭종',
] as const;

// ── Row serialiser ────────────────────────────────────────────────────────────

function toRow(rec: Recommendation): (string | number)[] {
  const interferenceStr =
    rec.interferences.length === 0
      ? '없음'
      : rec.interferences.map((i) => i.composition).join(', ');

  return [
    rec.elementSymbol,
    rec.recommendedMass,
    parseFloat(rec.abundance.toFixed(2)),
    STATUS_LABELS[rec.status],
    rec.recommendedMode,
    interferenceStr,
  ];
}

// ── Sheet builder ─────────────────────────────────────────────────────────────

/**
 * Build a SheetJS worksheet from an ordered Recommendation array.
 * Row order is preserved as-is (caller is responsible for sort order).
 */
export function buildSheet(rows: Recommendation[]): XLSX.WorkSheet {
  const data: (string | number)[][] = [
    [...HEADERS],
    ...rows.map(toRow),
  ];
  return XLSX.utils.aoa_to_sheet(data);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Trigger a CSV download of the recommendations table.
 *
 * @param rows    Pre-sorted recommendations (same order as on-screen table).
 * @param filename  Download filename without extension (default: 'isotope-results').
 */
export function exportCsv(
  rows: Recommendation[],
  filename = 'isotope-results',
): void {
  const ws = buildSheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Results');
  XLSX.writeFile(wb, `${filename}.csv`, { bookType: 'csv' });
}

/**
 * Trigger an Excel (.xlsx) download of the recommendations table.
 *
 * @param rows    Pre-sorted recommendations (same order as on-screen table).
 * @param filename  Download filename without extension (default: 'isotope-results').
 */
export function exportExcel(
  rows: Recommendation[],
  filename = 'isotope-results',
): void {
  const ws = buildSheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Results');
  XLSX.writeFile(wb, `${filename}.xlsx`, { bookType: 'xlsx' });
}
