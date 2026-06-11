/**
 * theme.ts — light/dark theme persistence + runtime application.
 *
 * Theme is applied via `data-theme` on <html>. index.html runs an inline script
 * before paint to avoid a flash; this module keeps React state in sync and
 * persists the choice. Default theme = light. No external dependencies.
 */
import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'isotope.theme.v1'

export function getStoredTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY)
    return t === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* localStorage unavailable — apply for this session only */
  }
}

/** Hook: current theme + toggle. Re-applies on mount to stay consistent. */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return { theme, toggleTheme }
}
