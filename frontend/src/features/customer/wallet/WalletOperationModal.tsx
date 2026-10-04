import { type FormEvent, useEffect, useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, Send, X } from 'lucide-react'
import { walletApi } from '../../../shared/api/wallet'

export type WalletOperation = 'deposit' | 'withdraw' | 'transfer'

interface Props {
  operation: WalletOperation
  balance: number
  onClose: () => void
  onSuccess: (message: string) => void
}

const content = {
  deposit: {
    title: 'Nạp tiền',
    description: 'Bổ sung tiền vào ví SmartSpend của bạn.',
    button: 'Xác nhận nạp tiền',
    Icon: ArrowDownToLine,
  },
  withdraw: {
    title: 'Rút tiền',
    description: 'Rút tiền từ số dư khả dụng trong ví.',
    button: 'Xác nhận rút tiền',
    Icon: ArrowUpFromLine,
  },
  transfer: {
    title: 'Chuyển khoản nội bộ',
    description: 'Chuyển tiền tức thì đến một tài khoản SmartSpend.',
    button: 'Xác nhận chuyển tiền',
    Icon: Send,
  },
}

export function WalletOperationModal({ operation, balance, onClose, onSuccess }: Props) {
  const config = content[operation]
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [description, setDescription] = useState('')
  const [recipientAccountNumber, setRecipientAccountNumber] = useState('')
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && !saving) onClose() }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose, saving])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    const value = Number(amount)
    if (!Number.isFinite(value) || value < 1000) {
      setError('Số tiền tối thiểu là 1.000đ.')
      return
    }
    if ((operation === 'withdraw' || operation === 'transfer') && value > balance) {
      setError('Số dư khả dụng không đủ.')
      return
    }
    if (!/^\d{6}$/.test(pin)) {
      setError('Mã PIN phải gồm đúng 6 chữ số.')
      return
    }
    if (operation === 'transfer' && !/^\d{12}$/.test(recipientAccountNumber)) {
      setError('Số tài khoản nhận phải gồm đúng 12 chữ số.')
      return
    }

    setSaving(true)
    try {
      const common = { amount: value, pin, description: description.trim() || undefined }
      const result = operation === 'deposit'
        ? await walletApi.deposit(idempotencyKey, common)
        : operation === 'withdraw'
          ? await walletApi.withdraw(idempotencyKey, common)
          : await walletApi.transfer(idempotencyKey, {
            ...common,
            recipientAccountNumber,
          })
      onSuccess(result.message)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể thực hiện giao dịch.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="wallet-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-operation-title">
    <form className="wallet-operation-form" onSubmit={submit}>
      <div className="wallet-operation-form__head">
        <span><config.Icon size={22} /></span>
        <div><h2 id="wallet-operation-title">{config.title}</h2><p>{config.description}</p></div>
        <button type="button" onClick={onClose} disabled={saving} aria-label="Đóng"><X size={20} /></button>
      </div>

      {operation === 'transfer' && <label><span>Số tài khoản nhận</span><input autoFocus required inputMode="numeric" maxLength={12} value={recipientAccountNumber} onChange={(event) => setRecipientAccountNumber(event.target.value.replace(/\D/g, ''))} placeholder="Nhập 12 chữ số" /></label>}
      <label><span>Số tiền</span><div className="money-input"><input autoFocus={operation !== 'transfer'} required min="1000" step="1000" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Tối thiểu 1.000" /><b>VND</b></div></label>
      {(operation === 'withdraw' || operation === 'transfer') && <small className="available-balance">Khả dụng: {new Intl.NumberFormat('vi-VN').format(balance)} VND</small>}
      <label><span>Mã PIN giao dịch</span><input required inputMode="numeric" type="password" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} placeholder="••••••" /></label>
      <label><span>Nội dung</span><input maxLength={255} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Nội dung giao dịch (không bắt buộc)" /></label>

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="wallet-operation-form__actions"><button type="button" onClick={onClose} disabled={saving}>Hủy</button><button className="primary-button" disabled={saving}>{saving ? 'Đang xử lý...' : config.button}</button></div>
    </form>
  </div>
}
