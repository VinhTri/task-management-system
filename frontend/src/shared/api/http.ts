import { sessionStore, type Portal } from '../auth/session'
import type { ApiResponse, AuthTokens } from '../types/api'
import { createClientId } from '../utils/id'

const apiRoots: Record<Portal, string> = {
  customer: import.meta.env.VITE_CUSTOMER_API_URL || '/customer-api',
  admin: import.meta.env.VITE_ADMIN_API_URL || '/admin-api',
}

export function apiAssetUrl(portal: Portal, path?: string | null): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${apiRoots[portal]}${path.startsWith('/') ? path : `/${path}`}`
}

const refreshInFlight: Partial<Record<Portal, Promise<AuthTokens>>> = {}
const DEVICE_ID_KEY = 'smartspend-device-id'

function getDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY)
  if (existing) return existing
  const created = createClientId()
  window.localStorage.setItem(DEVICE_ID_KEY, created)
  return created
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code = 'REQUEST_FAILED',
    public readonly retryAfterSeconds?: number,
  ) {
    super(message)
  }
}

function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds} giây`
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) return `${minutes} phút`
  const hours = Math.ceil(minutes / 60)
  return `${hours} giờ`
}

const parse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null
  if (!response.ok || !body?.success) {
    const retryMessage = body?.retryAfterSeconds
      ? ` Vui lòng thử lại sau ${formatRetryAfter(body.retryAfterSeconds)}.`
      : ''
    throw new ApiError(
      `${body?.message || 'Không thể kết nối đến máy chủ.'}${retryMessage}`,
      body?.code,
      body?.retryAfterSeconds,
    )
  }
  return body
}

async function refreshSession(portal: Portal): Promise<AuthTokens> {
  const current = sessionStore.get(portal)
  if (!current?.refreshToken) throw new ApiError('Phiên đăng nhập đã hết hạn.', 'SESSION_EXPIRED')

  const path = portal === 'admin' ? '/api/v1/admin/auth/refresh' : '/api/v1/auth/refresh'
  const response = await fetch(`${apiRoots[portal]}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: current.refreshToken }),
  })
  const result = await parse<AuthTokens>(response)
  sessionStore.set(portal, result.data)
  return result.data
}

async function getRefreshedSession(portal: Portal): Promise<AuthTokens> {
  if (!refreshInFlight[portal]) {
    refreshInFlight[portal] = refreshSession(portal).finally(() => {
      delete refreshInFlight[portal]
    })
  }
  return refreshInFlight[portal]
}

export async function request<T>(
  portal: Portal,
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const session = sessionStore.get(portal)
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  headers.set('X-Device-Id', getDeviceId())
  if (session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`)

  let response = await fetch(`${apiRoots[portal]}${path}`, { ...options, headers })
  const isAuthEndpoint = path.includes('/auth/login') || path.includes('/auth/register')
    || path.includes('/auth/refresh') || path.includes('/password/')

  if ((response.status === 401 || response.status === 403) && session && !isAuthEndpoint) {
    try {
      const refreshed = await getRefreshedSession(portal)
      headers.set('Authorization', `Bearer ${refreshed.accessToken}`)
      response = await fetch(`${apiRoots[portal]}${path}`, { ...options, headers })
    } catch {
      sessionStore.clear(portal)
      window.location.assign(`/${portal}/login`)
      throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'SESSION_EXPIRED')
    }
  }

  return parse<T>(response)
}

export async function login(
  portal: Portal,
  email: string,
  password: string,
): Promise<AuthTokens> {
  const path = portal === 'admin' ? '/api/v1/admin/auth/login' : '/api/v1/auth/login'
  const response = await request<AuthTokens>(portal, path, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  sessionStore.set(portal, response.data)
  return response.data
}

export async function logout(portal: Portal): Promise<void> {
  const session = sessionStore.get(portal)
  if (session) {
    const path = portal === 'admin' ? '/api/v1/admin/auth/logout' : '/api/v1/auth/logout'
    await request<void>(portal, path, {
      method: 'POST',
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    }).catch(() => undefined)
  }
  sessionStore.clear(portal)
}
