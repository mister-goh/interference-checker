import { useState } from 'react'
import type { SavedAnalysis } from '../types'

interface Props {
  analyses: SavedAnalysis[]
  canSave: boolean
  defaultName: string
  onSave: (name: string) => void
  onRestore: (analysis: SavedAnalysis) => void
  onDelete: (id: string) => void
}

function formatDate(iso: string): string {
  // ISO → "MM-DD HH:mm" (local), defensive against bad strings
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * Saved-analysis panel (sidebar): snapshot the current full analysis state and
 * restore it later. Inputs only — results are recomputed on restore.
 */
export function SavedAnalysisPanel({
  analyses,
  canSave,
  defaultName,
  onSave,
  onRestore,
  onDelete,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')

  const beginSave = () => {
    setName(defaultName)
    setShowForm(true)
  }

  const confirmSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
    setShowForm(false)
    setName('')
  }

  return (
    <section className="glass-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col leading-tight">
          <h2 className="text-app-strong text-sm font-semibold">저장된 분석</h2>
          <span className="text-app-faint text-xs">
            물질·모드·프리셋·동족 설정을 통째로 저장
          </span>
        </div>
        {!showForm && (
          <button
            type="button"
            className="glass-btn-primary px-3 py-1.5 text-xs font-medium whitespace-nowrap"
            onClick={beginSave}
            disabled={!canSave}
            style={!canSave ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
            title={canSave ? '현재 분석 저장' : '화학식을 먼저 입력하세요'}
          >
            현재 분석 저장
          </button>
        )}
      </div>

      {showForm && (
        <div className="flex flex-col gap-2 border-t border-app pt-3">
          <input
            type="text"
            className="glass-input px-3 py-2 w-full text-sm"
            placeholder="분석 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmSave()
              if (e.key === 'Escape') setShowForm(false)
            }}
            aria-label="저장할 분석 이름"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="glass-btn-primary px-4 py-1.5 text-xs"
              onClick={confirmSave}
              disabled={!name.trim()}
              style={!name.trim() ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
            >
              저장
            </button>
            <button
              type="button"
              className="glass-btn px-4 py-1.5 text-xs"
              onClick={() => setShowForm(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-app pt-3">
        {analyses.length === 0 ? (
          <p className="text-app-faint text-xs">저장된 분석이 없습니다.</p>
        ) : (
          analyses.map((a) => (
            <div key={a.id} className="flex items-center gap-2">
              <div className="flex flex-col min-w-0">
                <span className="text-app text-sm font-medium truncate">{a.name}</span>
                <span className="text-app-faint text-xs font-mono truncate">
                  {a.formula || '(화학식 없음)'} · {formatDate(a.savedAt)}
                </span>
              </div>
              <div className="ml-auto flex gap-1 flex-shrink-0">
                <button
                  type="button"
                  className="glass-btn px-3 py-1 text-xs"
                  onClick={() => onRestore(a)}
                >
                  열기
                </button>
                <button
                  type="button"
                  className="glass-btn px-2 py-1 text-xs"
                  onClick={() => onDelete(a.id)}
                  aria-label={`삭제: ${a.name}`}
                  title="삭제"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
