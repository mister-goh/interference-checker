import type { MatrixState } from '../types'

interface Props {
  matrix: MatrixState
  onChange: (key: keyof MatrixState, value: boolean) => void
}

const MATRIX_ELEMENTS: { key: keyof MatrixState; label: string; description: string; locked?: boolean }[] = [
  { key: 'Ar', label: 'Ar', description: '플라즈마 (고정)', locked: true },
  { key: 'H',  label: 'H',  description: '물/질산 유래' },
  { key: 'N',  label: 'N',  description: '질산 유래' },
  { key: 'O',  label: 'O',  description: '물/질산 유래' },
  { key: 'C',  label: 'C',  description: '유기물 유래' },
  { key: 'Cl', label: 'Cl', description: 'HCl 함유 매트릭스' },
]

export function MatrixToggle({ matrix, onChange }: Props) {
  return (
    <section className="glass-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-app-strong text-sm font-semibold">
          배경 매트릭스
        </h2>
        <span className="text-app-faint text-xs">HNO₃ 희석 기준</span>
      </div>

      <div className="flex flex-wrap gap-4">
        {MATRIX_ELEMENTS.map(({ key, label, description, locked }) => {
          const isOn = matrix[key]
          return (
            <div
              key={key}
              className="flex items-center gap-2.5"
              title={description}
            >
              {/* Toggle switch */}
              <div
                className={`toggle-track${isOn ? ' on' : ' off'}${locked ? ' pointer-events-none' : ''}`}
                onClick={() => !locked && onChange(key, !isOn)}
                role={locked ? undefined : 'switch'}
                aria-checked={isOn}
                aria-label={`${label} 매트릭스 ${isOn ? '켜짐' : '꺼짐'}${locked ? ' (고정)' : ''}`}
                tabIndex={locked ? -1 : 0}
                onKeyDown={(e) => {
                  if (!locked && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onChange(key, !isOn)
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
                  {locked && (
                    <span className="ml-1 text-app-faintest text-xs font-sans">🔒</span>
                  )}
                </span>
                <span className="text-app-faint text-xs">{description}</span>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-app-faintest text-xs">
        * C는 화합물에 C 포함 시 자동 ON — 이후 사용자 설정이 우선됩니다
      </p>
    </section>
  )
}
