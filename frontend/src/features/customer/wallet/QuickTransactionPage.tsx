import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, Check, Copy, QrCode, Send, ShieldCheck, Zap } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, request } from '../../../shared/api/http'
import { walletApi } from '../../../shared/api/wallet'
import { PortalShell } from '../../../shared/components/PortalShell'
import { useNotification } from '../../../shared/components/NotificationProvider'
import type { AccountOverview, PinStatus } from '../../../shared/types/api'
import { createClientId } from '../../../shared/utils/id'
import { formatVnd, formatVndNumber } from '../../../shared/utils/currency'
import { TransactionPinModal } from './TransactionPinModal'
import { TransactionSuccessModal } from './TransactionSuccessModal'

export type WalletOperation = 'deposit' | 'withdraw' | 'transfer'
type QuickTransactionTab = WalletOperation | 'qr'

const operationContent = {
  deposit: { title: 'Nạp tiền', shortDescription: 'Vào ví', description: 'Bổ sung số dư vào ví SmartSpend.', Icon: ArrowDownToLine },
  withdraw: { title: 'Rút tiền', shortDescription: 'Từ ví', description: 'Rút tiền từ số dư khả dụng.', Icon: ArrowUpFromLine },
  transfer: { title: 'Chuyển tiền', shortDescription: 'Nội bộ', description: 'Gửi đến một tài khoản SmartSpend.', Icon: Send },
  qr: { title: 'Mã QR', shortDescription: 'Nhận tiền', description: 'Chia sẻ QR để nhận tiền vào tài khoản.', Icon: QrCode },
}

const quickAmounts = [100_000, 500_000, 1_000_000, 2_000_000]
const MIN_TRANSACTION_AMOUNT = 2_000
const MAX_TRANSACTION_AMOUNT = 1_000_000_000
const MAX_WALLET_BALANCE = 3_000_000_000
const MAX_DESCRIPTION_LENGTH = 255

