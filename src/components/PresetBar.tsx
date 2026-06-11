import type { ElementPreset } from '../types'

interface Props {
  presets: ElementPreset[]
  activePresetId: string | null
  onActivate: (id: string | null) => void
  onOpenManager: () => void
}

/**
 * Guaranteed-element preset activator (Phase 2), shown above the results table.
 * Clicking a chip activates it (filters the table to its elements); clicking the
 * active chip deactivates it. Composes with the status filter.
 */
export function PresetBar({ presets, activePresetId, onActivate, onOpenManager }: Props) {
  const active = presets.find((p) => p.id === activePresetId) ?? null

  return (
    <div className="glass-card px-4 py-3 flex flex-wrap items-center gap-2">
      <span className="text-app-muted text-xs mr-1">보증 원소</span>

      {presets.length === 0 ? (
        <span className="text-app-faint text-xs">저장된 프리셋이 없습니다.</span>
      ) : (
        presets.map((p) => {
          const isActive = p.id === activePresetId
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onActivate(isActive ? null : p.id)}
              aria-pressed={isActive}
              className={`fav-chip${isActive ? ' active' : ''}`}
              title={`${p.name}: ${p.symbols.join(', ')}`}
            >
              {p.name}
              <span className="ml-1 font-mono text-xs">{p.symbols.length}</span>
            </button>
          )
        })
      )}

      <button
        type="button"
        onClick={onOpenManager}
        className="text-xs px-2 py-1 rounded-md border border-app text-app-muted hover:text-app cursor-pointer"
      >
        관리
      </button>

      {active && (
        <span className="ml-auto text-app-faint text-xs">
          프리셋: {active.name} · {active.symbols.length}개 원소
          <button
            type="button"
            onClick={() => onActivate(null)}
            className="ml-2 underline cursor-pointer"
          >
            해제
          </button>
        </span>
      )}
    </div>
  )
}
