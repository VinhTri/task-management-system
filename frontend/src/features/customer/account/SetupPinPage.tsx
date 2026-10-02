import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { request } from '../../../shared/api/http'
import { Brand } from '../../../shared/components/Brand'
import type { AccountOverview } from '../../../shared/types/api'

type PinField = 'pin' | 'confirm'

export function SetupPinPage() {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [activeField, setActiveField] = useState<PinField>('pin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const pinRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    request<AccountOverview>('customer', '/api/v1/account')
      .then((response) => {
        if (response.data.pinConfigured) navigate('/customer', { replace: true })
        else pinRef.current?.focus()
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Không thể kiểm tra tài khoản.'))
  }, [navigate])

  const updatePin = (field: PinField, value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    if (field === 'pin') {
      setPin(digits)
      if (digits.length === 6) confirmRef.current?.focus()
    } else setConfirmPin(digits)
  }

  const handleKey = (field: PinField, event: KeyboardEvent<HTMLInputElement>) => {
    if (field === 'confirm' && event.key === 'Backspace' && confirmPin.length === 0) pinRef.current?.focus()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (pin.length !== 6 || confirmPin.length !== 6) { setError('Mã PIN phải có đúng 6 chữ số.'); return }
    if (pin !== confirmPin) { setError('Mã PIN xác nhận không khớp.'); return }
    setLoading(true)
    try {
      await request<AccountOverview>('customer', '/api/v1/account/setup-pin', {
        method: 'POST', body: JSON.stringify({ pin, confirmPin }),
      })
      navigate('/customer', { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể thiết lập mã PIN.')
    } finally { setLoading(false) }
  }

  const boxes = (value: string, field: PinField) => Array.from({ length: 6 }, (_, index) => (
    <span key={index} className={value.length === index && activeField === field ? 'active' : ''}>
      {value[index] ? '●' : ''}
    </span>
  ))

  return <main className="simple-auth-page pin-setup-page"><div className="simple-auth-shell">
    <Brand />
    <section className="simple-card pin-card">
      <div className="pin-shield"><ShieldCheck size={30} /></div>
      <span className="auth-card__badge">BẢO MẬT GIAO DỊCH</span>
      <h1>Thiết lập mã PIN</h1>
      <p>Mã PIN gồm 6 chữ số và sẽ được yêu cầu khi bạn thực hiện chuyển khoản.</p>
      <form onSubmit={submit} className="auth-form">
        <label><span>Mã PIN mới</span><div className="pin-input" onClick={() => pinRef.current?.focus()}>{boxes(pin, 'pin')}<input ref={pinRef} value={pin} onFocus={() => setActiveField('pin')} onChange={(event) => updatePin('pin', event.target.value)} onKeyDown={(event) => handleKey('pin', event)} inputMode="numeric" autoComplete="new-password" aria-label="Mã PIN mới" /></div></label>
        <label><span>Xác nhận mã PIN</span><div className="pin-input" onClick={() => confirmRef.current?.focus()}>{boxes(confirmPin, 'confirm')}<input ref={confirmRef} value={confirmPin} onFocus={() => setActiveField('confirm')} onChange={(event) => updatePin('confirm', event.target.value)} onKeyDown={(event) => handleKey('confirm', event)} inputMode="numeric" autoComplete="new-password" aria-label="Xác nhận mã PIN" /></div></label>
        <div className="pin-note"><LockKeyhole size={17} /><span>Không dùng dãy liên tiếp như 123456 hoặc sáu số giống nhau.</span></div>
        {pin.length === 6 && confirmPin.length === 6 && pin === confirmPin && <p className="form-success"><CheckCircle2 size={17} /> Mã PIN đã khớp</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={loading || pin.length !== 6 || pin !== confirmPin}>{loading ? 'Đang thiết lập…' : 'Hoàn tất thiết lập'} {!loading && <ArrowRight size={18} />}</button>
      </form>
    </section>
  </div></main>
}
