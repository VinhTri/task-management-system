import type { AuthTokens } from '../types/api'

export type Portal = 'customer' | 'admin'

const keyFor = (portal: Portal) => `smartspend:${portal}:session`

export const sessionStore = {
  get(portal: Portal): AuthTokens | null {
    const value = localStorage.getItem(keyFor(portal))
    if (!value) return null
    try {
      return JSON.parse(value) as AuthTokens
    } catch {
      localStorage.removeItem(keyFor(portal))
      return null
    }
  },
  set(portal: Portal, tokens: AuthTokens) {
    localStorage.setItem(keyFor(portal), JSON.stringify(tokens))
  },
  clear(portal: Portal) {
    localStorage.removeItem(keyFor(portal))
  },
}
