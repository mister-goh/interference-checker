import { useState, useCallback, useEffect, useMemo } from 'react'
import type { SortingState } from '@tanstack/react-table'
import type {
  Recommendation,
  RecommendationStatus,
  MatrixState,
  FavoriteCompound,
  ElementPreset,
  SavedAnalysis,
  InstrumentCapabilities,
} from './types'
import { SAVED_ANALYSIS_SCHEMA_VERSION } from './types'
import { AppHeader } from './components/AppHeader'
import { Modal } from './components/Modal'
import { CompoundInput } from './components/CompoundInput'
import { MatrixToggle } from './components/MatrixToggle'
import { ModeSelector } from './components/ModeSelector'
import { CongenerPanel } from './components/CongenerPanel'
import { ElementPicker } from './components/ElementPicker'
import { ResultFilter } from './components/ResultFilter'
import { PresetBar } from './components/PresetBar'
import { PresetManager } from './components/PresetManager'
import { ResultsTable } from './components/ResultsTable'
import { DetailPanel } from './components/DetailPanel'
import { DisclaimerBar } from './components/DisclaimerBar'
import { ExportButton } from './components/ExportButton'
import { loadFavorites, addFavorite, removeFavorite } from './lib/favorites'
import { loadPresets, addPreset, updatePreset, removePreset } from './lib/presets'
import { exportCsv, exportExcel } from './lib/export'
import { applySorting } from './lib/sorting'
import { filterByStatus, filterByElements, countByStatus, STATUS_ORDER } from './lib/filtering'
import { getCongeners } from './data/congeners'
import { loadCustomCongeners, saveCustomCongeners } from './lib/custom-congeners'
import { SavedAnalysisPanel } from './components/SavedAnalysisPanel'
import { loadSavedAnalyses, addSavedAnalysis, removeSavedAnalysis } from './lib/saved-analyses'
import { useTheme } from './lib/theme'
import { parseFormula, FormulaParseError } from './engine/formula-parser'
import { recommend } from './engine/recommend'

// ── Compound parse preview — uses the real engine parser for accurate feedback ──
// FormulaParseError messages are already in Korean (from engine/formula-parser.ts).
interface ParsePreview {
  ok: boolean
  composition: Record<string, number>
  errorMessage?: string
}

function tryParseFormula(formula: string): ParsePreview {
  const trimmed = formula.trim()
  if (!trimmed) return { ok: false, composition: {}, errorMessage: '화학식을 입력해 주세요.' }
  try {
    const composition = parseFormula(trimmed)
    return { ok: true, composition }
  } catch (err) {
    const msg = err instanceof FormulaParseError
      ? err.message
      : '화학식을 인식할 수 없습니다. 예: HfCl4, SiH(N(CH3)2)3'
    return { ok: false, composition: {}, errorMessage: msg }
  }
}

