import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, CheckCircle2, Copy, X } from 'lucide-react'
import type { WalletTransaction } from '../../../shared/types/api'
import { formatVnd } from '../../../shared/utils/currency'

interface Props {
  transaction: WalletTransaction | null
  onClose: () => void
}

const labels = {
  DEPOSIT: 'Nạp tiền', WITHDRAWAL: 'Rút tiền', TRANSFER_OUT: 'Chuyển đi', TRANSFER_IN: 'Nhận tiền',
} as const

const money = (value: number, _currency: string) => formatVnd(value)

const date = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'full', timeStyle: 'medium',
}).format(new Date(value))

export function TransactionDetailDrawer({ transaction, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!transaction) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose, transaction])

  if (!transaction) return null
  const incoming = transaction.type === 'DEPOSIT' || transaction.type === 'TRANSFER_IN'
  const reference = transaction.referenceCode
  const copyReference = async () => {
    await navigator.clipboard.writeText(reference)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return createPortal(<div className="transaction-drawer-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <aside className="transaction-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title">
      <div className="transaction-detail__top"><span>CHI TIẾT GIAO DỊCH</span><button onClick={onClose} aria-label="Đóng"><X size={19} /></button></div>
      <div className={`transaction-detail__hero ${incoming ? 'incoming' : 'outgoing'}`}>
        <h2 id="transaction-detail-title">{incoming ? '+' : '-'}{money(transaction.amount, transaction.currency)}</h2>
        <span className="transaction-detail__status"><CheckCircle2 size={15} /> Thành công</span>
      </div>
      <div className="transaction-detail__body"><dl>
        <div><dt>Mã giao dịch</dt><dd><span>{reference}</span><button onClick={copyReference} aria-label="Sao chép mã giao dịch">{copied ? <Check size={15} /> : <Copy size={15} />}</button></dd></div>
        {transaction.counterpartyAccountNumber && <div><dt>Tài khoản đối ứng</dt><dd>{transaction.counterpartyAccountNumber}</dd></div>}
        <div><dt>Số dư trước giao dịch</dt><dd>{money(transaction.balanceBefore, transaction.currency)}</dd></div>
        <div><dt>Số dư sau giao dịch</dt><dd>{money(transaction.balanceAfter, transaction.currency)}</dd></div>
        <div><dt>Thời gian</dt><dd>{date(transaction.createdAt)}</dd></div>
        <div><dt>Loại giao dịch</dt><dd><span className={`transaction-detail__type ${incoming ? 'incoming' : 'outgoing'}`}>{labels[transaction.type]}</span></dd></div>
        <div><dt>Nội dung</dt><dd>{transaction.description || 'Không có nội dung'}</dd></div>
      </dl></div>
      <button className="transaction-detail__done primary-button" onClick={onClose}>Đóng chi tiết</button>
    </aside>
  </div>, document.body)
}