export function QuickTransactionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const notify = useNotification()
  const recipientFromQr = searchParams.get('recipient') || ''
  const hasQrRecipient = /^\d{12}$/.test(recipientFromQr)
  const [account, setAccount] = useState<AccountOverview | null>(null)
  const [operation, setOperation] = useState<QuickTransactionTab>(hasQrRecipient ? 'transfer' : 'deposit')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [recipientAccountNumber, setRecipientAccountNumber] = useState(hasQrRecipient ? recipientFromQr : '')
  const [idempotencyKey, setIdempotencyKey] = useState(createClientId)
  const [loading, setLoading] = useState(true)
  const [pinOpen, setPinOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinLocked, setPinLocked] = useState(false)
  const [pinFailedAttempts, setPinFailedAttempts] = useState(0)
  const [success, setSuccess] = useState<{ title: string; amount: string; message: string } | null>(null)

  const loadAccount = useCallback(async () => {
    const response = await request<AccountOverview>('customer', '/api/v1/account')
    if (!response.data.pinConfigured) {
      navigate('/customer/setup-pin', { replace: true })
      return
    }
    setAccount(response.data)
  }, [navigate])

  const loadPinStatus = useCallback(async () => {
    const response = await request<PinStatus>('customer', '/api/v1/account/pin/status')
    setPinFailedAttempts(response.data.failedAttempts)
    setPinLocked(response.data.locked)
  }, [])

  useEffect(() => {
    loadAccount()
      .catch((reason) => notify({ type: 'error', message: reason instanceof Error ? reason.message : 'Không thể tải thông tin ví.' }))
      .finally(() => setLoading(false))
  }, [loadAccount, notify])

  useEffect(() => {
    if (pinOpen) void loadPinStatus().catch(() => undefined)
  }, [loadPinStatus, pinOpen])

  const wallet = account?.defaultWallet
  const formatMoney = formatVnd
  const balance = formatMoney(wallet?.balance ?? 0)
  const amountValue = Number(amount) || 0
  const depositCapacity = Math.max(0, Math.floor(MAX_WALLET_BALANCE - (wallet?.balance ?? 0)))
  const maximumAllowedAmount = operation === 'deposit'
    ? Math.min(MAX_TRANSACTION_AMOUNT, depositCapacity)
    : MAX_TRANSACTION_AMOUNT
  const estimatedBalance = (wallet?.balance ?? 0) + (operation === 'deposit' ? amountValue : -amountValue)
  const qrValue = account?.accountNumber
    ? `${window.location.origin}/customer/operations?recipient=${encodeURIComponent(account.accountNumber)}`
    : ''

  const selectOperation = (next: QuickTransactionTab) => {
    setOperation(next); setAmount(''); setDescription(''); setRecipientAccountNumber(''); setError(''); setIdempotencyKey(createClientId())
  }

  const changeAmount = (displayValue: string) => {
    const rawValue = displayValue.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
    const value = Number(rawValue)
    if (value > MAX_TRANSACTION_AMOUNT) {
      setAmount(String(MAX_TRANSACTION_AMOUNT))
      setError(`Mỗi giao dịch không được vượt quá ${formatVnd(MAX_TRANSACTION_AMOUNT)}.`)
      return
    }
    if (operation === 'deposit' && value > depositCapacity) {
      setAmount(depositCapacity > 0 ? String(depositCapacity) : '')
      setError(`Số dư ví không được vượt quá ${formatVnd(MAX_WALLET_BALANCE)}.`)
      return
    }
    setAmount(rawValue)
    setError('')
  }

  const continueToPin = (event: FormEvent) => {
    event.preventDefault()
    if (operation === 'qr') return
    setError('')
    const value = Number(amount)
    if (!Number.isFinite(value) || value < MIN_TRANSACTION_AMOUNT) return setError(`Số tiền tối thiểu là ${formatVnd(MIN_TRANSACTION_AMOUNT)}.`)
    if (value > MAX_TRANSACTION_AMOUNT) return setError(`Mỗi giao dịch không được vượt quá ${formatVnd(MAX_TRANSACTION_AMOUNT)}.`)
    if (operation === 'deposit' && value > depositCapacity) return setError(`Số dư ví không được vượt quá ${formatVnd(MAX_WALLET_BALANCE)}.`)
    if ((operation === 'withdraw' || operation === 'transfer') && value > (wallet?.balance ?? 0)) return setError('Số dư khả dụng không đủ.')
    if (operation === 'transfer' && !/^\d{12}$/.test(recipientAccountNumber)) return setError('Số tài khoản nhận phải gồm đúng 12 chữ số.')
    setPinError('')
    setPinOpen(true)
  }

  const confirmTransaction = async (pin: string) => {
    if (operation === 'qr') return
    const value = Number(amount)
    setSaving(true); setPinError('')
    try {
      const common = { amount: value, pin, description: description.trim() || undefined }
      const result = operation === 'deposit'
        ? await walletApi.deposit(idempotencyKey, common)
        : operation === 'withdraw'
          ? await walletApi.withdraw(idempotencyKey, common)
          : await walletApi.transfer(idempotencyKey, { ...common, recipientAccountNumber })
      setPinOpen(false)
      setPinFailedAttempts(0); setPinLocked(false)
      setSuccess({ title: operationContent[operation].title, amount: formatMoney(value), message: result.message })
      setAmount(''); setDescription(''); setRecipientAccountNumber(''); setIdempotencyKey(createClientId())
      await loadAccount()
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === 'ACCOUNT_012') setPinLocked(true)
      setPinError(reason instanceof Error ? reason.message : 'Không thể thực hiện giao dịch.')
      if (reason instanceof ApiError && (reason.code === 'ACCOUNT_005' || reason.code === 'ACCOUNT_012')) {
        await loadPinStatus().catch(() => undefined)
      }
    } finally {
      setSaving(false)
    }
  }

  const config = operationContent[operation]
  return <PortalShell portal="customer">
    <section className={`content-card quick-transaction-card quick-transaction-card--${operation}`}>
      <div className="quick-transaction-card__head"><span><Zap size={20} /></span><div><h3>Thực hiện giao dịch</h3><p>Chọn hình thức và nhập thông tin giao dịch của bạn.</p></div><div className="quick-balance"><small>Số dư khả dụng</small><strong>{loading ? 'Đang tải...' : balance}</strong></div></div>

      <div className="quick-operation-tabs" role="tablist" aria-label="Chọn loại giao dịch">{(Object.keys(operationContent) as QuickTransactionTab[]).map((item) => { const itemConfig = operationContent[item]; return <button type="button" role="tab" aria-selected={operation === item} className={operation === item ? 'active' : ''} disabled={!wallet} onClick={() => selectOperation(item)} key={item}><span><itemConfig.Icon /></span><div><strong>{itemConfig.title}</strong><small>{itemConfig.shortDescription}</small></div>{operation === item && <Check className="quick-operation-tabs__check" size={16} />}</button> })}</div>

      {operation === 'qr' ? <div className="receive-qr-panel">
        <div className="receive-qr-panel__intro"><span><QrCode size={21} /></span><div><h3>QR nhận tiền của tôi</h3><p>Người dùng SmartSpend khác quét mã này để tìm đúng tài khoản và chuyển tiền cho bạn.</p></div></div>
        <div className="receive-qr-card">
          <div className="receive-qr-card__code">{qrValue ? <QRCodeSVG value={qrValue} size={220} level="H" marginSize={2} fgColor="#3D1760" /> : <span>Đang tạo mã QR...</span>}</div>
          <small>SMARTSPEND ACCOUNT</small>
          <strong>{account?.accountNumber || '—'}</strong>
          <p>Quét để chuyển tiền nội bộ</p>
        </div>
        <div className="receive-qr-panel__details">
          <h4>Thông tin nhận tiền</h4>
          <div><span>Số tài khoản</span><strong>{account?.accountNumber || '—'}</strong></div>
          <div><span>Ngân hàng</span><strong>SmartSpend</strong></div>
          <button type="button" disabled={!account?.accountNumber} onClick={() => { if (account?.accountNumber) void navigator.clipboard.writeText(account.accountNumber).then(() => notify({ type: 'success', message: 'Đã sao chép số tài khoản.' })) }}><Copy size={16} /> Sao chép số tài khoản</button>
          <p><ShieldCheck size={15} /> QR chỉ chứa đường dẫn chuyển tiền và số tài khoản của bạn, không chứa số dư hay thông tin bảo mật.</p>
        </div>
      </div> : <div className="quick-transaction-workspace">
        <form className="quick-transaction-form" onSubmit={continueToPin}>
          <div className="quick-transaction-form__title"><span><config.Icon size={19} /></span><div><h3>{config.title}</h3><p>{config.description}</p></div></div>
          {operation === 'transfer' && <label><span>Số tài khoản nhận</span><input autoFocus required inputMode="numeric" maxLength={12} value={recipientAccountNumber} onChange={(event) => setRecipientAccountNumber(event.target.value.replace(/\D/g, ''))} placeholder="Nhập 12 chữ số tài khoản" /></label>}
          <label><span>Số tiền</span><div className={`money-input money-input--large${amountValue > maximumAllowedAmount ? ' is-invalid' : ''}`}><input autoFocus={operation !== 'transfer'} required inputMode="numeric" type="text" maxLength={13} value={amount ? formatVndNumber(Number(amount)) : ''} onChange={(event) => changeAmount(event.target.value)} placeholder="0" aria-describedby="transaction-amount-limits" aria-invalid={amountValue > maximumAllowedAmount} disabled={operation === 'deposit' && maximumAllowedAmount < MIN_TRANSACTION_AMOUNT} /><b>VND</b></div><small className="field-hint" id="transaction-amount-limits">{operation === 'deposit' ? (maximumAllowedAmount < MIN_TRANSACTION_AMOUNT ? `Ví đã đạt số dư tối đa ${formatVnd(MAX_WALLET_BALANCE)}` : `Có thể nạp từ ${formatVnd(MIN_TRANSACTION_AMOUNT)} đến ${formatVnd(maximumAllowedAmount)}`) : `Từ ${formatVnd(MIN_TRANSACTION_AMOUNT)} đến ${formatVnd(MAX_TRANSACTION_AMOUNT)} mỗi giao dịch`}</small></label>
          <div className="quick-amounts" aria-label="Chọn nhanh số tiền">{quickAmounts.map((value) => <button type="button" className={amountValue === value ? 'active' : ''} aria-pressed={amountValue === value} key={value} onClick={() => changeAmount(String(value))}>{formatVnd(value)}</button>)}</div>
          <label><span>Nội dung <em>Không bắt buộc · {description.length}/{MAX_DESCRIPTION_LENGTH}</em></span><input maxLength={MAX_DESCRIPTION_LENGTH} value={description} onChange={(event) => setDescription(event.target.value.slice(0, MAX_DESCRIPTION_LENGTH))} placeholder={operation === 'transfer' ? 'VD: Thanh toán tiền ăn' : 'Nhập nội dung giao dịch'} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button quick-transaction-form__submit" disabled={!wallet || maximumAllowedAmount < MIN_TRANSACTION_AMOUNT || amountValue > maximumAllowedAmount}>Tiếp tục xác nhận <ArrowRight size={17} /></button>
          <p className="quick-security-note"><ShieldCheck size={15} /> Giao dịch được bảo vệ bằng mã PIN SmartSpend</p>
        </form>

        <aside className="transaction-summary" aria-label="Tóm tắt giao dịch">
          <h4><span><ShieldCheck size={16} /></span>Tóm tắt giao dịch</h4>
          <div><span>Loại giao dịch</span><strong>{config.title}</strong></div>
          <div><span>Số tiền</span><strong>{amountValue ? formatMoney(amountValue) : '—'}</strong></div>
          <div><span>Phí giao dịch</span><strong className="free-fee">Miễn phí</strong></div>
          <div className="transaction-summary__total"><span>Số dư dự kiến</span><strong>{amountValue ? formatMoney(Math.max(0, estimatedBalance)) : balance}</strong></div>
          <p>Số dư dự kiến được tính sau khi giao dịch hoàn tất.</p>
        </aside>
      </div>}
    </section>

    <TransactionPinModal open={pinOpen} busy={saving} error={pinError} locked={pinLocked} failedAttempts={pinFailedAttempts} maxAttempts={3} amountLabel={formatMoney(Number(amount) || 0)} onClose={() => { if (!saving) setPinOpen(false) }} onConfirm={(pin) => void confirmTransaction(pin)} onResetSuccess={() => { setPinLocked(false); setPinFailedAttempts(0); setPinError('') }} />
    <TransactionSuccessModal open={Boolean(success)} title={success?.title || ''} amount={success?.amount || ''} message={success?.message || ''} onClose={() => setSuccess(null)} />
  </PortalShell>
}