// ── Default matrix state ──────────────────────────────────────────────────────
const DEFAULT_MATRIX: MatrixState = { Ar: true, H: true, N: true, O: true, C: false, Cl: false }

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { theme, toggleTheme } = useTheme()
  // 내보내기(CSV/Excel) 화면 숨김 — 코드는 유지, 다시 켜려면 true로.
  const SHOW_EXPORT = false
  const [formula, setFormula] = useState('')
  const [compoundName, setCompoundName] = useState('')
  const [matrix, setMatrix] = useState<MatrixState>(DEFAULT_MATRIX)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null)
  // Default: element symbol ascending (Ag, Al, As, …)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'elementSymbol', desc: false },
  ])
  const [favorites, setFavorites] = useState<FavoriteCompound[]>(loadFavorites)
  const [activeFormulaId, setActiveFormulaId] = useState<string | null>(null)
  // userMatrixOverride: tracks whether user has manually toggled after last compound select
  const [userMatrixOverride, setUserMatrixOverride] = useState(false)
  // User-facing default reflects this lab's instrument: DRC(NH₃) only.
  // KED(He) off by default; O₂/H₂ off — user enables what their instrument has.
  const [caps, setCaps] = useState<InstrumentCapabilities>({
    KED: false,
    DRC: { NH3: true, O2: false, H2: false },
  })
  // Status filter — which judgment statuses are shown. Defaults to all on.
  // Session-only UI state (not persisted).
  const [activeStatuses, setActiveStatuses] = useState<Set<RecommendationStatus>>(
    () => new Set(STATUS_ORDER),
  )
  // Element presets — persisted (localStorage); active selection is session-only.
  const [presets, setPresets] = useState<ElementPreset[]>(loadPresets)
  const [activePresetId, setActivePresetId] = useState<string | null>(null)
  const [isPresetManagerOpen, setIsPresetManagerOpen] = useState(false)
  // Congener (same-group) impurity reflection — default ON. Overrides are
  // per-congener impurity % (session-only); absent → curated default.
  const [congenerEnabled, setCongenerEnabled] = useState(true)
  const [congenerOverrides, setCongenerOverrides] = useState<Record<string, number>>({})
  // User-picked custom impurities (symbol → %), persisted to localStorage.
  const [customCongeners, setCustomCongeners] = useState<Record<string, number>>(loadCustomCongeners)
  const [isCongenerPickerOpen, setIsCongenerPickerOpen] = useState(false)
  // Manual element-input fallback — define the sample by elements when neither
  // name search nor formula parsing resolves the compound.
  const [isElementInputOpen, setIsElementInputOpen] = useState(false)
  const [manualElements, setManualElements] = useState<Set<string>>(() => new Set())
  // Saved analyses (full-state snapshots), persisted to localStorage.
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>(loadSavedAnalyses)
  // Bumped on restore to trigger a recompute once derived state has settled.
  const [restoreNonce, setRestoreNonce] = useState(0)

  // Memoize parse result so the object reference is stable when formula hasn't changed.
  // This prevents the auto-C useEffect from firing on every unrelated re-render.
  const parsePreview = useMemo(
    () => (formula.trim() ? tryParseFormula(formula) : null),
    [formula],
  )

  // ── Matrix toggle ──
  const handleMatrixChange = useCallback(
    (key: keyof MatrixState, value: boolean) => {
      if (key === 'Ar') return // Ar is locked
      setMatrix((prev) => ({ ...prev, [key]: value }))
      setUserMatrixOverride(true)
    },
    [],
  )

  // ── Auto-set C based on compound composition (unless user overrode) ──
  // Uses `formula` as the stable dep so this only fires when the formula changes,
  // not on every re-render. `userMatrixOverride` gates whether to apply the rule.
  useEffect(() => {
    if (userMatrixOverride) return
    if (!parsePreview?.ok) return
    const hasC = 'C' in parsePreview.composition
    const hasCl = 'Cl' in parsePreview.composition
    setMatrix((prev) => ({ ...prev, C: hasC, Cl: hasCl }))
  }, [formula, userMatrixOverride])

  // ── Congener impurity composition + weights ──
  // When enabled, add each compound element's congeners to the sample so the
  // engine generates their isobaric/polyatomic interferences, down-weighted by
  // the (override or default) impurity fraction. A congener that is itself a
  // genuine compound element is left at full weight (skipped).
  type ActiveCongener = { host: string | null; symbol: string; pct: number; source: 'auto' | 'custom' }
  const congenerInfo = useMemo(() => {
    const base = parsePreview?.ok ? parsePreview.composition : {}
    if (!congenerEnabled) {
      return { composition: base, weights: {} as Record<string, number>, active: [] as ActiveCongener[] }
    }
    const composition: Record<string, number> = { ...base }
    const weights: Record<string, number> = {}
    const active: ActiveCongener[] = []
    const used = new Set<string>()

    // 1. Custom impurities first (user intent wins over auto for overlaps)
    for (const [symbol, pct] of Object.entries(customCongeners)) {
      if (symbol in base) continue // genuine component — keep full weight
      composition[symbol] = composition[symbol] ?? 1
      weights[symbol] = pct / 100
      active.push({ host: null, symbol, pct, source: 'custom' })
      used.add(symbol)
    }

    // 2. Auto congeners from the compound's elements
    for (const host of Object.keys(base)) {
      for (const c of getCongeners(host)) {
        if (c.symbol in base) continue // genuine component
        if (used.has(c.symbol)) continue // already added (custom or another host)
        const pct = congenerOverrides[c.symbol] ?? c.defaultImpurityPct
        composition[c.symbol] = composition[c.symbol] ?? 1
        weights[c.symbol] = pct / 100
        active.push({ host, symbol: c.symbol, pct, source: 'auto' })
        used.add(c.symbol)
      }
    }
    return { composition, weights, active }
  }, [parsePreview, congenerEnabled, congenerOverrides, customCongeners])

  // Persist custom congeners.
  useEffect(() => {
    saveCustomCongeners(customCongeners)
  }, [customCongeners])

  // ── Search / calculate ──
  const handleSearch = useCallback(() => {
    if (!parsePreview?.ok) return
    // NOTE: matrix toggles ≠ compound-element presence.
    // Compound elements (e.g. Cl in HfCl4) are always included in interference
    // generation via compoundComposition regardless of matrix toggle state.
    // Matrix toggles only add *background* elements (Ar always on; H/N/O/C/Cl
    // user-controlled). This matches the engine's buildActiveElements() logic.
    const results = recommend(congenerInfo.composition, matrix, caps, congenerInfo.weights)
    setRecommendations(results)
    setSelectedRec(null)
  }, [parsePreview, matrix, caps, congenerInfo])

  // ── Auto-recalculate when caps / congener settings change and results shown ──
  // Scoped to settings that should re-run instantly; a formula change still
  // requires pressing 계산 (handleSearch), matching the original behavior.
  useEffect(() => {
    if (recommendations.length === 0) return
    setRecommendations(recommend(congenerInfo.composition, matrix, caps, congenerInfo.weights))
  }, [caps, congenerEnabled, congenerOverrides, customCongeners]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recompute after a saved-analysis restore ──
  // Runs once derived state (parsePreview/congenerInfo) has settled for the
  // restored inputs. Same technique as the caps effect above.
  useEffect(() => {
    if (restoreNonce === 0) return
    if (!parsePreview?.ok) {
      setRecommendations([])
      return
    }
    setRecommendations(recommend(congenerInfo.composition, matrix, caps, congenerInfo.weights))
    setSelectedRec(null)
  }, [restoreNonce]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filters — element preset (orthogonal) composed with status filter ──
  // 1) element filter (active preset → symbol set, or null), 2) status filter.
  const activeElementSet = useMemo<Set<string> | null>(() => {
    const active = presets.find((p) => p.id === activePresetId)
    return active ? new Set(active.symbols) : null
  }, [presets, activePresetId])

  const elementFiltered = useMemo(
    () => filterByElements(recommendations, activeElementSet),
    [recommendations, activeElementSet],
  )
  // Status chip counts reflect the element-filtered set so they match what is filterable.
  const statusCounts = useMemo(
    () => countByStatus(elementFiltered),
    [elementFiltered],
  )
  const filteredRecommendations = useMemo(
    () => filterByStatus(elementFiltered, activeStatuses),
    [elementFiltered, activeStatuses],
  )

  // Filter changes can hide the selected row — close the detail modal to stay consistent.
  const handleToggleStatus = useCallback((status: RecommendationStatus) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
    setSelectedRec(null)
  }, [])

  const handleShowAllStatuses = useCallback(() => {
    setActiveStatuses(new Set(STATUS_ORDER))
    setSelectedRec(null)
  }, [])

  const handleCleanOnly = useCallback(() => {
    setActiveStatuses(new Set<RecommendationStatus>(['clean']))
    setSelectedRec(null)
  }, [])

  // ── Congener handlers ──
  // Route the % edit to the right map: custom symbols update customCongeners
  // (persisted), auto congeners update the session-only overrides.
  const handleCongenerPct = useCallback((symbol: string, pct: number) => {
    setCustomCongeners((prev) =>
      symbol in prev ? { ...prev, [symbol]: pct } : prev,
    )
    setCongenerOverrides((prev) =>
      symbol in customCongeners ? prev : { ...prev, [symbol]: pct },
    )
  }, [customCongeners])

  const handleToggleCustomCongener = useCallback((symbol: string) => {
    setCustomCongeners((prev) => {
      if (symbol in prev) {
        const next = { ...prev }
        delete next[symbol]
        return next
      }
      return { ...prev, [symbol]: 1 } // default 1% impurity
    })
  }, [])

  const handleRemoveCustomCongener = useCallback((symbol: string) => {
    setCustomCongeners((prev) => {
      const next = { ...prev }
      delete next[symbol]
      return next
    })
  }, [])

  const handleClearCustomCongeners = useCallback(() => setCustomCongeners({}), [])

  // ── Manual element-input handlers ──
  // Build a formula by concatenating the picked symbols (each count 1). Symbols
  // are valid tokens, so the concatenation always parses (e.g. Hf + La → "HfLa").
  const handleToggleManualElement = useCallback((symbol: string) => {
    setManualElements((prev) => {
      const next = new Set(prev)
      if (next.has(symbol)) next.delete(symbol)
      else next.add(symbol)
      return next
    })
  }, [])

  const handleClearManualElements = useCallback(() => setManualElements(new Set()), [])

  const handleConfirmManualElements = useCallback(() => {
    const symbols = [...manualElements]
    if (symbols.length === 0) return
    setFormula(symbols.join(''))
    setCompoundName(`직접 선택: ${symbols.join('·')}`)
    setActiveFormulaId(null)
    setUserMatrixOverride(false) // let auto C/Cl apply to the chosen elements
    setIsElementInputOpen(false)
  }, [manualElements])

  // ── Saved-analysis handlers ──
  const handleSaveAnalysis = useCallback(
    (name: string) => {
      const analysis: SavedAnalysis = {
        schemaVersion: SAVED_ANALYSIS_SCHEMA_VERSION,
        id: `${Date.now()}-${name}`,
        name,
        savedAt: new Date().toISOString(),
        formula,
        compoundName,
        matrix,
        caps,
        congenerEnabled,
        congenerOverrides,
        customCongeners,
        activePresetId,
        activeStatuses: [...activeStatuses],
        sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
      }
      const { analyses, error } = addSavedAnalysis(savedAnalyses, analysis)
      if (error) return
      setSavedAnalyses(analyses)
    },
    [
      formula, compoundName, matrix, caps, congenerEnabled, congenerOverrides,
      customCongeners, activePresetId, activeStatuses, sorting, savedAnalyses,
    ],
  )

  const handleRestoreAnalysis = useCallback(
    (a: SavedAnalysis) => {
      setFormula(a.formula)
      setCompoundName(a.compoundName)
      setMatrix(a.matrix)
      setUserMatrixOverride(true) // keep restored matrix; don't auto-set C/Cl
      setCaps(a.caps)
      setCongenerEnabled(a.congenerEnabled)
      setCongenerOverrides(a.congenerOverrides)
      setCustomCongeners(a.customCongeners)
      // Re-select the preset only if it still exists (it may have been deleted).
      setActivePresetId(
        a.activePresetId && presets.some((p) => p.id === a.activePresetId)
          ? a.activePresetId
          : null,
      )
      setActiveStatuses(new Set(a.activeStatuses))
      setSorting(a.sorting)
      setActiveFormulaId(null)
      setSelectedRec(null)
      setRestoreNonce((n) => n + 1)
    },
    [presets],
  )

  const handleDeleteAnalysis = useCallback((id: string) => {
    setSavedAnalyses((prev) => removeSavedAnalysis(prev, id))
  }, [])

  // ── Element-preset handlers ──
  const handleActivatePreset = useCallback((id: string | null) => {
    setActivePresetId(id)
    setSelectedRec(null)
  }, [])

  const handleSavePreset = useCallback(
    (name: string, symbols: string[], id?: string) => {
      const result = id
        ? updatePreset(presets, id, { name, symbols })
        : addPreset(presets, name, symbols)
      if (result.error) return // silent — manager validates before calling
      setPresets(result.presets)
    },
    [presets],
  )

  const handleDeletePreset = useCallback(
    (id: string) => {
      setPresets((prev) => removePreset(prev, id))
      if (activePresetId === id) setActivePresetId(null)
    },
    [activePresetId],
  )

  // ── Row click → detail panel ──
  const handleRowClick = useCallback((rec: Recommendation) => {
    setSelectedRec((prev) =>
      prev?.elementSymbol === rec.elementSymbol ? null : rec,
    )
  }, [])

  // ── Favorite select ──
  const handleFavoriteSelect = useCallback(
    (fav: FavoriteCompound) => {
      setFormula(fav.formula)
      setCompoundName(fav.name)
      setActiveFormulaId(fav.id)
      // Preserve user matrix changes per the toggle precedence rule:
      // re-selecting same compound does NOT reset user's manual overrides
    },
    [],
  )

  // Reset user override flag when formula changes manually (not from chip)
  const handleFormulaChange = useCallback((f: string) => {
    setFormula(f)
    setActiveFormulaId(null)
    setUserMatrixOverride(false)
  }, [])

  // ── Reset — clear search/input and results ──
  const handleReset = useCallback(() => {
    setFormula('')
    setCompoundName('')
    setRecommendations([])
    setSelectedRec(null)
    setActiveFormulaId(null)
    setUserMatrixOverride(false)
  }, [])

  // ── Favorite save ──
  const handleFavoriteSave = useCallback(() => {
    if (!parsePreview?.ok) return
    const { favorites: updated, error } = addFavorite(favorites, compoundName, formula)
    if (error) return // silent — UI can surface this if needed in future
    setFavorites(updated)
    // Find the id of the newly added entry (first item, since addFavorite prepends)
    if (updated.length > 0) setActiveFormulaId(updated[0].id)
  }, [parsePreview, compoundName, formula, favorites])

  // ── Favorite delete ──
  const handleFavoriteDelete = useCallback((id: string) => {
    setFavorites((prev) => removeFavorite(prev, id))
    if (activeFormulaId === id) setActiveFormulaId(null)
  }, [activeFormulaId])

  // ── Export — sorted rows match current screen order (filtered view) ──
  const handleExportCsv = useCallback(() => {
    exportCsv(applySorting(filteredRecommendations, sorting))
  }, [filteredRecommendations, sorting])

  const handleExportExcel = useCallback(() => {
    exportExcel(applySorting(filteredRecommendations, sorting))
  }, [filteredRecommendations, sorting])

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 w-full max-w-screen-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Header — full width */}
        <AppHeader theme={theme} onToggleTheme={toggleTheme} />

        {/* Two-pane: left sidebar (controls) + center (results) */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Left sidebar — sticky */}
          <aside className="w-full lg:w-[480px] lg:flex-shrink-0 lg:sticky lg:top-[5.5rem] lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto flex flex-col gap-4">
            {/* A 화학식 → B 물질명 → 버튼 → 즐겨찾기 */}
            <CompoundInput
              formula={formula}
              compoundName={compoundName}
              parsePreview={parsePreview}
              favorites={favorites}
              onFormulaChange={handleFormulaChange}
              onNameChange={setCompoundName}
              onSearch={handleSearch}
              onReset={handleReset}
              onFavoriteSelect={handleFavoriteSelect}
              onFavoriteSave={handleFavoriteSave}
              onFavoriteDelete={handleFavoriteDelete}
              onRequestManualElements={() => setIsElementInputOpen(true)}
              activeFormulaId={activeFormulaId}
            />

            {/* F 저장된 분석 */}
            <SavedAnalysisPanel
              analyses={savedAnalyses}
              canSave={!!parsePreview?.ok}
              defaultName={compoundName || formula}
              onSave={handleSaveAnalysis}
              onRestore={handleRestoreAnalysis}
              onDelete={handleDeleteAnalysis}
            />

            {/* C 배경 매트릭스 · D 측정 모드 가용성 — 2열 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MatrixToggle matrix={matrix} onChange={handleMatrixChange} />
              <ModeSelector caps={caps} onChange={setCaps} />
            </div>

            {/* E 동족 불순물 반영 */}
            <CongenerPanel
              enabled={congenerEnabled}
              onToggle={() => setCongenerEnabled((v) => !v)}
              active={congenerInfo.active}
              hasCompound={!!parsePreview?.ok}
              onPctChange={handleCongenerPct}
              onRemoveCustom={handleRemoveCustomCongener}
              onOpenPicker={() => setIsCongenerPickerOpen(true)}
            />
          </aside>

          {/* Center — results */}
          <main className="flex-1 min-w-0 flex flex-col gap-4">
            {SHOW_EXPORT && recommendations.length > 0 && (
              <div className="flex justify-end">
                <ExportButton
                  disabled={filteredRecommendations.length === 0}
                  onExportCsv={handleExportCsv}
                  onExportExcel={handleExportExcel}
                />
              </div>
            )}

            {recommendations.length > 0 && (
              <>
                <PresetBar
                  presets={presets}
                  activePresetId={activePresetId}
                  onActivate={handleActivatePreset}
                  onOpenManager={() => setIsPresetManagerOpen(true)}
                />
                <ResultFilter
                  counts={statusCounts}
                  active={activeStatuses}
                  total={elementFiltered.length}
                  shown={filteredRecommendations.length}
                  onToggle={handleToggleStatus}
                  onShowAll={handleShowAllStatuses}
                  onCleanOnly={handleCleanOnly}
                />
              </>
            )}

            <ResultsTable
              recommendations={filteredRecommendations}
              totalCount={elementFiltered.length}
              selectedSymbol={selectedRec?.elementSymbol ?? null}
              sorting={sorting}
              onSortingChange={setSorting}
              onRowClick={handleRowClick}
            />

            {selectedRec && (
              <Modal
                key={selectedRec.elementSymbol}
                onClose={() => setSelectedRec(null)}
                ariaLabel={`${selectedRec.elementSymbol} 간섭 상세`}
              >
                <DetailPanel
                  recommendation={selectedRec}
                  onClose={() => setSelectedRec(null)}
                />
              </Modal>
            )}

            {isPresetManagerOpen && (
              <Modal
                onClose={() => setIsPresetManagerOpen(false)}
                ariaLabel="보증 원소 프리셋 관리"
                widthClass="max-w-6xl"
              >
                <PresetManager
                  presets={presets}
                  onSave={handleSavePreset}
                  onDelete={handleDeletePreset}
                  onClose={() => setIsPresetManagerOpen(false)}
                />
              </Modal>
            )}

            {isCongenerPickerOpen && (
              <Modal
                onClose={() => setIsCongenerPickerOpen(false)}
                ariaLabel="동족 불순물 원소 선택"
                widthClass="max-w-6xl"
              >
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col leading-tight">
                      <h2 className="text-app-strong text-base font-semibold">
                        동족 불순물 원소 선택
                      </h2>
                      <span className="text-app-faint text-xs">
                        주기율표에서 불순물로 반영할 원소를 선택하세요 (농도는 패널에서 조정).
                      </span>
                    </div>
                    <button
                      type="button"
                      className="glass-btn px-3 py-1 text-sm"
                      onClick={() => setIsCongenerPickerOpen(false)}
                      aria-label="닫기"
                    >
                      ✕
                    </button>
                  </div>
                  <ElementPicker
                    selected={new Set(Object.keys(customCongeners))}
                    onToggle={handleToggleCustomCongener}
                    onClear={handleClearCustomCongeners}
                    onConfirm={() => setIsCongenerPickerOpen(false)}
                  />
                </div>
              </Modal>
            )}

            {isElementInputOpen && (
              <Modal
                onClose={() => setIsElementInputOpen(false)}
                ariaLabel="원소 직접 선택"
                widthClass="max-w-6xl"
              >
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col leading-tight">
                      <h2 className="text-app-strong text-base font-semibold">
                        원소 직접 선택
                      </h2>
                      <span className="text-app-faint text-xs">
                        검색·화학식으로 못 찾는 물질은 분석할 원소(중심금속 등)를 직접 고르세요.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="glass-btn px-3 py-1 text-sm"
                      onClick={() => setIsElementInputOpen(false)}
                      aria-label="닫기"
                    >
                      ✕
                    </button>
                  </div>
                  <ElementPicker
                    selected={manualElements}
                    onToggle={handleToggleManualElement}
                    onClear={handleClearManualElements}
                    allowAll
                  />
                  <div className="flex justify-end gap-2 border-t border-app pt-3">
                    <button
                      type="button"
                      className="glass-btn-primary px-5 py-2 text-sm font-medium"
                      onClick={handleConfirmManualElements}
                      disabled={manualElements.size === 0}
                      style={manualElements.size === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                    >
                      이 원소로 분석
                    </button>
                  </div>
                </div>
              </Modal>
            )}
          </main>
        </div>

        {/* Disclaimer — full width */}
        <DisclaimerBar />
      </div>
    </div>
  )
}
