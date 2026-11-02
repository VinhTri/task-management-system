import { useCallback, useEffect, useState } from 'react'
import { walletApi } from '../../../shared/api/wallet'
import { PortalShell } from '../../../shared/components/PortalShell'
import { useNotification } from '../../../shared/components/NotificationProvider'
import type { PageResult, WalletTransaction, WalletTransactionType } from '../../../shared/types/api'
import { TransactionHistory } from './TransactionHistory'

export function TransactionHistoryPage() {
  const notify = useNotification()
  const [result, setResult] = useState<PageResult<WalletTransaction> | null>(null)
  const [type, setType] = useState<WalletTransactionType | ''>('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const response = await walletApi.transactions(page, 10, type || undefined)
      setResult(response.data)
    } catch (reason) {
      notify({ type: 'error', message: reason instanceof Error ? reason.message : 'Không thể tải lịch sử giao dịch.' })
    } finally {
      setLoading(false)
    }
  }, [notify, page, type])

  useEffect(() => { void loadTransactions() }, [loadTransactions])

  return <PortalShell portal="customer">
    <section className="content-card history-page-card">
      <TransactionHistory result={result} loading={loading} type={type} onTypeChange={(nextType) => { setType(nextType); setPage(0) }} onPageChange={setPage} onRefresh={() => void loadTransactions()} />
    </section>
  </PortalShell>
}
