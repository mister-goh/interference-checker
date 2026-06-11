import { useState } from 'react'
import type { Recommendation, Interference, Severity } from '../types'
import { explainRecommendation } from '../engine/recommend'
import { StatusBadge } from './StatusBadge'

interface Props {
  recommendation: Recommendation | null
  onClose: () => void
}

function SeverityPill({ severity }: { severity: Severity }) {
  const cls =
    severity === 'high' ? 'sev-high' : severity === 'medium' ? 'sev-medium' : 'sev-low'
  const label = severity === 'high' ? '높음' : severity === 'medium' ? '보통' : '낮음'
  return <span className={cls}>{label}</span>
}

function InterferenceTypeLabel({ type }: { type: Interference['type'] }) {
  if (type === 'isobaric') return <span className="text-violet-themed">동질량</span>
  if (type === 'polyatomic') return <span className="text-warn">다원자</span>
  return <span className="text-pink-themed">이중하전</span>
}

export function DetailPanel({ recommendation, onClose }: Props) {
  const [selectedMass, setSelectedMass] = useState<number | null>(null)
  if (!recommendation) return null

  const { elementSymbol, recommendedMass, status, recommendedMode, isotopes } = recommendation
  const activeMass = selectedMass ?? recommendedMass
  const activeIso = isotopes.find((i) => i.massNumber === activeMass) ?? isotopes[0]

  return (
    <div className="p-6 flex flex-col gap-5" aria-label={`${elementSymbol} 간섭 상세`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-3xl text-app-strong leading-none">{elementSymbol}</span>
          <div className="flex flex-col">
            <span className="text-app-muted text-xs">ICP-MS 동위원소 간섭 분석</span>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-app text-sm">
                추천 <span className="font-mono text-accent-strong font-semibold">m/z {recommendedMass}</span>
              </span>
              <StatusBadge status={status} />
              <span className="font-mono text-app-muted text-xs">{recommendedMode}</span>
            </div>
          </div>
        </div>
        <button
          className="glass-btn px-3 py-1.5 text-xs text-app shrink-0"
          onClick={onClose}
          aria-label="상세 팝업 닫기"
        >
          ✕ 닫기
        </button>
      </div>

      {/* Recommendation reason */}
      <div className="surface-subtle rounded-xl px-4 py-3 flex items-start gap-2.5">
        <span aria-hidden="true">💡</span>
        <p className="text-app text-sm leading-relaxed">{explainRecommendation(recommendation)}</p>
      </div>

      {/* Isotope list */}
      <div className="flex flex-col gap-2">
        <h3 className="text-app-muted text-xs font-semibold">
          동위원소 ({isotopes.length}) · 행을 선택하면 해당 질량의 간섭을 봅니다
        </h3>
        <div className="flex flex-col gap-1.5">
          {isotopes.map((iso) => {
            const isActive = iso.massNumber === activeMass
            return (
              <button
                key={iso.massNumber}
                type="button"
                onClick={() => setSelectedMass(iso.massNumber)}
                aria-pressed={isActive}
                className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 transition-colors ${
                  isActive ? 'surface-accent' : 'surface-subtle'
                }`}
                style={iso.isRecommended ? { boxShadow: 'inset 3px 0 0 var(--accent-strong)' } : undefined}
              >
                {/* mass */}
                <div className="w-16 shrink-0">
                  <div className="font-mono font-semibold text-app-strong text-sm">{iso.massNumber}</div>
                  <div className="text-app-faint text-[11px] font-mono">{iso.exactMass.toFixed(3)}</div>
                </div>
                {/* abundance */}
                <div className="w-24 shrink-0 hidden sm:block">
                  <div className="text-app text-xs mb-1">{iso.abundance.toFixed(2)}%</div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-app)' }}>
                    <div
                      className="h-1 rounded-full"
                      style={{ width: `${Math.min(iso.abundance, 100)}%`, background: 'var(--accent-strong)', opacity: 0.55 }}
                    />
                  </div>
                </div>
                {/* status */}
                <StatusBadge status={iso.status} />
                {/* right group */}
                <div className="ml-auto flex items-center gap-2.5">
                  <span className="font-mono text-app-muted text-xs hidden md:inline">{iso.recommendedMode}</span>
                  <span className="text-app-faint text-xs">{iso.interferences.length}건</span>
                  {iso.isRecommended && (
                    <span className="surface-accent text-accent text-[11px] font-semibold px-2 py-0.5 rounded-full">추천</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Interference detail for the active mass */}
      <div className="flex flex-col gap-2">
        <h3 className="text-app-muted text-xs font-semibold">
          m/z {activeMass} 간섭종 ({activeIso?.interferences.length ?? 0})
        </h3>
        {activeIso && activeIso.interferences.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {activeIso.interferences.map((ifc, idx) => (
              <div key={idx} className="surface-subtle rounded-lg px-3 py-2 flex items-center gap-3 flex-wrap text-xs">
                <span className="font-mono text-accent-strong">{ifc.composition}</span>
                <InterferenceTypeLabel type={ifc.type} />
                <SeverityPill severity={ifc.severity} />
                <span className="text-app-muted ml-auto">전구체 {ifc.precursorElements.join('·')}</span>
                <span className="text-app-faint">존재비 곱 {ifc.precursorAbundanceProduct.toFixed(3)}%</span>
                <span className="text-app-faint">{ifc.source === 'calculated' ? '계산' : '큐레이션'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-app-muted text-sm">이 질량에 대한 간섭종이 없습니다.</p>
        )}
      </div>

      {/* Hints for the active mass */}
      {activeIso && (activeIso.status === 'mode-required' || activeIso.status === 'difficult') && (
        <div className="surface-subtle rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs">
          <span className="text-warn" aria-hidden="true">⚠</span>
          <p className="text-app-muted leading-relaxed">
            DRC/KED 적용 시 장비에서 가용 가스 종류를 먼저 확인하세요.
            He KED는 비화학적 충돌 에너지 판별, NH₃/O₂/H₂ DRC는 반응 기반 제거입니다.
          </p>
        </div>
      )}

      {activeIso && activeIso.status === 'not-analyzable' && (
        <div className="surface-subtle rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs">
          <span className="text-violet-themed" aria-hidden="true">⊘</span>
          <p className="text-app-muted leading-relaxed">
            선택된 모드 조합으로는 제거할 수 없는 간섭입니다.
            측정 모드 가용성에서 KED 또는 DRC를 활성화하면 분석이 가능해질 수 있습니다.
            (수학적 보정 등 별도 기법은 본 도구 범위 밖)
          </p>
        </div>
      )}
    </div>
  )
}
