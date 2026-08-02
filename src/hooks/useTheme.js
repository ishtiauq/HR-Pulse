import { useState, useEffect } from 'react'

export function useTheme() {
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_theme')
    if (saved === 'system') return 'light'
    return saved || 'light'
  })

  const isDarkMode = themeMode === 'dark'

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light')
  }

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [isDarkMode])

  useEffect(() => {
    localStorage.setItem('hr_pulse_theme', themeMode)
  }, [themeMode])

  return { themeMode, isDarkMode, toggleTheme, setThemeMode }
}
