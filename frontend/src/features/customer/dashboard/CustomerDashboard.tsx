import { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, PiggyBank, TrendingUp, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { request } from '../../../shared/api/http'
import { PortalShell } from '../../../shared/components/PortalShell'
import type { AccountOverview } from '../../../shared/types/api'
import { formatVnd } from '../../../shared/utils/currency'

const transactions = [
  { name: 'Lương tháng 9', category: 'Thu nhập', amount: `+${formatVnd(24_000_000)}`, positive: true },
  { name: 'Siêu thị cuối tuần', category: 'Ăn uống', amount: `-${formatVnd(1_240_000)}` },
  { name: 'Netflix', category: 'Giải trí', amount: `-${formatVnd(260_000)}` },
]

export function CustomerDashboard() {
  const navigate = useNavigate()
  const [account, setAccount] = useState<AccountOverview | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    request<AccountOverview>('customer', '/api/v1/account')
      .then((response) => {
        if (!response.data.pinConfigured) navigate('/customer/setup-pin', { replace: true })
        else setAccount(response.data)
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Không thể tải tài khoản.'))
  }, [navigate])

  const balance = formatVnd(account?.defaultWallet?.balance ?? 0)

  return <PortalShell portal="customer">
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="metric-grid">
      <article className="metric-card featured"><span><Wallet /></span><p>{account?.defaultWallet?.name || 'Ví mặc định'}</p><strong>{balance}</strong><small>STK: {account?.accountNumber || 'Đang tải...'}</small></article>
      <article className="metric-card"><span className="green"><ArrowDownLeft /></span><p>Thu nhập tháng</p><strong>{formatVnd(28_000_000)}</strong><small>2 khoản thu</small></article>
      <article className="metric-card"><span className="orange"><ArrowUpRight /></span><p>Chi tiêu tháng</p><strong>{formatVnd(12_860_000)}</strong><small>18 giao dịch</small></article>
      <article className="metric-card"><span className="purple"><PiggyBank /></span><p>Tiết kiệm</p><strong>{formatVnd(15_140_000)}</strong><small>54% thu nhập</small></article>
    </div>
    <div className="dashboard-grid">
      <section className="content-card"><div className="card-heading"><div><h3>Dòng tiền</h3><p>6 tháng gần nhất</p></div><button>6 tháng <Chevron /></button></div><div className="chart"><div style={{height:'46%'}} /><div style={{height:'61%'}} /><div style={{height:'54%'}} /><div style={{height:'78%'}} /><div style={{height:'68%'}} /><div className="current" style={{height:'88%'}} /></div><div className="chart-labels"><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>T8</span><span>T9</span></div></section>
      <section className="content-card"><div className="card-heading"><div><h3>Giao dịch gần đây</h3><p>Cập nhật mới nhất</p></div><a>Xem tất cả</a></div><div className="transaction-list">{transactions.map((item) => <div className="transaction" key={item.name}><span className={`transaction__icon ${item.positive ? 'income' : ''}`}>{item.positive ? <ArrowDownLeft /> : <ArrowUpRight />}</span><div><strong>{item.name}</strong><small>{item.category}</small></div><b className={item.positive ? 'positive' : ''}>{item.amount}</b></div>)}</div></section>
    </div>
  </PortalShell>
}

function Chevron() { return <span aria-hidden>⌄</span> }
