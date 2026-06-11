import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { InstrumentCapabilities } from '../types'

interface ModeInfo {
  what: string
  when: string
}

interface Props {
  caps: InstrumentCapabilities
  onChange: (caps: InstrumentCapabilities) => void
}

export function ModeSelector({ caps, onChange }: Props) {
  const toggleKED = () => onChange({ ...caps, KED: !caps.KED })
  const toggleDRC = (gas: 'NH3' | 'O2' | 'H2') =>
    onChange({ ...caps, DRC: { ...caps.DRC, [gas]: !caps.DRC[gas] } })

  return (
    <section className="glass-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-app-strong text-sm font-semibold">측정 모드 가용성</h2>
        <span className="text-app-faint text-xs">장비 구성 기준</span>
      </div>

      {/* Standard — always ON, locked */}
      <div className="flex flex-wrap gap-4">
        <ModeItem
          label="Standard"
          description="항상 사용 가능 (고정)"
          info={{
            what: '셀에 반응/충돌 가스를 흘리지 않는 기본 모드. 감도(신호)가 가장 높음.',
            when: '분광 간섭이 거의 없는 원소, 최대 감도가 필요할 때.',
          }}
          isOn={true}
          locked={true}
          onToggle={() => {}}
        />
      </div>

      {/* DRC (반응 셀) — primary reaction modes */}
      <div className="flex flex-col gap-2 border-t border-app pt-3">
        <span className="text-app-muted text-xs font-semibold">DRC (반응 셀) — 보유 가스</span>
        <div className="flex flex-wrap gap-4">
          <ModeItem
            label="DRC(NH₃)"
            description="반응 셀 — 암모니아"
            info={{
              what: '셀에 암모니아를 넣어 화학 반응으로 간섭 이온을 제거.',
              when: 'Ca, Fe, K 등 Ar·산화물 계열 다원자 간섭이 심한 원소.',
            }}
            isOn={caps.DRC.NH3}
            locked={false}
            onToggle={() => toggleDRC('NH3')}
          />
          <ModeItem
            label="DRC(O₂)"
            description="반응 셀 — 산소"
            info={{
              what: 'O₂와 반응시켜 분석 원소를 산화물로 질량 이동(mass-shift)시켜 간섭에서 분리.',
              when: 'As, V, S, P, Si 등 질량 이동이 유리한 원소.',
            }}
            isOn={caps.DRC.O2}
            locked={false}
            onToggle={() => toggleDRC('O2')}
          />
          <ModeItem
            label="DRC(H₂)"
            description="반응 셀 — 수소"
            info={{
              what: 'H₂와 반응으로 아르곤 기반 간섭을 제거.',
              when: '⁴⁰Ca, Se 등 Ar(⁴⁰Ar·Ar₂) 간섭 원소.',
            }}
            isOn={caps.DRC.H2}
            locked={false}
            onToggle={() => toggleDRC('H2')}
          />
        </div>
      </div>

      {/* KED(He) — collision cell, moved to bottom, separated by divider */}
      <div className="flex flex-col gap-2 border-t border-app pt-3">
        <ModeItem
          label="KED(He)"
          description="충돌 셀 (He)"
          info={{
            what: 'He 충돌 + 운동에너지 판별(KED)로 다원자 간섭을 물리적으로 걸러내는 범용 모드.',
            when: '대부분의 다원자 간섭에 무난. 미지 시료 스크리닝/범용.',
          }}
          isOn={caps.KED}
          locked={false}
          onToggle={toggleKED}
        />
      </div>
    </section>
  )
}

interface ModeItemProps {
  label: string
  description: string
  info?: ModeInfo
  isOn: boolean
  locked: boolean
  onToggle: () => void
}

function ModeItem({ label, description, info, isOn, locked, onToggle }: ModeItemProps) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Toggle switch */}
      <div
        className={`toggle-track${isOn ? ' on' : ' off'}${locked ? ' pointer-events-none' : ''}`}
        onClick={locked ? undefined : onToggle}
        role={locked ? undefined : 'switch'}
        aria-checked={isOn}
        aria-label={`${label} ${isOn ? '켜짐' : '꺼짐'}${locked ? ' (고정)' : ''}`}
        tabIndex={locked ? -1 : 0}
        onKeyDown={(e) => {
          if (!locked && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onToggle()
          }
        }}
      >
        <div className="toggle-thumb" />
      </div>

      {/* Label */}
      <div className="flex flex-col leading-tight">
        <span
          className={`text-sm font-mono font-semibold ${
            isOn ? 'text-accent-strong' : 'text-app-faint'
          }${locked ? ' text-accent' : ''}`}
        >
          {label}
          {locked && <span className="ml-1 text-app-faintest text-xs font-sans">🔒</span>}
          {info && <InfoTip label={label} info={info} />}
        </span>
        <span className="text-app-faint text-xs">{description}</span>
      </div>
    </div>
  )
}

function InfoTip({ label, info }: { label: string; info: ModeInfo }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  const show = (x: number, y: number) => setPos({ x, y })
  const hide = () => setPos(null)

  return (
    <>
      <button
        type="button"
        className="ml-1 align-middle text-app-faint hover:text-accent text-xs font-sans cursor-help focus:outline-none focus:text-accent"
        aria-label={`${label} 설명`}
        onMouseEnter={(e) => show(e.clientX, e.clientY)}
        onMouseMove={(e) => show(e.clientX, e.clientY)}
        onMouseLeave={hide}
        onFocus={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          show(r.right, r.bottom)
        }}
        onBlur={hide}
        onClick={(e) => e.preventDefault()}
      >
        ⓘ
      </button>

      {pos &&
        createPortal(
          <div
            className="glass-card px-3 py-2 text-xs pointer-events-none"
            style={{
              position: 'fixed',
              left: Math.min(pos.x + 14, window.innerWidth - 250),
              top: pos.y + 14,
              zIndex: 60,
              maxWidth: 236,
            }}
          >
            <div className="text-app-strong font-semibold">{info.what}</div>
            <div className="text-app-faint mt-1">이럴 때: {info.when}</div>
          </div>,
          document.body,
        )}
    </>
  )
}
