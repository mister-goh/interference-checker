import { useState } from 'react'
import type { ElementPreset } from '../types'
import { ElementPicker } from './ElementPicker'

interface Props {
  presets: ElementPreset[]
  onSave: (name: string, symbols: string[], id?: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

/**
 * Create / edit / delete element presets (Phase 2). Rendered inside <Modal>.
 * Form state is local; persistence is delegated to the parent via onSave/onDelete.
 */
export function PresetManager({ presets, onSave, onDelete, onClose }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setSelected(new Set())
  }

  const beginEdit = (p: ElementPreset) => {
    setEditingId(p.id)
    setName(p.name)
    setSelected(new Set(p.symbols))
  }

  const toggle = (symbol: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(symbol)) next.delete(symbol)
      else next.add(symbol)
      return next
    })

  const canSave = selected.size > 0

  const handleSave = () => {
    if (!canSave) return
    onSave(name, [...selected], editingId ?? undefined)
    resetForm()
  }

  const handleDelete = (id: string) => {
    if (editingId === id) resetForm()
    onDelete(id)
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-app-strong text-base font-semibold">보증 원소 프리셋 관리</h2>
        <button
          type="button"
          className="glass-btn px-3 py-1 text-sm"
          onClick={onClose}
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-app text-xs font-medium px-1">프리셋 이름</label>
          <input
            type="text"
            className="glass-input px-4 py-2.5 w-full"
            placeholder="예: 보증 금속"
            value={name}
            onChange={(e) => setName(e.target.value)}
            spellCheck={false}
            aria-label="프리셋 이름"
          />
        </div>

        <ElementPicker
          selected={selected}
          onToggle={toggle}
          onClear={() => setSelected(new Set())}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="glass-btn-primary px-5 py-2 text-sm font-medium"
            onClick={handleSave}
            disabled={!canSave}
            style={!canSave ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
          >
            {editingId ? '수정 저장' : '새 프리셋 저장'}
          </button>
          {editingId && (
            <button
              type="button"
              className="glass-btn px-4 py-2 text-sm"
              onClick={resetForm}
            >
              새로 만들기
            </button>
          )}
          {!canSave && (
            <span className="text-app-faint text-xs">원소를 1개 이상 선택해 주세요.</span>
          )}
        </div>
      </div>

      {/* Saved presets */}
      {presets.length > 0 && (
        <div className="flex flex-col gap-2 pt-3 border-t border-app">
          <span className="text-app-muted text-xs">저장된 프리셋</span>
          {presets.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="text-app-strong text-sm font-medium whitespace-nowrap">
                {p.name}
              </span>
              <span className="text-app-faint text-xs font-mono truncate">
                {p.symbols.length}개 · {p.symbols.join(', ')}
              </span>
              <div className="ml-auto flex gap-1 flex-shrink-0">
                <button
                  type="button"
                  className="glass-btn px-3 py-1 text-xs"
                  onClick={() => beginEdit(p)}
                >
                  편집
                </button>
                <button
                  type="button"
                  className="glass-btn px-3 py-1 text-xs"
                  onClick={() => handleDelete(p.id)}
                  aria-label={`프리셋 삭제: ${p.name}`}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
