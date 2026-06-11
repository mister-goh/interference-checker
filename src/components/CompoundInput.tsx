import React, { useState, useCallback } from 'react'
import type { FavoriteCompound } from '../types'
import { PubChemSearch } from './PubChemSearch'

interface ParsePreview {
  ok: boolean
  composition: Record<string, number>
  errorMessage?: string
}

interface Props {
  formula: string
  compoundName: string
  parsePreview: ParsePreview | null
  favorites: FavoriteCompound[]
  onFormulaChange: (formula: string) => void
  onNameChange: (name: string) => void
  onSearch: () => void
  onReset: () => void
  onFavoriteSelect: (fav: FavoriteCompound) => void
  onFavoriteSave: () => void
  onFavoriteDelete: (id: string) => void
  onRequestManualElements: () => void
  activeFormulaId: string | null // matches a favorite id if a chip is active
}

export function CompoundInput({
  formula,
  compoundName,
  parsePreview,
  favorites,
  onFormulaChange,
  onNameChange,
  onSearch,
  onReset,
  onFavoriteSelect,
  onFavoriteSave,
  onFavoriteDelete,
  onRequestManualElements,
  activeFormulaId,
}: Props) {
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') onSearch()
    },
    [onSearch],
  )

  const handleReset = useCallback(() => {
    onReset()
    setShowSaveForm(false)
    setResetKey((k) => k + 1) // remount PubChemSearch to clear its internal state
  }, [onReset])

  // 구성 원소 = element symbols only (no stoichiometric counts)
  const elementsDisplay =
    parsePreview?.ok && Object.keys(parsePreview.composition).length > 0
      ? Object.keys(parsePreview.composition).join(' · ')
      : null

  const hasFormula = formula.trim() !== ''

  return (
    <section className="glass-card p-5 flex flex-col gap-4">
      {/* 1. PubChem search */}
      <PubChemSearch
        key={resetKey}
        onSelect={(f, name) => {
          onFormulaChange(f)
          onNameChange(name)
        }}
        onRequestManualElements={onRequestManualElements}
      />

      {/* 2. 선택된 화합물 — search or manual result + calculate */}
      {hasFormula && (
        <div className="flex flex-col gap-3 pt-1 border-t border-app">
          {/* Elements */}
          <div className="px-1 min-h-[1.25rem]">
            {parsePreview?.ok && elementsDisplay ? (
              <p className="text-accent text-xs">
                구성 원소: <span className="font-mono">{elementsDisplay}</span>
              </p>
            ) : parsePreview && !parsePreview.ok ? (
              <p className="text-err text-xs" role="alert">
                {parsePreview.errorMessage ?? '화학식을 인식할 수 없습니다.'}
              </p>
            ) : null}
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-app text-xs font-medium px-1">물질명</label>
            <input
              type="text"
              className="glass-input px-4 py-2.5 w-full"
              placeholder="예: HfCl4, 3DMAS"
              value={compoundName}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="물질명 입력"
              spellCheck={false}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              className="glass-btn-primary flex-1 px-5 py-2.5 text-sm font-medium"
              onClick={onSearch}
              disabled={!parsePreview?.ok}
              style={!parsePreview?.ok ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
              aria-label="간섭 계산 시작"
            >
              계산
            </button>
            <button
              className="glass-btn px-4 py-2.5 text-sm"
              onClick={handleReset}
              title="검색·입력 초기화"
              aria-label="초기화"
            >
              초기화
            </button>
            <button
              className="glass-btn px-3 py-2.5 text-sm"
              onClick={() => setShowSaveForm((v) => !v)}
              disabled={!parsePreview?.ok}
              style={!parsePreview?.ok ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
              title="즐겨찾기에 저장"
              aria-label="즐겨찾기 저장"
            >
              ☆
            </button>
          </div>
        </div>
      )}

      {/* Save-to-favorites inline form */}
      {hasFormula && showSaveForm && parsePreview?.ok && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1 border-t border-app">
          <span className="text-app text-xs whitespace-nowrap">즐겨찾기 저장:</span>
          <span className="text-accent-strong text-sm font-mono">
            {compoundName || formula} ({formula})
          </span>
          <div className="flex gap-2 ml-auto">
            <button
              className="glass-btn-primary px-4 py-1.5 text-xs"
              onClick={() => {
                onFavoriteSave()
                setShowSaveForm(false)
              }}
            >
              저장
            </button>
            <button
              className="glass-btn px-4 py-1.5 text-xs"
              onClick={() => setShowSaveForm(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 4. Favorites chips */}
      {favorites.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-app">
          <span className="text-app-muted text-xs self-center whitespace-nowrap">
            즐겨찾기
          </span>
          {favorites.map((fav) => (
            <span
              key={fav.id}
              className={`fav-chip${activeFormulaId === fav.id ? ' active' : ''}`}
              onClick={() => onFavoriteSelect(fav)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onFavoriteSelect(fav)}
              aria-label={`즐겨찾기 선택: ${fav.name}`}
            >
              {fav.name}
              <button
                className="fav-chip-delete ml-1"
                onClick={(e) => {
                  e.stopPropagation()
                  onFavoriteDelete(fav.id)
                }}
                aria-label={`즐겨찾기 삭제: ${fav.name}`}
                title="삭제"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
