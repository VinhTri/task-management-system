import { useEffect, useState } from 'react'
import { CheckCircle2, Copy, LockKeyhole, ShieldCheck, WalletCards } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { request } from '../../../shared/api/http'
import { PortalShell } from '../../../shared/components/PortalShell'
import type { AccountOverview } from '../../../shared/types/api'

export function WalletPage() {
  const navigate = useNavigate()
  const [account, setAccount] = useState<AccountOverview | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    request<AccountOverview>('customer', '/api/v1/account')
      .then((response) => {
        if (!response.data.pinConfigured) navigate('/customer/setup-pin', { replace: true })
        else setAccount(response.data)
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Không thể tải thông tin ví.'))
  }, [navigate])

  const wallet = account?.defaultWallet
  const balance = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: wallet?.currency || 'VND',
  }).format(wallet?.balance ?? 0)

  const copyAccountNumber = async () => {
    if (!account?.accountNumber) return
    await navigator.clipboard.writeText(account.accountNumber)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return <PortalShell portal="customer">
    <div className="welcome-row wallet-heading"><div><span className="eyebrow">TÀI SẢN CỦA BẠN</span><h1>Ví của tôi</h1><p>Theo dõi số dư và thông tin tài khoản thanh toán.</p></div></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!account && !error && <section className="content-card wallet-loading">Đang tải thông tin ví...</section>}
    {account && wallet && <div className="wallet-layout">
      <section className="wallet-balance-card">
        <div className="wallet-card-top"><span><WalletCards size={25} /></span><b>SMARTSPEND</b></div>
        <p>Số dư khả dụng</p><strong>{balance}</strong>
        <div className="wallet-account-number"><div><small>Số tài khoản</small><b>{account.accountNumber}</b></div><button type="button" onClick={copyAccountNumber} aria-label="Sao chép số tài khoản">{copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}</button></div>
      </section>
      <section className="content-card wallet-details-card">
        <div className="card-heading"><div><h3>Thông tin ví</h3><p>Ví được tạo tự động khi thiết lập mã PIN</p></div><span className="wallet-status"><ShieldCheck size={16} /> Mặc định</span></div>
        <dl className="wallet-details">
          <div><dt>Tên ví</dt><dd>{wallet.name}</dd></div><div><dt>Loại tiền</dt><dd>{wallet.currency}</dd></div><div><dt>Trạng thái</dt><dd>Đang hoạt động</dd></div><div><dt>Bảo vệ</dt><dd><LockKeyhole size={15} /> Không thể sửa hoặc xóa</dd></div>
        </dl>
      </section>
    </div>}
  </PortalShell>
}
