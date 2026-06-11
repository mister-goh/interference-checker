import type { RecommendationStatus } from '../types'
import { STATUS_LABELS, STATUS_CONFIG } from './StatusBadge'
import { STATUS_ORDER } from '../lib/filtering'

interface Props {
  counts: Record<RecommendationStatus, number>
  active: ReadonlySet<RecommendationStatus>
  total: number
  shown: number
  onToggle: (status: RecommendationStatus) => void
  onShowAll: () => void
  onCleanOnly: () => void
}

/**
 * Status-filter bar above the results table (Phase 2).
 * Each chip toggles one judgment status; counts come from the unfiltered set.
 * "전체" resets to all-on; "간섭 없음만" shows only clean elements.
 */
export function ResultFilter({
  counts,
  active,
  total,
  shown,
  onToggle,
  onShowAll,
  onCleanOnly,
}: Props) {
  const allActive = active.size === STATUS_ORDER.length

  return (
    <div className="glass-card px-4 py-3 flex flex-wrap items-center gap-2">
      <span className="text-app-muted text-xs mr-1">판정 필터</span>

      {STATUS_ORDER.map((status) => {
        const isActive = active.has(status)
        return (
          <button
            key={status}
            type="button"
            onClick={() => onToggle(status)}
            aria-pressed={isActive}
            className={`${STATUS_CONFIG[status].className} cursor-pointer transition-opacity ${
              isActive ? '' : 'opacity-35 line-through'
            }`}
            title={`${STATUS_LABELS[status]} ${counts[status]}개 ${isActive ? '숨기기' : '표시'}`}
          >
            {STATUS_LABELS[status]}
            <span className="ml-1 font-mono">{counts[status]}</span>
          </button>
        )
      })}

      <span className="mx-1 h-4 w-px bg-app" aria-hidden="true" />

      <button
        type="button"
        onClick={onShowAll}
        disabled={allActive}
        className="text-xs px-2 py-1 rounded-md border border-app text-app-muted hover:text-app disabled:opacity-40 disabled:cursor-default cursor-pointer"
      >
        전체
      </button>
      <button
        type="button"
        onClick={onCleanOnly}
        className="text-xs px-2 py-1 rounded-md border border-app text-app-muted hover:text-app cursor-pointer"
      >
        간섭 없음만
      </button>

      <span className="ml-auto text-app-faint text-xs font-mono">
        표시 {shown} / 전체 {total}
      </span>
    </div>
  )
}
