import { useMemo, useState } from 'react'
import { ELEMENTS } from '../data/isotopes'
import {
  PERIODIC_LAYOUT,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type ElementCategory,
} from '../data/periodic-table'

interface Cell {
  symbol: string
  name: string
  atomicNumber: number
  measurable: boolean
  period: number
  group: number
  category: ElementCategory
}

// Join dataset elements with their layout coordinates once.
const CELLS: Cell[] = ELEMENTS.flatMap((el) => {
  const layout = PERIODIC_LAYOUT[el.symbol]
  if (!layout) return []
  return [
    {
      symbol: el.symbol,
      name: el.name,
      atomicNumber: el.atomicNumber,
      measurable: el.icpmsMeasurable,
      period: layout.period,
      group: layout.group,
      category: layout.category,
    },
  ]
})

const MAIN_CELLS = CELLS.filter((c) => c.period <= 7)
const F_BLOCK_CELLS = CELLS.filter((c) => c.period >= 9) // 9 = lanthanide, 10 = actinide

interface Props {
  selected: ReadonlySet<string>
  onToggle: (symbol: string) => void
  onClear: () => void
  onConfirm?: () => void
  // When true, every element is selectable (incl. ICP-MS non-measurable ones
  // like Cl) — used when defining a compound by its constituent elements.
  allowAll?: boolean
}

function ElementCell({
  cell,
  isSelected,
  onToggle,
  row,
  selectable,
}: {
  cell: Cell
  isSelected: boolean
  onToggle: (symbol: string) => void
  row: number
  selectable: boolean
}) {
  return (
    <button
      type="button"
      disabled={!selectable}
      onClick={() => onToggle(cell.symbol)}
      aria-pressed={selectable ? isSelected : undefined}
      aria-label={`${cell.name} (${cell.symbol})${selectable ? '' : ' — ICP-MS 분석 대상 아님'}`}
      title={selectable ? cell.name : `${cell.name} · ICP-MS 분석 대상 아님`}
      className={`ptab-cell ptab-${cell.category}${isSelected ? ' selected' : ''}`}
      style={{ gridColumn: cell.group, gridRow: row }}
    >
      <span className="ptab-z">{cell.atomicNumber}</span>
      <span className="ptab-sym">{cell.symbol}</span>
      {isSelected && <span className="ptab-check" aria-hidden="true">✓</span>}
    </button>
  )
}

/**
 * Periodic-table element selector (Phase 2 preset builder).
 * Faithful group/period layout with category coloring. Non-measurable
 * precursor elements are shown but disabled. Controlled — parent owns the set.
 */
export function ElementPicker({ selected, onToggle, onClear, onConfirm, allowAll = false }: Props) {
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false)
  const gridStyle = useMemo(
    () => ({ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }),
    [],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-app-muted text-xs">{selected.size}개 선택됨</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="glass-btn px-3 py-1 text-xs"
            onClick={() => setClearConfirmVisible(true)}
            disabled={selected.size === 0}
            style={selected.size === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
          >
            전체 해제
          </button>
          {onConfirm && (
            <button
              type="button"
              className="glass-btn-primary px-4 py-1 text-xs font-medium"
              onClick={onConfirm}
            >
              확인
            </button>
          )}
        </div>
      </div>

      {clearConfirmVisible && (
        <div className="flex items-center justify-between rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm">
          <span className="text-app-strong">선택한 원소를 전체 해제하시겠습니까?</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="glass-btn px-3 py-1 text-xs"
              onClick={() => setClearConfirmVisible(false)}
            >
              취소
            </button>
            <button
              type="button"
              className="glass-btn px-3 py-1 text-xs text-red-400"
              onClick={() => { onClear(); setClearConfirmVisible(false) }}
            >
              전체 해제
            </button>
          </div>
        </div>
      )}

      {/* Horizontal scroll on narrow screens; table keeps its proportions. */}
      <div className="overflow-x-auto pb-1">
        <div className="flex flex-col gap-1.5" style={{ minWidth: '960px' }}>
          {/* Main block (periods 1–7) */}
          <div className="grid gap-1.5" style={gridStyle}>
            {MAIN_CELLS.map((cell) => (
              <ElementCell
                key={cell.symbol}
                cell={cell}
                isSelected={selected.has(cell.symbol)}
                onToggle={onToggle}
                row={cell.period}
                selectable={allowAll || cell.measurable}
              />
            ))}
          </div>

          {/* f-block (lanthanides row 1, actinides row 2) */}
          <div className="grid gap-1.5" style={gridStyle}>
            {F_BLOCK_CELLS.map((cell) => (
              <ElementCell
                key={cell.symbol}
                cell={cell}
                isSelected={selected.has(cell.symbol)}
                onToggle={onToggle}
                row={cell.period === 9 ? 1 : 2}
                selectable={allowAll || cell.measurable}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1">
        {CATEGORY_ORDER.map((cat) => (
          <span key={cat} className="inline-flex items-center gap-1.5 text-app-muted text-xs">
            <span
              className={`ptab-${cat}`}
              style={{ width: '1rem', height: '1rem', borderRadius: '0.2rem', display: 'inline-block' }}
              aria-hidden="true"
            />
            {CATEGORY_LABELS[cat]}
          </span>
        ))}
      </div>
      <p className="text-app-faint text-xs">
        {allowAll
          ? '모든 원소를 선택할 수 있습니다 (ICP-MS 비대상 원소 포함).'
          : '회색(비활성) 원소는 ICP-MS 분석 대상이 아니어서 선택할 수 없습니다.'}
      </p>
    </div>
  )
}
