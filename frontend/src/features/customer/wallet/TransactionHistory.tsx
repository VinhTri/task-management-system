import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown, Inbox, RefreshCw, Search } from 'lucide-react'
import type { PageResult, WalletTransaction, WalletTransactionType } from '../../../shared/types/api'
import { TransactionDetailDrawer } from './TransactionDetailDrawer'
import { formatVnd } from '../../../shared/utils/currency'

interface Props {
  result: PageResult<WalletTransaction> | null
  loading: boolean
  type: WalletTransactionType | ''
  onTypeChange: (type: WalletTransactionType | '') => void
  onPageChange: (page: number) => void
  onRefresh: () => void
}

const labels: Record<WalletTransactionType, string> = {
  DEPOSIT: 'Nạp tiền', WITHDRAWAL: 'Rút tiền', TRANSFER_OUT: 'Chuyển đi', TRANSFER_IN: 'Nhận tiền',
}

const money = (value: number, _currency: string) => formatVnd(value)

const date = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(value))

export function TransactionHistory({ result, loading, type, onTypeChange, onPageChange, onRefresh }: Props) {
  const [keyword, setKeyword] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null)

  const transactions = useMemo(() => {
    const query = keyword.trim().toLocaleLowerCase('vi')
    return (result?.content ?? []).filter((transaction) => {
      const searchable = [transaction.description, transaction.referenceCode,
        transaction.counterpartyAccountNumber, labels[transaction.type]].filter(Boolean).join(' ').toLocaleLowerCase('vi')
      return (!query || searchable.includes(query)) && (!selectedDate || transaction.createdAt.slice(0, 10) === selectedDate)
    })
  }, [keyword, result, selectedDate])

  return <div className="wallet-history">
    <div className="history-toolbar">
      <label className="history-search"><Search size={17} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Nội dung, mã tham chiếu..." /></label>
      <label className="history-filter"><select aria-label="Lọc loại giao dịch" value={type} onChange={(event) => onTypeChange(event.target.value as WalletTransactionType | '')}><option value="">Tất cả giao dịch</option><option value="DEPOSIT">Nạp tiền</option><option value="WITHDRAWAL">Rút tiền</option><option value="TRANSFER_OUT">Chuyển đi</option><option value="TRANSFER_IN">Nhận tiền</option></select><ChevronDown className="history-filter__chevron" size={16} /></label>
      <label className="history-date"><CalendarDays size={17} /><input type="date" aria-label="Lọc theo ngày" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
      <div className="history-toolbar-actions">{(keyword || selectedDate || type) && <button className="history-clear" onClick={() => { setKeyword(''); setSelectedDate(''); onTypeChange('') }}>Xóa bộ lọc</button>}<button className="history-refresh history-refresh--label" onClick={onRefresh} disabled={loading}><RefreshCw size={16} className={loading ? 'is-spinning' : ''} /> Làm mới</button></div>
    </div>

    {loading ? <div className="wallet-history__empty">Đang tải giao dịch...</div>
      : !transactions.length ? <div className="wallet-history__empty"><Inbox size={34} /><strong>Không tìm thấy giao dịch</strong><span>Hãy thử thay đổi điều kiện tìm kiếm hoặc bộ lọc.</span></div>
        : <div className="history-table-wrap"><table className="history-table">
          <thead><tr><th>Thời gian</th><th>Loại giao dịch</th><th>Nội dung</th><th>Mã giao dịch</th><th>Số dư</th><th className="history-align-right">Số tiền</th></tr></thead>
          <tbody>{transactions.map((transaction) => {
            const incoming = transaction.type === 'DEPOSIT' || transaction.type === 'TRANSFER_IN'
            return <tr key={transaction.id} className="history-table__row" tabIndex={0} onClick={() => setSelectedTransaction(transaction)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedTransaction(transaction) } }}>
              <td className="history-nowrap">{date(transaction.createdAt)}</td>
              <td><span className={`history-type ${incoming ? 'history-type--in' : 'history-type--out'}`}>{labels[transaction.type]}</span></td>
              <td className="history-description"><strong>{transaction.description || 'Không có nội dung'}</strong>{transaction.counterpartyAccountNumber && <small>Đối ứng: {transaction.counterpartyAccountNumber}</small>}</td>
              <td className="history-reference">{transaction.referenceCode}</td>
              <td className="history-nowrap">{money(transaction.balanceAfter, transaction.currency)}</td>
              <td className={`history-amount ${incoming ? 'positive' : 'negative'}`}>{incoming ? '+' : '-'}{money(transaction.amount, transaction.currency)}</td>
            </tr>
          })}</tbody>
        </table></div>}

    {result && <div className="wallet-pagination"><span>Hiển thị {transactions.length} / {result.totalElements} giao dịch</span><div><button disabled={result.first || loading} onClick={() => onPageChange(result.number - 1)} aria-label="Trang trước"><ArrowLeft size={15} /></button><b>{result.number + 1}</b><span>/ {Math.max(result.totalPages, 1)}</span><button disabled={result.last || loading} onClick={() => onPageChange(result.number + 1)} aria-label="Trang sau"><ArrowRight size={15} /></button></div></div>}
    <TransactionDetailDrawer transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
  </div>
}
