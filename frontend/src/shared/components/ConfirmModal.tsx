import { AlertTriangle, Trash2, X } from 'lucide-react'
import { Modal } from './Modal'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmModal({ open, title, message, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy', danger = false, busy = false, onConfirm, onClose }: Props) {
  return <Modal open={open} onClose={onClose} busy={busy} labelledBy="confirm-modal-title" className="confirm-modal">
    <button className="confirm-modal__close" type="button" onClick={onClose} disabled={busy} aria-label="Đóng"><X size={19} /></button>
    <div className={`confirm-modal__icon ${danger ? 'danger' : ''}`}><AlertTriangle size={25} /></div>
    <div className="confirm-modal__content">
      <span className={`confirm-modal__eyebrow ${danger ? 'danger' : ''}`}>{danger ? 'Hành động không thể hoàn tác' : 'Xác nhận thao tác'}</span>
      <h2 id="confirm-modal-title">{title}</h2>
      <p>{message}</p>
    </div>
    <div className="confirm-modal__actions">
      <button type="button" className="cancel" onClick={onClose} disabled={busy}>{cancelLabel}</button>
      <button type="button" className={`${danger ? 'danger' : 'confirm'}${danger && busy ? ' is-consuming' : ''}`} onClick={onConfirm} disabled={busy} aria-live="polite">
        {danger && busy ? <span className="confirm-delete-stage" aria-label="Đang xóa danh mục">
          <span className="confirm-delete-label" aria-hidden="true"><i>X</i><i>ó</i><i>a</i></span>
          <span className="confirm-delete-bin" aria-hidden="true">
            <span className="confirm-delete-bin__lid" />
            <span className="confirm-delete-bin__body"><span className="confirm-delete-bin__fill" /><span className="confirm-delete-bin__check">✓</span></span>
          </span>
          <span className="confirm-delete-success">Đã xóa thành công</span>
        </span> : <>
          {danger && <Trash2 size={18} />}
          <span>{busy ? 'Đang xử lý...' : confirmLabel}</span>
        </>}
      </button>
    </div>
  </Modal>
}
