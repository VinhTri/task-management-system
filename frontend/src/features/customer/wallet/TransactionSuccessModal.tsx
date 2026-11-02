import { CheckCircle2 } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'

interface Props {
  open: boolean
  title: string
  amount: string
  message: string
  onClose: () => void
}

export function TransactionSuccessModal({ open, title, amount, message, onClose }: Props) {
  return <Modal open={open} onClose={onClose} labelledBy="transaction-success-title" className="transaction-success-modal">
    <div className="transaction-success"><span><CheckCircle2 size={34} /></span><small>GIAO DỊCH THÀNH CÔNG</small><h2 id="transaction-success-title">{title}</h2><strong>{amount}</strong><p>{message}</p><button className="primary-button" onClick={onClose}>Hoàn tất</button></div>
  </Modal>
}
