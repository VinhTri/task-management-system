import { ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, Inbox, RefreshCw, Send } from 'lucide-react'
import type { PageResult, WalletTransaction, WalletTransactionType } from '../../../shared/types/api'

interface Props {
  result: PageResult<WalletTransaction> | null
  loading: boolean
  type: WalletTransactionType | ''
  onTypeChange: (type: WalletTransactionType | '') => void
  onPageChange: (page: number) => void
  onRefresh: () => void
}

const labels: Record<WalletTransactionType, string> = {
  DEPOSIT: 'Nạp tiền',
  WITHDRAWAL: 'Rút tiền',
  TRANSFER_OUT: 'Chuyển tiền',
  TRANSFER_IN: 'Nhận tiền',
}

const money = (value: number, currency: string) => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency, maximumFractionDigits: 0,
}).format(value)

const date = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short', timeStyle: 'short',
}).format(new Date(value))

function TypeIcon({ type }: { type: WalletTransactionType }) {
  if (type === 'DEPOSIT') return <ArrowDownLeft />
  if (type === 'WITHDRAWAL') return <ArrowUpRight />
  return type === 'TRANSFER_IN' ? <ArrowDownLeft /> : <Send />
}

export function TransactionHistory({ result, loading, type, onTypeChange, onPageChange, onRefresh }: Props) {
  return <section className="content-card wallet-history">
    <div className="wallet-history__head"><div><h3>Lịch sử giao dịch</h3><p>Theo dõi toàn bộ biến động của ví.</p></div><div><select value={type} onChange={(event) => onTypeChange(event.target.value as WalletTransactionType | '')}><option value="">Tất cả</option><option value="DEPOSIT">Nạp tiền</option><option value="WITHDRAWAL">Rút tiền</option><option value="TRANSFER_OUT">Chuyển đi</option><option value="TRANSFER_IN">Nhận tiền</option></select><button onClick={onRefresh} aria-label="Tải lại"><RefreshCw size={16} /></button></div></div>

    {loading ? <div className="wallet-history__empty">Đang tải giao dịch...</div>
      : !result?.content.length ? <div className="wallet-history__empty"><Inbox size={34} /><strong>Chưa có giao dịch</strong><span>Các giao dịch thành công sẽ xuất hiện tại đây.</span></div>
        : <div className="wallet-history__list">{result.content.map((transaction) => {
          const incoming = transaction.type === 'DEPOSIT' || transaction.type === 'TRANSFER_IN'
          return <article className="wallet-transaction" key={transaction.id}>
            <span className={`wallet-transaction__icon ${incoming ? 'incoming' : 'outgoing'}`}><TypeIcon type={transaction.type} /></span>
            <div className="wallet-transaction__main"><strong>{labels[transaction.type]}</strong><small>{transaction.description || 'Không có nội dung'} · {date(transaction.createdAt)}</small>{transaction.counterpartyAccountNumber && <small>Đối ứng: {transaction.counterpartyAccountNumber}</small>}</div>
            <div className="wallet-transaction__reference"><small>{transaction.transferReference || transaction.referenceCode}</small><span>Số dư: {money(transaction.balanceAfter, transaction.currency)}</span></div>
            <b className={incoming ? 'positive' : 'negative'}>{incoming ? '+' : '-'}{money(transaction.amount, transaction.currency)}</b>
          </article>
        })}</div>}

    {result && result.totalPages > 1 && <div className="wallet-pagination"><button disabled={result.first || loading} onClick={() => onPageChange(result.number - 1)}><ArrowLeft size={15} /> Trước</button><span>Trang {result.number + 1}/{result.totalPages}</span><button disabled={result.last || loading} onClick={() => onPageChange(result.number + 1)}>Sau <ArrowRight size={15} /></button></div>}
  </section>
}
