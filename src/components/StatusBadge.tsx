import type { RecommendationStatus } from '../types'

/** Single source of truth for Korean status labels — used by badge, DetailPanel, and export. */
export const STATUS_LABELS: Record<RecommendationStatus, string> = {
  clean:            '간섭 없음',
  avoidable:        '회피 가능',
  'mode-required':  '모드 필요',
  difficult:        '분석 곤란',
  'not-analyzable': '분석 불가',
}

/** Status → badge CSS class. Exported so filter chips reuse identical colors. */
export const STATUS_CONFIG: Record<
  RecommendationStatus,
  { className: string }
> = {
  clean:            { className: 'badge badge-clean' },
  avoidable:        { className: 'badge badge-avoidable' },
  'mode-required':  { className: 'badge badge-mode-required' },
  difficult:        { className: 'badge badge-difficult' },
  'not-analyzable': { className: 'badge badge-not-analyzable' },
}

interface Props {
  status: RecommendationStatus
}

export function StatusBadge({ status }: Props) {
  const { className } = STATUS_CONFIG[status]
  return <span className={className}>{STATUS_LABELS[status]}</span>
}
