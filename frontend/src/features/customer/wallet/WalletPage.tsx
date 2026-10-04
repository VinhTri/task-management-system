import { useCallback, useEffect, useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Copy, LockKeyhole, Send, ShieldCheck, WalletCards } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { request } from '../../../shared/api/http'
import { walletApi } from '../../../shared/api/wallet'
import { PortalShell } from '../../../shared/components/PortalShell'
import type { AccountOverview, PageResult, WalletTransaction, WalletTransactionType } from '../../../shared/types/api'
import { TransactionHistory } from './TransactionHistory'
import { WalletOperationModal, type WalletOperation } from './WalletOperationModal'

export function WalletPage() {
  const navigate = useNavigate()
  const [account, setAccount] = useState<AccountOverview | null>(null)
  const [transactions, setTransactions] = useState<PageResult<WalletTransaction> | null>(null)
  const [operation, setOperation] = useState<WalletOperation | null>(null)
  const [transactionType, setTransactionType] = useState<WalletTransactionType | ''>('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const loadAccount = useCallback(async () => {
    const response = await request<AccountOverview>('customer', '/api/v1/account')
    if (!response.data.pinConfigured) {
      navigate('/customer/setup-pin', { replace: true })
      return
    }
    setAccount(response.data)
  }, [navigate])

  const loadTransactions = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const response = await walletApi.transactions(page, 10, transactionType || undefined)
      setTransactions(response.data)
    } finally {
      setHistoryLoading(false)
    }
  }, [page, transactionType])

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([loadAccount(), loadTransactions()])
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Không thể tải thông tin ví.'))
      .finally(() => setLoading(false))
  }, [loadAccount, loadTransactions])

  const refresh = async () => {
    setError('')
    try {
      await Promise.all([loadAccount(), loadTransactions()])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật dữ liệu ví.')
    }
  }

  const transactionSucceeded = (successMessage: string) => {
    setOperation(null)
    setMessage(successMessage)
    setPage(0)
    void refresh()
    window.setTimeout(() => setMessage(''), 3500)
  }

  const wallet = account?.defaultWallet
  const balance = new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: wallet?.currency || 'VND', maximumFractionDigits: 0,
  }).format(wallet?.balance ?? 0)

  const copyAccountNumber = async () => {
    if (!account?.accountNumber) return
    await navigator.clipboard.writeText(account.accountNumber)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return <PortalShell portal="customer">
    <div className="welcome-row wallet-heading"><div><span className="eyebrow">TÀI SẢN CỦA BẠN</span><h1>Ví của tôi</h1><p>Nạp, rút, chuyển khoản và theo dõi biến động số dư.</p></div></div>
    {error && <p className="form-error wallet-notice" role="alert">{error}</p>}
    {message && <p className="form-success wallet-notice"><CheckCircle2 size={17} /> {message}</p>}
    {loading && !account ? <section className="content-card wallet-loading">Đang tải thông tin ví...</section> : account && wallet && <>
      <div className="wallet-layout">
        <section className="wallet-balance-card">
          <div className="wallet-card-top"><span><WalletCards size={25} /></span><b>SMARTSPEND</b></div>
          <p>Số dư khả dụng</p><strong>{balance}</strong>
          <div className="wallet-account-number"><div><small>Số tài khoản</small><b>{account.accountNumber}</b></div><button type="button" onClick={copyAccountNumber} aria-label="Sao chép số tài khoản">{copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}</button></div>
        </section>
        <section className="content-card wallet-details-card">
          <div className="card-heading"><div><h3>Thông tin ví</h3><p>Ví được tạo tự động khi thiết lập mã PIN</p></div><span className="wallet-status"><ShieldCheck size={16} /> Mặc định</span></div>
          <dl className="wallet-details"><div><dt>Tên ví</dt><dd>{wallet.name}</dd></div><div><dt>Loại tiền</dt><dd>{wallet.currency}</dd></div><div><dt>Trạng thái</dt><dd>Đang hoạt động</dd></div><div><dt>Bảo vệ</dt><dd><LockKeyhole size={15} /> Không thể sửa hoặc xóa</dd></div></dl>
        </section>
      </div>

      <section className="wallet-actions" aria-label="Thao tác ví">
        <button onClick={() => setOperation('deposit')}><span className="deposit"><ArrowDownToLine /></span><div><strong>Nạp tiền</strong><small>Bổ sung số dư vào ví</small></div></button>
        <button onClick={() => setOperation('withdraw')}><span className="withdraw"><ArrowUpFromLine /></span><div><strong>Rút tiền</strong><small>Rút từ số dư khả dụng</small></div></button>
        <button onClick={() => setOperation('transfer')}><span className="transfer"><Send /></span><div><strong>Chuyển khoản</strong><small>Gửi đến tài khoản SmartSpend</small></div></button>
      </section>

      <TransactionHistory result={transactions} loading={historyLoading} type={transactionType} onTypeChange={(type) => { setTransactionType(type); setPage(0) }} onPageChange={setPage} onRefresh={() => void refresh()} />
    </>}
    {operation && wallet && <WalletOperationModal operation={operation} balance={wallet.balance} onClose={() => setOperation(null)} onSuccess={transactionSucceeded} />}
  </PortalShell>
}
