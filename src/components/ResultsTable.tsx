import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  functionalUpdate,
  type SortingState,
} from '@tanstack/react-table'
import type { Recommendation } from '../types'
import { StatusBadge } from './StatusBadge'
import {
  sortingFnElementSymbol,
  sortingFnElementName,
  sortingFnRecommendedMass,
} from '../lib/sorting'

interface Props {
  recommendations: Recommendation[]
  /** Unfiltered result count — distinguishes "no search yet" from "filtered to zero". */
  totalCount?: number
  selectedSymbol: string | null
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  onRowClick: (rec: Recommendation) => void
}

// Adapt simple (SortingState) => void prop to TanStack's OnChangeFn<SortingState>
// which passes an Updater<SortingState> (either a value or a value-producing fn).
function makeSortingChangeHandler(
  current: SortingState,
  handler: (s: SortingState) => void,
) {
  return (updater: Parameters<NonNullable<Parameters<typeof useReactTable>[0]['onSortingChange']>>[0]) => {
    handler(functionalUpdate(updater, current))
  }
}

const columnHelper = createColumnHelper<Recommendation>()

export function ResultsTable({
  recommendations,
  totalCount = 0,
  selectedSymbol,
  sorting,
  onSortingChange,
  onRowClick,
}: Props) {
  // Lightweight hover preview (follows the cursor; click opens the full modal)
  const [hover, setHover] = useState<{ rec: Recommendation; x: number; y: number } | null>(null)

  const columns = useMemo(
    () => [
      columnHelper.accessor('elementSymbol', {
        id: 'elementSymbol',
        header: '원소',
        cell: (info) => (
          <span className="font-mono font-semibold text-accent-strong">
            {info.getValue()}
          </span>
        ),
        // Shared comparator — must match applySorting() in lib/sorting.ts exactly
        // so the export file order matches the on-screen sort order.
        sortingFn: sortingFnElementSymbol,
      }),
      columnHelper.accessor('elementName', {
        id: 'elementName',
        header: '원소명',
        cell: (info) => (
          <span className="table-dim">{info.getValue()}</span>
        ),
        sortingFn: sortingFnElementName,
      }),
      columnHelper.accessor('recommendedMass', {
        id: 'recommendedMass',
        header: '추천 질량 (m/z)',
        cell: (info) => (
          <span className="font-mono">{info.getValue()}</span>
        ),
        // Shared comparator — must match applySorting() in lib/sorting.ts exactly.
        sortingFn: sortingFnRecommendedMass,
      }),
      columnHelper.accessor('abundance', {
        id: 'abundance',
        header: '존재비 (%)',
        cell: (info) => (
          <span className="table-dim">{info.getValue().toFixed(2)}</span>
        ),
        sortingFn: 'basic',
        enableSorting: false,
      }),
      columnHelper.accessor('status', {
        id: 'status',
        header: '판정',
        cell: (info) => <StatusBadge status={info.getValue()} />,
        enableSorting: false,
      }),
      columnHelper.accessor('recommendedMode', {
        id: 'recommendedMode',
        header: '권장 모드',
        cell: (info) => (
          <span className="table-dim text-xs font-mono">
            {info.getValue()}
          </span>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor('interferences', {
        id: 'interferences',
        header: '주요 간섭종',
        cell: (info) => {
          const list = info.getValue()
          if (list.length === 0) {
            return <span className="table-faint text-xs">없음</span>
          }
          const shown = list.slice(0, 2)
          return (
            <span className="table-dim text-xs font-mono">
              {shown.map((i) => i.composition).join(', ')}
              {list.length > 2 && (
                <span className="table-faint"> +{list.length - 2}건</span>
              )}
            </span>
          )
        },
        enableSorting: false,
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: recommendations,
    columns,
    state: { sorting },
    onSortingChange: makeSortingChangeHandler(sorting, onSortingChange),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Expose sorted row model so export can use the same order
    getRowId: (row) => row.elementSymbol,
  })

  if (recommendations.length === 0) {
    // Distinguish "no search yet" from "search ran but the filter hides everything".
    const filteredToZero = totalCount > 0
    return (
      <div className="glass-card p-8 flex flex-col items-center gap-3 text-center">
        <span className="text-4xl opacity-30">{filteredToZero ? '🔎' : '🔬'}</span>
        <p className="text-app-muted text-sm">
          {filteredToZero
            ? '현재 판정 필터에 해당하는 원소가 없습니다. 필터를 조정해 주세요.'
            : '화학식을 입력하고 계산을 누르면 전체 원소에 대한 간섭 분석 결과가 표시됩니다.'}
        </p>
      </div>
    )
  }

  return (
    <>
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table" aria-label="동위원소 간섭 분석 결과">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      className={canSort ? 'sortable' : ''}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      aria-sort={
                        sorted === 'asc'
                          ? 'ascending'
                          : sorted === 'desc'
                          ? 'descending'
                          : canSort
                          ? 'none'
                          : undefined
                      }
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {canSort && (
                          <span
                            className="table-faint text-xs"
                            aria-hidden="true"
                          >
                            {sorted === 'asc'
                              ? ' ▲'
                              : sorted === 'desc'
                              ? ' ▼'
                              : ' ⇅'}
                          </span>
                        )}
                      </span>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const isSelected = row.original.elementSymbol === selectedSymbol
              return (
                <tr
                  key={row.id}
                  className={isSelected ? 'selected' : ''}
                  onClick={() => onRowClick(row.original)}
                  onMouseEnter={(e) => setHover({ rec: row.original, x: e.clientX, y: e.clientY })}
                  onMouseMove={(e) => setHover({ rec: row.original, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setHover(null)}
                  aria-selected={isSelected}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 text-app-muted text-xs border-t border-app">
        {totalCount > recommendations.length
          ? `${recommendations.length}개 표시 (전체 ${totalCount}개 중) · `
          : `총 ${recommendations.length}개 원소 · `}
        행을 클릭하면 간섭 상세 정보를 볼 수 있습니다
      </div>
    </div>

    {hover && createPortal(
      <div
        className="glass-card px-3 py-2 text-xs pointer-events-none"
        style={{
          position: 'fixed',
          left: Math.min(hover.x + 14, window.innerWidth - 250),
          top: hover.y + 14,
          zIndex: 60,
          maxWidth: 236,
        }}
      >
        <div className="font-mono font-semibold text-accent-strong">
          {hover.rec.elementSymbol} · m/z {hover.rec.recommendedMass}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <StatusBadge status={hover.rec.status} />
          <span className="font-mono text-app-muted">{hover.rec.recommendedMode}</span>
        </div>
        <div className="text-app-faint mt-1">
          간섭 {hover.rec.interferences.length}건 · 클릭 시 상세
        </div>
      </div>,
      document.body,
    )}
    </>
  )
}

// Export the table's sorted row model for use by SheetJS export
// (same comparator as screen — prevents order mismatch)
export type { SortingState }
