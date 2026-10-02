export interface ApiResponse<T> {
  success: boolean
  code: string
  message: string
  data: T
  timestamp: string
}

export interface AuthTokens {
  accessToken: string
  accessTokenExpiresInSeconds: number
  refreshToken: string
  refreshTokenExpiresInSeconds: number
  tokenType: string
}

export interface CurrentUser {
  id: number
  email: string
  role: 'USER' | 'ADMIN'
}

export interface WalletDetails {
  id: number
  name: string
  balance: number
  currency: string
  defaultWallet: boolean
  locked: boolean
}

export interface AccountOverview {
  pinConfigured: boolean
  accountNumber: string | null
  defaultWallet: WalletDetails | null
}

export type CategoryType = 'INCOME' | 'EXPENSE'

export interface Category {
  id: number
  name: string
  type: CategoryType
  icon: string
  color: string
  version: number
}

export interface CategoryPayload {
  name: string
  type: CategoryType
  icon: string
  color: string
}

export interface LoginPayload {
  email: string
  password: string
}
