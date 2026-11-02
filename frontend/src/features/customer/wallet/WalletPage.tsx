import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Copy, WalletCards } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { request } from '../../../shared/api/http'
import { PortalShell } from '../../../shared/components/PortalShell'
import { useNotification } from '../../../shared/components/NotificationProvider'
import type { AccountOverview, WalletTransaction } from '../../../shared/types/api'
import { WalletFlowCharts } from './WalletFlowCharts'
import { walletApi } from '../../../shared/api/wallet'
import { formatVnd } from '../../../shared/utils/currency'

export function WalletPage() {
  const navigate = useNavigate()
  const notify = useNotification()
  const [account, setAccount] = useState<AccountOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [chartsLoading, setChartsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const loadAccount = useCallback(async () => {
    const response = await request<AccountOverview>('customer', '/api/v1/account')
    if (!response.data.pinConfigured) {
      navigate('/customer/setup-pin', { replace: true })
      return
    }
    setAccount(response.data)
  }, [navigate])

  useEffect(() => {
    setLoading(true)
    loadAccount()
      .catch((reason) => notify({ type: 'error', message: reason instanceof Error ? reason.message : 'Không thể tải thông tin ví.' }))
      .finally(() => setLoading(false))
  }, [loadAccount, notify])

  useEffect(() => {
    setChartsLoading(true)
    walletApi.transactions(0, 100)
      .then((response) => setTransactions(response.data.content))
      .catch((reason) => notify({ type: 'error', message: reason instanceof Error ? reason.message : 'Không thể tải biểu đồ thu chi.' }))
      .finally(() => setChartsLoading(false))
  }, [notify])

  const wallet = account?.defaultWallet
  const balance = formatVnd(wallet?.balance ?? 0)

  const copyAccountNumber = async () => {
    if (!account?.accountNumber) return
    await navigator.clipboard.writeText(account.accountNumber)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return <PortalShell portal="customer">
    {loading && !account ? <section className="content-card wallet-loading">Đang tải thông tin ví...</section> : account && wallet && <div className="wallet-overview">
      <section className="wallet-balance-card">
        <div className="wallet-card-top"><span><WalletCards size={25} /></span><b>SMARTSPEND</b></div>
        <p>Số dư khả dụng</p><strong>{balance}</strong>
        <div className="wallet-card-meta"><span>{wallet.name}</span><i>•</i><span>{wallet.currency}</span><i>•</i><span>Đang hoạt động</span></div>
        <div className="wallet-account-number"><div><small>Số tài khoản · Ví mặc định</small><b>{account.accountNumber}</b></div><button type="button" onClick={copyAccountNumber} aria-label="Sao chép số tài khoản">{copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}</button></div>
      </section>
      <WalletFlowCharts transactions={transactions} currency={wallet.currency} loading={chartsLoading} />
    </div>}
  </PortalShell>
}
