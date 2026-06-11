interface ActiveCongener {
  host: string | null
  symbol: string
  pct: number
  source: 'auto' | 'custom'
}

interface Props {
  enabled: boolean
  onToggle: () => void
  active: ActiveCongener[]
  hasCompound: boolean
  onPctChange: (symbol: string, pct: number) => void
  onRemoveCustom: (symbol: string) => void
  onOpenPicker: () => void
}

function PctInput({
  symbol,
  pct,
  onPctChange,
}: {
  symbol: string
  pct: number
  onPctChange: (symbol: string, pct: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        max={100}
        step={0.1}
        value={pct}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (!Number.isNaN(v)) onPctChange(symbol, Math.min(100, Math.max(0, v)))
        }}
        className="glass-input px-2 py-1 w-20 text-sm text-right font-mono"
        aria-label={`${symbol} 불순물 농도 (%)`}
      />
      <span className="text-app-muted text-xs">%</span>
    </div>
  )
}

/**
 * Congener (same-group) impurity reflection panel (sidebar).
 * Auto congeners come from the compound's elements (curated map); custom
 * congeners are user-picked from the periodic table. Both adjust impurity %.
 */
export function CongenerPanel({
  enabled,
  onToggle,
  active,
  hasCompound,
  onPctChange,
  onRemoveCustom,
  onOpenPicker,
}: Props) {
  const autoCongeners = active.filter((c) => c.source === 'auto')
  const customCongeners = active.filter((c) => c.source === 'custom')

  return (
    <section className="glass-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col leading-tight">
          <h2 className="text-app-strong text-sm font-semibold">동족 불순물 반영</h2>
          <span className="text-app-faint text-xs">
            중심금속의 동족(예: Hf 속 Zr) + 사용자 지정 불순물
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={onToggle}
          className={`text-xs font-semibold px-3 py-1 rounded-md border whitespace-nowrap ${
            enabled ? 'border-accent-strong text-accent-strong' : 'border-app text-app-muted'
          }`}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {enabled && (
        <div className="flex flex-col gap-3 border-t border-app pt-3">
          {/* Auto congeners (from compound) */}
          <div className="flex flex-col gap-2">
            <span className="text-app-muted text-xs">자동 동족 (화합물 기반)</span>
            {!hasCompound ? (
              <p className="text-app-faint text-xs">화학식을 입력하면 표시됩니다.</p>
            ) : autoCongeners.length === 0 ? (
              <p className="text-app-faint text-xs">이 화합물에는 등록된 동족 원소가 없습니다.</p>
            ) : (
              autoCongeners.map((c) => (
                <div key={c.symbol} className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-app">
                    {c.host} <span className="text-app-faint">→</span>{' '}
                    <span className="text-accent-strong font-semibold">{c.symbol}</span>
                  </span>
                  <div className="ml-auto">
                    <PctInput symbol={c.symbol} pct={c.pct} onPctChange={onPctChange} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Custom congeners (user-picked) */}
          <div className="flex flex-col gap-2 border-t border-app pt-3">
            <span className="text-app-muted text-xs">사용자 지정 불순물</span>
            {customCongeners.length === 0 ? (
              <p className="text-app-faint text-xs">
                주기율표에서 추가한 원소가 여기에 표시됩니다.
              </p>
            ) : (
              customCongeners.map((c) => (
                <div key={c.symbol} className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-accent-strong font-semibold">{c.symbol}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <PctInput symbol={c.symbol} pct={c.pct} onPctChange={onPctChange} />
                    <button
                      type="button"
                      onClick={() => onRemoveCustom(c.symbol)}
                      className="text-app-muted hover:text-err text-sm leading-none px-1"
                      aria-label={`${c.symbol} 제거`}
                      title="제거"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
            <button
              type="button"
              onClick={onOpenPicker}
              className="glass-btn px-3 py-1.5 text-xs self-start"
            >
              주기율표에서 원소 추가
            </button>
          </div>

          <p className="text-app-faintest text-xs">
            기본값은 보수적 추정치입니다. 시약 CoA 값으로 조정하세요. 정량 예측이 아닌 가능성
            경보입니다.
          </p>
        </div>
      )}
    </section>
  )
}
