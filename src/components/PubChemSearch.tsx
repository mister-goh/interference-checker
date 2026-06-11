import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { searchAutocomplete, fetchByName, PubChemError } from '../lib/pubchem'
import type { PubChemCompound } from '../lib/pubchem'
import { resolveAlias, searchAliases } from '../data/compound-aliases'
import type { CompoundAlias } from '../data/compound-aliases'
import { parseFormula, FormulaParseError } from '../engine/formula-parser'
import { looksLikeFormula } from '../lib/formula-detect'

interface Props {
  onSelect: (formula: string, name: string) => void
  onRequestManualElements: () => void
}

// Autocomplete entry — either a built-in alias (offline) or a PubChem name.
type Suggestion =
  | { source: 'alias'; label: string; alias: CompoundAlias }
  | { source: 'pubchem'; label: string; name: string }

export function PubChemSearch({ onSelect, onRequestManualElements }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isLoadingSugg, setIsLoadingSugg] = useState(false)
  const [isLoadingCompound, setIsLoadingCompound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resolved, setResolved] = useState<PubChemCompound | null>(null)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)

  // Track input position so the portal dropdown can render above sibling cards
  const updateRect = useCallback(() => {
    if (inputRef.current) setRect(inputRef.current.getBoundingClientRect())
  }, [])

  useEffect(() => {
    if (!dropdownOpen) return
    updateRect()
    window.addEventListener('scroll', updateRect, true)
    window.addEventListener('resize', updateRect)
    return () => {
      window.removeEventListener('scroll', updateRect, true)
      window.removeEventListener('resize', updateRect)
    }
  }, [dropdownOpen, updateRect])

  // Close dropdown on outside click (wrapper + portal dropdown both count as inside)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (wrapperRef.current?.contains(t)) return
      if (dropdownRef.current?.contains(t)) return
      setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setSuggestions([])
      setDropdownOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setIsLoadingSugg(true)
      // Built-in aliases first (offline, resolves abbreviations like BTBAS/3DMAS)
      const aliasSuggestions: Suggestion[] = searchAliases(query).map((a) => ({
        source: 'alias',
        label: `${a.aliases[0]} — ${a.canonicalName}`,
        alias: a,
      }))
      // PubChem names below, skipping any that an alias already covers
      const names = await searchAutocomplete(query)
      const pubchemSuggestions: Suggestion[] = names
        .filter((n) => !resolveAlias(n))
        .map((n) => ({ source: 'pubchem', label: n, name: n }))
      const merged = [...aliasSuggestions, ...pubchemSuggestions]
      setSuggestions(merged)
      setDropdownOpen(merged.length > 0)
      setIsLoadingSugg(false)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Built-in alias → resolve instantly, no network.
  const selectAlias = useCallback((alias: CompoundAlias) => {
    setDropdownOpen(false)
    setQuery(alias.canonicalName)
    setError(null)
    setResolved({
      cid: alias.cid ?? 0,
      molecularFormula: alias.formula,
      title: alias.canonicalName,
    })
  }, [])

  // Treat the raw query as a chemical formula (offline fallback when name
  // lookup fails / is non-standard). Returns true if it parsed.
  const tryAsFormula = useCallback((text: string): boolean => {
    try {
      parseFormula(text)
      setError(null)
      setResolved({ cid: 0, molecularFormula: text, title: text })
      return true
    } catch (err) {
      if (!(err instanceof FormulaParseError)) throw err
      return false
    }
  }, [])

  // PubChem name → network lookup, with chemical-formula fallback.
  const fetchFromPubChem = useCallback(async (name: string) => {
    setDropdownOpen(false)
    setQuery(name)
    setError(null)
    setResolved(null)
    setIsLoadingCompound(true)
    try {
      const compound = await fetchByName(name)
      setResolved(compound)
    } catch (err) {
      // 물질명 검색 실패 → 같은 입력을 화학식으로 해석 시도.
      if (tryAsFormula(name)) return
      setError(
        err instanceof PubChemError
          ? `${err.message} 화학식이라면 그대로 입력해 주세요 (예: HfCl4).`
          : '검색 결과가 없습니다. 화학식을 직접 입력해 주세요 (예: HfCl4).',
      )
    } finally {
      setIsLoadingCompound(false)
    }
  }, [tryAsFormula])

  // Entry point for typed/Enter/button submission.
  // 1) 내장 별칭(정확 일치, 표시명 보존) → 2) 화학식 모양이면 즉시 파싱(오프라인)
  // → 3) PubChem(실패 시 내부에서 화학식 fallback).
  const handleSubmitName = useCallback(
    (name: string) => {
      const alias = resolveAlias(name)
      if (alias) { selectAlias(alias); return }
      if (looksLikeFormula(name)) { tryAsFormula(name); return }
      void fetchFromPubChem(name)
    },
    [selectAlias, fetchFromPubChem, tryAsFormula],
  )

  const handleApply = () => {
    if (!resolved) return
    onSelect(resolved.molecularFormula, resolved.title)
  }

  const nistUrl = resolved
    ? `https://webbook.nist.gov/cgi/cbook.cgi?Name=${encodeURIComponent(resolved.molecularFormula)}`
    : null

  return (
    <div className="flex flex-col gap-3">
      {/* Search input with autocomplete */}
      <div ref={wrapperRef} className="relative">
        <div className="flex flex-col gap-1">
          <label className="text-app text-xs font-medium px-1">물질명 또는 화학식 검색</label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              className="glass-input px-4 py-2.5 flex-1 min-w-0"
              placeholder="예: hafnium tetrachloride, HfCl4, La(CH3)3"
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                setResolved(null)
                setError(null)
              }}
              onFocus={() => suggestions.length > 0 && setDropdownOpen(true)}
              onKeyDown={e => {
                if (e.key === 'Escape') setDropdownOpen(false)
                if (e.key === 'Enter' && query.trim()) {
                  setDropdownOpen(false)
                  handleSubmitName(query.trim())
                }
              }}
              aria-label="물질명 검색"
              spellCheck={false}
              autoComplete="off"
            />
            <button
              type="button"
              className="glass-btn-primary px-4 py-2.5 text-sm font-medium whitespace-nowrap"
              onClick={() => query.trim() && handleSubmitName(query.trim())}
              disabled={!query.trim()}
              style={!query.trim() ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
              aria-label="검색"
            >
              검색
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-app-faint text-xs">
              화학식은 그대로 입력해 검색하세요
            </p>
            <button
              type="button"
              className="text-accent text-xs hover:underline whitespace-nowrap"
              onClick={onRequestManualElements}
            >
              원소 직접 선택
            </button>
          </div>
        </div>

      </div>

      {/* Autocomplete dropdown — portal to body so it renders above sibling cards */}
      {dropdownOpen && suggestions.length > 0 && rect && createPortal(
        <div
          ref={dropdownRef}
          className="surface-panel overflow-hidden max-h-72 overflow-y-auto"
          style={{
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            zIndex: 60,
          }}
        >
          {suggestions.map((s) => (
            <button
              key={`${s.source}:${s.label}`}
              type="button"
              className="w-full text-left px-4 py-2 text-sm text-app hover:surface-accent transition-colors border-b border-app last:border-b-0 flex items-center gap-2"
              onMouseDown={e => {
                e.preventDefault() // prevent blur before click fires
                if (s.source === 'alias') selectAlias(s.alias)
                else fetchFromPubChem(s.name)
              }}
            >
              <span className="flex-1">{s.label}</span>
              {s.source === 'alias' && (
                <span className="text-accent text-[0.65rem] font-medium whitespace-nowrap">내장</span>
              )}
            </button>
          ))}
        </div>,
        document.body,
      )}

      {/* Loading state */}
      {(isLoadingSugg || isLoadingCompound) && (
        <p className="text-app-muted text-xs px-1">
          {isLoadingCompound ? '화합물 정보를 불러오는 중…' : '자동완성 검색 중…'}
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="text-err text-xs px-1" role="alert">{error}</p>
      )}

      {/* Resolved compound result */}
      {resolved && (
        <div className="surface-subtle rounded-xl px-4 py-3 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex flex-col gap-0.5">
              <span className="text-app-muted text-xs">분자식</span>
              <span className="font-mono font-bold text-accent-strong text-base">{resolved.molecularFormula}</span>
            </div>
            <div className="flex flex-col gap-0.5 text-right">
              <span className="text-app-muted text-xs">물질명</span>
              <span className="text-app text-sm">{resolved.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {resolved.cid > 0 && (
              <span className="text-app-faintest text-xs">PubChem CID: {resolved.cid}</span>
            )}
            {nistUrl && (
              <a
                href={nistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent text-xs hover:underline ml-auto"
              >
                NIST WebBook에서 보기 ↗
              </a>
            )}
          </div>
        </div>
      )}

      {/* Apply button */}
      <button
        type="button"
        onClick={handleApply}
        disabled={!resolved}
        className="glass-btn-primary w-full py-2 text-sm font-medium"
        style={!resolved ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
      >
        이 화합물로 설정
      </button>
    </div>
  )
}
