import { request } from './http'
import type { InternalTransfer, PageResult, WalletTransaction, WalletTransactionType } from '../types/api'

export interface WalletOperationPayload {
  amount: number
  pin: string
  description?: string
}

export interface InternalTransferPayload extends WalletOperationPayload {
  recipientAccountNumber: string
}

const mutation = <T>(path: string, idempotencyKey: string, payload: object) => request<T>(
  'customer',
  path,
  {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(payload),
  },
)

export const walletApi = {
  deposit: (key: string, payload: WalletOperationPayload) =>
    mutation<WalletTransaction>('/api/v1/wallets/default/deposits', key, payload),

  withdraw: (key: string, payload: WalletOperationPayload) =>
    mutation<WalletTransaction>('/api/v1/wallets/default/withdrawals', key, payload),

  transfer: (key: string, payload: InternalTransferPayload) =>
    mutation<InternalTransfer>('/api/v1/wallets/default/transfers', key, payload),

  transactions: (page = 0, size = 10, type?: WalletTransactionType) => {
    const query = new URLSearchParams({ page: String(page), size: String(size) })
    if (type) query.set('type', type)
    return request<PageResult<WalletTransaction>>(
      'customer',
      `/api/v1/wallets/default/transactions?${query.toString()}`,
    )
  },
}
