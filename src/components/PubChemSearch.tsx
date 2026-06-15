import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  searchAutocomplete,
  resolveByName,
  resolveByCas,
  structureImageUrl,
  isAbortError,
  PubChemError,
} from '../lib/pubchem'
import type { PubChemCompound } from '../lib/pubchem'
import { Modal } from './Modal'
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

// Where the currently-resolved compound came from (drives the badge).
type ResolvedSource = 'alias' | 'formula' | 'pubchem' | 'cas'

// CAS Registry Number, e.g. 7440-23-5.
const CAS_RE = /^\d{2,7}-\d{2}-\d$/

const SOURCE_BADGE: Record<ResolvedSource, string | null> = {
  alias: '내장',
  formula: '화학식',
  cas: 'CAS',
  pubchem: 'PubChem',
}

export function PubChemSearch({ onSelect, onRequestManualElements }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isLoadingSugg, setIsLoadingSugg] = useState(false)
  const [isLoadingCompound, setIsLoadingCompound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<PubChemCompound[]>([])
  const [resolved, setResolved] = useState<PubChemCompound | null>(null)
  const [resolvedSource, setResolvedSource] = useState<ResolvedSource>('pubchem')
  const [zoomCid, setZoomCid] = useState<number | null>(null)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggestAbortRef = useRef<AbortController | null>(null)
  const compoundAbortRef = useRef<AbortController | null>(null)
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

  // Debounced autocomplete (cancels superseded in-flight requests)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setActiveIndex(-1)
    if (query.trim().length < 2) {
      setSuggestions([])
      setDropdownOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      suggestAbortRef.current?.abort()
      const controller = new AbortController()
      suggestAbortRef.current = controller
      setIsLoadingSugg(true)
      // Built-in aliases first (offline, resolves abbreviations like BTBAS/3DMAS)
      const aliasSuggestions: Suggestion[] = searchAliases(query).map((a) => ({
        source: 'alias',
        label: `${a.aliases[0]} — ${a.canonicalName}`,
        alias: a,
      }))
      let names: string[] = []
      try {
        names = await searchAutocomplete(query, controller.signal)
      } catch (err) {
        if (isAbortError(err)) return // superseded by a newer query
      }
      if (controller.signal.aborted) return
      // PubChem names below, skipping any that an alias already covers
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

  const clearResults = () => {
    setResolved(null)
    setCandidates([])
    setError(null)
  }

  // Built-in alias → resolve instantly, no network.
  const selectAlias = useCallback((alias: CompoundAlias) => {
    setDropdownOpen(false)
    setQuery(alias.canonicalName)
    setError(null)
    setCandidates([])
    setResolvedSource('alias')
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
      setCandidates([])
      setResolvedSource('formula')
      setResolved({ cid: 0, molecularFormula: text, title: text })
      return true
    } catch (err) {
      if (!(err instanceof FormulaParseError)) throw err
      return false
    }
  }, [])

  // PubChem name/CAS → network lookup. 0 results → formula fallback / error,
  // 1 result → resolve, 2+ → candidate picker. Cancels superseded requests.
  const resolveAndShow = useCallback(
    async (input: string, kind: 'name' | 'cas') => {
      setDropdownOpen(false)
      setQuery(input)
      clearResults()
      compoundAbortRef.current?.abort()
      const controller = new AbortController()
      compoundAbortRef.current = controller
      setIsLoadingCompound(true)
      try {
        const list =
          kind === 'cas'
            ? await resolveByCas(input, controller.signal)
            : await resolveByName(input, controller.signal)
        if (controller.signal.aborted) return
        const source: ResolvedSource = kind === 'cas' ? 'cas' : 'pubchem'
        if (list.length === 1) {
          setResolvedSource(source)
          setResolved(list[0])
        } else {
          setResolvedSource(source)
          setCandidates(list)
        }
      } catch (err) {
        if (isAbortError(err)) return
        // 물질명 검색 실패 → 같은 입력을 화학식으로 해석 시도 (CAS는 제외).
        if (kind === 'name' && tryAsFormula(input)) return
        setError(
          err instanceof PubChemError
            ? `${err.message} 화학식이라면 그대로 입력해 주세요 (예: HfCl4).`
            : '검색 결과가 없습니다. 화학식을 직접 입력해 주세요 (예: HfCl4).',
        )
      } finally {
        if (!controller.signal.aborted) setIsLoadingCompound(false)
      }
    },
    [tryAsFormula],
  )

  const selectCandidate = (c: PubChemCompound) => {
    setCandidates([])
    setError(null)
    setResolved(c)
  }

  // Pick an autocomplete suggestion (keyboard Enter or click).
  const chooseSuggestion = useCallback(
    (s: Suggestion) => {
      if (s.source === 'alias') selectAlias(s.alias)
      else void resolveAndShow(s.name, 'name')
    },
    [selectAlias, resolveAndShow],
  )

  // Entry point for typed/Enter/button submission.
  // 1) 내장 별칭(정확 일치) → 2) CAS 번호 → 3) 화학식 모양이면 즉시 파싱(오프라인)
  // → 4) PubChem 이름(다중 후보).
  const handleSubmitName = useCallback(
    (name: string) => {
      const alias = resolveAlias(name)
      if (alias) {
        selectAlias(alias)
        return
      }
      if (CAS_RE.test(name)) {
        void resolveAndShow(name, 'cas')
        return
      }
      if (looksLikeFormula(name)) {
        tryAsFormula(name)
        return
      }
      void resolveAndShow(name, 'name')
    },
    [selectAlias, resolveAndShow, tryAsFormula],
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
          <label className="text-app text-xs font-medium px-1">물질명 · 화학식 · CAS 번호 검색</label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              className="glass-input px-4 py-2.5 flex-1 min-w-0"
              placeholder="예: hafnium tetrachloride, HfCl4, CuSO4·5H2O, 7440-23-5"
              value={query}
              role="combobox"
              aria-expanded={dropdownOpen}
              aria-controls="pubchem-suggestions"
              aria-activedescendant={
                activeIndex >= 0 ? `pubchem-sugg-${activeIndex}` : undefined
              }
              onChange={e => {
                setQuery(e.target.value)
                clearResults()
              }}
              onFocus={() => suggestions.length > 0 && setDropdownOpen(true)}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setDropdownOpen(false)
                  return
                }
                if (e.key === 'ArrowDown' && dropdownOpen && suggestions.length > 0) {
                  e.preventDefault()
                  setActiveIndex(i => Math.min(i + 1, suggestions.length - 1))
                  return
                }
                if (e.key === 'ArrowUp' && dropdownOpen && suggestions.length > 0) {
                  e.preventDefault()
                  setActiveIndex(i => Math.max(i - 1, 0))
                  return
                }
                if (e.key === 'Enter') {
                  if (dropdownOpen && activeIndex >= 0 && activeIndex < suggestions.length) {
                    e.preventDefault()
                    setDropdownOpen(false)
                    chooseSuggestion(suggestions[activeIndex])
                  } else if (query.trim()) {
                    setDropdownOpen(false)
                    handleSubmitName(query.trim())
                  }
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
              화학식·CAS 번호는 그대로 입력해 검색하세요
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
          id="pubchem-suggestions"
          role="listbox"
          className="surface-panel overflow-hidden max-h-72 overflow-y-auto"
          style={{
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            zIndex: 60,
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={`${s.source}:${s.label}`}
              id={`pubchem-sugg-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              type="button"
              className={`w-full text-left px-4 py-2 text-sm text-app transition-colors border-b border-app last:border-b-0 flex items-center gap-2 ${
                i === activeIndex ? 'surface-accent' : 'hover:surface-accent'
              }`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={e => {
                e.preventDefault() // prevent blur before click fires
                setDropdownOpen(false)
                chooseSuggestion(s)
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

      {/* Multiple candidates — let the user pick the right compound */}
      {candidates.length > 0 && !resolved && (
        <div className="surface-subtle rounded-xl p-2 flex flex-col gap-1">
          <p className="text-app-muted text-xs px-2 pt-1">
            여러 화합물이 검색됐어요. 하나를 선택하세요:
          </p>
          {candidates.map((c) => (
            <button
              key={c.cid}
              type="button"
              onClick={() => selectCandidate(c)}
              className="w-full text-left px-3 py-2 rounded-lg hover:surface-accent transition-colors flex items-baseline justify-between gap-2"
            >
              <span className="flex flex-col leading-tight min-w-0">
                <span className="font-mono font-semibold text-accent-strong text-sm">{c.molecularFormula}</span>
                <span className="text-app text-xs truncate">{c.title}</span>
              </span>
              <span className="text-app-faint text-xs whitespace-nowrap">
                {c.molecularWeight ? `${c.molecularWeight} g/mol` : `CID ${c.cid}`}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Resolved compound result */}
      {resolved && (
        <div className="surface-subtle rounded-xl px-4 py-3 flex gap-3">
          {resolved.cid > 0 && <StructureThumb cid={resolved.cid} onClick={() => setZoomCid(resolved.cid)} />}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex flex-col gap-0.5">
                <span className="text-app-muted text-xs">분자식</span>
                <span className="font-mono font-bold text-accent-strong text-base">{resolved.molecularFormula}</span>
              </div>
              <div className="flex flex-col gap-0.5 text-right min-w-0">
                <span className="text-app-muted text-xs flex items-center gap-1 justify-end">
                  물질명
                  {SOURCE_BADGE[resolvedSource] && (
                    <span className="text-accent text-[0.6rem] font-medium border border-app rounded px-1">
                      {SOURCE_BADGE[resolvedSource]}
                    </span>
                  )}
                </span>
                <span className="text-app text-sm break-words">{resolved.title}</span>
              </div>
            </div>
            {(resolved.molecularWeight || resolved.iupacName) && (
              <div className="flex flex-col gap-0.5 border-t border-app pt-2">
                {resolved.molecularWeight && (
                  <span className="text-app-muted text-xs">
                    분자량 <span className="text-app font-mono">{resolved.molecularWeight} g/mol</span>
                  </span>
                )}
                {resolved.iupacName && (
                  <span className="text-app-faint text-xs break-words">{resolved.iupacName}</span>
                )}
              </div>
            )}
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

      {/* Enlarged structure popup — portaled to body so the fixed overlay
          escapes the glass card's containing block and covers the full viewport. */}
      {zoomCid !== null && createPortal(
        <Modal
          onClose={() => setZoomCid(null)}
          ariaLabel={`${resolved?.title ?? ''} 화학 구조`}
          widthClass="max-w-xl"
        >
          <div className="p-6 flex flex-col items-center gap-3">
            <img
              src={structureImageUrl(zoomCid, true)}
              alt="2D 화학 구조 (확대)"
              className="w-full max-w-md aspect-square rounded-lg bg-white object-contain"
            />
            {resolved && (
              <span className="text-app-muted text-sm text-center">
                {resolved.title} · <span className="font-mono">{resolved.molecularFormula}</span> · CID {zoomCid}
              </span>
            )}
          </div>
        </Modal>,
        document.body,
      )}
    </div>
  )
}

// PubChem 2D structure thumbnail; hides itself if the image fails to load.
// Clicking opens an enlarged popup via the onClick callback.
function StructureThumb({ cid, onClick }: { cid: number; onClick: () => void }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="구조 확대"
      className="shrink-0 rounded-lg cursor-pointer hover:ring-2 hover:ring-accent focus:outline-none focus:ring-2 focus:ring-accent transition"
    >
      <img
        src={structureImageUrl(cid)}
        alt="2D 구조"
        width={96}
        height={96}
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-24 h-24 rounded-lg bg-white object-contain"
      />
    </button>
  )
}
