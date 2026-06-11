
export function DisclaimerBar() {
  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs text-center text-app-muted"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--border-app)',
      }}
      role="note"
      aria-label="면책 문구"
    >
      <span aria-hidden="true">⚠</span>
      <span>
        단위분해능(1 amu) 스크리닝 결과입니다. 실제 측정 전 반드시 장비에서 확인하세요.
      </span>
    </div>
  )
}
