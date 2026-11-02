export type UserTheme = 'LIGHT' | 'DARK'

const LAST_THEME_KEY = 'smartspend-theme'

export function applyTheme(theme: UserTheme, userId?: number) {
  document.documentElement.dataset.theme = theme.toLowerCase()
  document.documentElement.style.colorScheme = theme.toLowerCase()
  window.localStorage.setItem(LAST_THEME_KEY, theme)
  if (userId) window.localStorage.setItem(`smartspend-theme-${userId}`, theme)
}

export function getCachedTheme(): UserTheme {
  return window.localStorage.getItem(LAST_THEME_KEY) === 'DARK' ? 'DARK' : 'LIGHT'
}
