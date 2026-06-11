import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  onClose: () => void
  ariaLabel?: string
  /** Tailwind max-width class for the dialog card. Defaults to 'max-w-3xl'. */
  widthClass?: string
  children: ReactNode
}

/**
 * Accessible centered modal dialog.
 * - ESC or backdrop click closes
 * - locks body scroll while open, restores on close
 * - moves focus to the dialog on open
 * Glass card themed via index.css variables.
 */
export function Modal({ onClose, ariaLabel, widthClass = 'max-w-3xl', children }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    cardRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      style={{
        background: 'rgba(2, 6, 23, 0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={cardRef}
        className={`surface-panel w-full ${widthClass} my-auto max-h-[90vh] overflow-y-auto outline-none`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
