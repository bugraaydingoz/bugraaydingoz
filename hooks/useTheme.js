import { useState } from 'react'

function changeFavicon(theme) {
  const link =
    document.querySelector("link[rel*='icon']") ||
    document.createElement('link')
  link.type = 'image/x-icon'
  link.href = `/favicon-${theme}.ico`
  document.getElementsByTagName('head')[0].appendChild(link)
}

// TODO: Set theme based on media query
export function useTheme() {
  const [theme, setTheme] = useState('light')

  function toggle() {
    if (theme === 'light') {
      setTheme('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
      changeFavicon('dark')
    } else {
      setTheme('light')
      document.documentElement.setAttribute('data-theme', 'light')
      changeFavicon('light')
    }
  }

  return { toggle }
}
