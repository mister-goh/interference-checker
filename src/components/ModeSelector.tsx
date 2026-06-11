import type { InstrumentCapabilities } from '../types'

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
            isOn={caps.DRC.NH3}
            locked={false}
            onToggle={() => toggleDRC('NH3')}
          />
          <ModeItem
            label="DRC(O₂)"
            description="반응 셀 — 산소"
            isOn={caps.DRC.O2}
            locked={false}
            onToggle={() => toggleDRC('O2')}
          />
          <ModeItem
            label="DRC(H₂)"
            description="반응 셀 — 수소"
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
  isOn: boolean
  locked: boolean
  onToggle: () => void
}

function ModeItem({ label, description, isOn, locked, onToggle }: ModeItemProps) {
  return (
    <div className="flex items-center gap-2.5" title={description}>
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
        </span>
        <span className="text-app-faint text-xs">{description}</span>
      </div>
    </div>
  )
}
