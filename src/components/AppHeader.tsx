import type { Theme } from '../lib/theme'

interface Props {
  theme: Theme
  onToggleTheme: () => void
}

export function AppHeader({ theme, onToggleTheme }: Props) {
  const isDark = theme === 'dark'
  return (
    <header className="glass-card px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
          style={{
            background: 'rgba(56, 189, 248, 0.22)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            color: 'var(--accent)',
          }}
          aria-hidden="true"
        >
          ⚛
        </div>
        <div>
          <h1 className="text-app-strong font-bold text-lg leading-tight">
            Interference Checker
          </h1>
          <p className="text-accent text-xs">ICP-MS 동위원소 간섭 분석</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-app-muted text-xs">
          <span>단위분해능 1 amu</span>
          <span className="opacity-40">·</span>
          <span>쿼드러폴 전용</span>
        </div>

        {/* Theme toggle (light ⇄ dark) */}
        <button
          className="glass-btn w-9 h-9 flex items-center justify-center text-base"
          onClick={onToggleTheme}
          role="switch"
          aria-checked={isDark}
          aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
          title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {isDark ? '☀' : '☾'}
        </button>
      </div>
    </header>
  )
}
