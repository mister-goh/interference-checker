
interface Props {
  disabled: boolean
  onExportCsv: () => void
  onExportExcel: () => void
}

export function ExportButton({ disabled, onExportCsv, onExportExcel }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-app-muted text-xs hidden sm:inline">내보내기:</span>
      <button
        className="glass-btn px-4 py-2 text-xs"
        onClick={onExportCsv}
        disabled={disabled}
        style={disabled ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
        aria-label="CSV로 내보내기"
      >
        CSV
      </button>
      <button
        className="glass-btn px-4 py-2 text-xs"
        onClick={onExportExcel}
        disabled={disabled}
        style={disabled ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
        aria-label="Excel로 내보내기"
      >
        Excel
      </button>
    </div>
  )
}
