import { useState } from 'react'

// TODO: Set theme based on media query
export function useTheme() {
  const [theme, setTheme] = useState('light')

  function toggle() {
    if (theme === 'light') {
      setTheme('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      setTheme('light')
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }

  return { toggle }
}
