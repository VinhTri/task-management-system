import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Clock3, KeyRound, LockKeyhole, MailCheck, ShieldCheck, X } from 'lucide-react'
import { ApiError, request } from '../../../shared/api/http'
import { Modal } from '../../../shared/components/Modal'
import type { CurrentUser } from '../../../shared/types/api'

type ResetStep = 'pin' | 'sending' | 'otp' | 'reset'
interface ResetTokenResponse { resetToken: string; expiresInSeconds: number }
interface OtpDeliveryResponse { expiresInSeconds: number; resendAfterSeconds: number }
interface Props { open: boolean; busy: boolean; error: string; locked: boolean; failedAttempts: number; maxAttempts: number; amountLabel: string; onClose: () => void; onConfirm: (pin: string) => void; onResetSuccess: () => void }

export function TransactionPinModal({ open, busy, error, locked, failedAttempts, maxAttempts, amountLabel, onClose, onConfirm, onResetSuccess }: Props) {
  const pinIsLocked = locked || failedAttempts >= maxAttempts
  const [pin, setPin] = useState('')
  const [step, setStep] = useState<ResetStep>('pin')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetBusy, setResetBusy] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [otpExpiresAt, setOtpExpiresAt] = useState(0)
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0)
  const [resendAvailableAt, setResendAvailableAt] = useState(0)
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0)
  const [errorVisible, setErrorVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const otpInputRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef(onConfirm)
  const submittedRef = useRef(false)
  const resetStartedRef = useRef(false)

  const startPinReset = async () => {
    if (resetStartedRef.current) return
    if (resendSecondsLeft > 0) {
      setPin(''); setErrorVisible(false)
      setStep(otpSecondsLeft > 0 && email ? 'otp' : 'sending')
      return
    }
    resetStartedRef.current = true
    setStep('sending'); setPin(''); setResetBusy(true); setResetError(''); setResetMessage('')
    try {
      const profile = await request<CurrentUser>('customer', '/api/v1/me')
      const accountEmail = profile.data.email
      setEmail(accountEmail)
      const delivery = await request<OtpDeliveryResponse>('customer', '/api/v1/account/pin/forgot', { method: 'POST', body: JSON.stringify({ email: accountEmail }) })
      const expiresAt = Date.now() + delivery.data.expiresInSeconds * 1000
      const resendAt = expiresAt
      setOtp(''); setOtpExpiresAt(expiresAt); setOtpSecondsLeft(delivery.data.expiresInSeconds)
      setResendAvailableAt(resendAt); setResendSecondsLeft(delivery.data.expiresInSeconds)
      setStep('otp'); setResetMessage(`OTP đã được gửi đến ${accountEmail}.`)
      window.setTimeout(() => otpInputRef.current?.focus(), 80)
    } catch (reason) {
      setResetError(reason instanceof Error ? reason.message : 'Không thể gửi OTP.')
      if (reason instanceof ApiError && reason.retryAfterSeconds) {
        const resendAt = Date.now() + reason.retryAfterSeconds * 1000
        setResendAvailableAt(resendAt); setResendSecondsLeft(reason.retryAfterSeconds)
      }
    } finally {
      setResetBusy(false); resetStartedRef.current = false
    }
  }

  useEffect(() => { confirmRef.current = onConfirm }, [onConfirm])
  useEffect(() => {
    if (!open) return
    setPin(''); setStep('pin'); setErrorVisible(false); setResetError(''); setResetMessage(''); submittedRef.current = false; resetStartedRef.current = false
    window.setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])
  useEffect(() => { if (pinIsLocked && open) { setErrorVisible(false); void startPinReset() } }, [pinIsLocked, open])
  useEffect(() => {
    if (!open || busy || step !== 'pin' || pin.length !== 6 || submittedRef.current) return
    const timer = window.setTimeout(() => { submittedRef.current = true; confirmRef.current(pin) }, 850)
    return () => window.clearTimeout(timer)
  }, [busy, open, pin, step])
  useEffect(() => {
    if (!error || pinIsLocked) return
    setErrorVisible(true)
    const timer = window.setTimeout(() => { submittedRef.current = false; setPin(''); setErrorVisible(false); inputRef.current?.focus() }, 1400)
    return () => window.clearTimeout(timer)
  }, [error, pinIsLocked])
  useEffect(() => {
    if (step !== 'otp' || !otpExpiresAt) return
    const update = () => {
      const remaining = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000))
      setOtpSecondsLeft(remaining)
      if (remaining === 0) setOtp('')
    }
    update()
    const timer = window.setInterval(update, 250)
    return () => window.clearInterval(timer)
  }, [otpExpiresAt, step])
  useEffect(() => {
    if (!resendAvailableAt) return
    const update = () => setResendSecondsLeft(Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000)))
    update()
    const timer = window.setInterval(update, 250)
    return () => window.clearInterval(timer)
  }, [resendAvailableAt])
  useEffect(() => {
    if (step !== 'sending' || resetBusy || !resendAvailableAt || resendSecondsLeft > 0) return
    void startPinReset()
  }, [resendSecondsLeft, resetBusy, resendAvailableAt, step])

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault(); setResetBusy(true); setResetError(''); setResetMessage('')
    try {
      const response = await request<ResetTokenResponse>('customer', '/api/v1/account/pin/verify-otp', { method: 'POST', body: JSON.stringify({ email: email.trim(), otp }) })
      setResetToken(response.data.resetToken); setStep('reset')
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === 'AUTH_006') {
        const retryAfter = reason.retryAfterSeconds ?? 0
        setOtp(''); setOtpExpiresAt(0); setOtpSecondsLeft(0)
        setResendAvailableAt(retryAfter > 0 ? Date.now() + retryAfter * 1000 : 0)
        setResendSecondsLeft(retryAfter)
        setResetError(retryAfter > 0
          ? `OTP đã bị vô hiệu do nhập sai quá nhiều lần. Bạn có thể gửi mã mới sau ${formatCountdown(retryAfter)}.`
          : 'OTP đã bị vô hiệu do nhập sai quá nhiều lần. Hãy gửi lại mã OTP mới.')
      } else {
        setResetError(reason instanceof Error ? reason.message : 'OTP không hợp lệ.')
      }
    }
    finally { setResetBusy(false) }
  }
  const resetPin = async (event: FormEvent) => {
    event.preventDefault(); setResetError(''); setResetMessage('')
    if (newPin !== confirmPin) { setResetError('Mã PIN xác nhận không khớp.'); return }
    setResetBusy(true)
    try {
      await request<void>('customer', '/api/v1/account/pin/reset', { method: 'POST', body: JSON.stringify({ resetToken, pin: newPin, confirmPin }) })
      setPin(''); setOtp(''); setNewPin(''); setConfirmPin(''); setResetToken(''); setStep('pin'); submittedRef.current = false
      setResetMessage('Đặt lại PIN thành công. Hãy nhập PIN mới để xác nhận giao dịch.')
      onResetSuccess(); window.setTimeout(() => inputRef.current?.focus(), 80)
    } catch (reason) { setResetError(reason instanceof Error ? reason.message : 'Không thể đặt lại PIN.') }
    finally { setResetBusy(false) }
  }
  const back = () => {
    setResetError(''); setResetMessage('')
    if (step === 'reset') setStep('otp')
    else if (step === 'otp' && !pinIsLocked) setStep('pin')
    else if (!pinIsLocked) setStep('pin')
  }

  return <Modal open={open} onClose={onClose} busy={busy || resetBusy} labelledBy="transaction-pin-title" className="transaction-pin-modal">
    <div className="transaction-pin-form">
      <div className="transaction-pin-heading"><div><span id="transaction-pin-title"><LockKeyhole size={17} /> {step === 'pin' ? 'Mã PIN giao dịch' : 'Đặt lại mã PIN'}</span><small>{step === 'pin' ? `Nhập 6 số để xác nhận giao dịch ${amountLabel}` : 'Xác minh email để bảo vệ tài khoản của bạn'}</small></div><button type="button" onClick={onClose} disabled={busy || resetBusy} aria-label="Đóng"><X size={19} /></button></div>
      {step === 'pin' ? <>
        {resetMessage && <p className="form-success"><ShieldCheck size={17} /> {resetMessage}</p>}
        {failedAttempts > 0 && <div className={`pin-attempt-warning ${failedAttempts >= maxAttempts - 1 ? 'is-critical' : ''}`} role="alert"><div><strong>Đã nhập sai {failedAttempts}/{maxAttempts} lần</strong><small>{failedAttempts >= maxAttempts - 1 ? 'Cảnh báo: sai thêm một lần, PIN giao dịch sẽ bị khóa.' : `Bạn còn ${maxAttempts - failedAttempts} lần thử trước khi PIN bị khóa.`}</small></div><span>{Math.max(0, maxAttempts - failedAttempts)}</span></div>}
        <label className="transaction-pin-field"><div className={`pin-deck ${pin.length === 6 || errorVisible ? 'pin-deck--complete' : ''} ${pin.length === 6 && !errorVisible ? 'pin-deck--verifying' : ''} ${errorVisible ? 'pin-deck--invalid' : ''}`} onClick={() => { if (!busy) inputRef.current?.focus() }}><input ref={inputRef} required disabled={busy || errorVisible} inputMode="numeric" autoComplete="one-time-code" type="password" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} aria-label="Nhập mã PIN gồm 6 số" />{Array.from({ length: 6 }, (_, index) => <span key={index} aria-hidden="true" className={`${index < pin.length ? 'filled' : ''} ${index === pin.length ? 'current' : ''}`} style={{ '--slot-index': index } as CSSProperties}><i>{index < pin.length ? '•' : ''}</i></span>)}<div className="pin-deck__success" role="status" aria-live="polite" aria-hidden={pin.length !== 6 && !errorVisible}><b>{errorVisible ? <X size={22} strokeWidth={3} /> : <span className="pin-spinner" />}</b><span><strong>{errorVisible ? 'PIN không chính xác' : 'Đang xác thực PIN'}</strong><small>{errorVisible ? 'Vui lòng nhập lại mã PIN' : 'Vui lòng chờ trong giây lát'}</small></span></div></div><small>Nhập hoặc dán 6 số. PIN được mã hóa và không bao giờ hiển thị công khai.</small></label>
        <button type="button" className="transaction-pin-forgot" onClick={() => void startPinReset()}><KeyRound size={15} /> Quên mã PIN?</button>
      </> : <form className="pin-reset-form" onSubmit={step === 'otp' ? verifyOtp : resetPin}>
        {pinIsLocked && <div className="pin-reset-locked"><LockKeyhole size={18} /><div><strong>PIN giao dịch đã bị khóa</strong><small>Bạn đã nhập sai 3 lần. Hãy xác thực OTP và đặt lại PIN để tiếp tục.</small></div></div>}
        {step !== 'sending' && <button type="button" className="pin-reset-back" onClick={back} disabled={resetBusy}><ArrowLeft size={15} /> Quay lại</button>}
        {step === 'sending' && <div className="pin-reset-sending" role="status" aria-live="polite"><MailCheck size={24} /><div><strong>{resetBusy ? 'Đang gửi mã OTP…' : 'Chưa thể gửi OTP'}</strong><small>{resetBusy ? 'Mã sẽ được gửi đến email của tài khoản đang đăng nhập.' : resendSecondsLeft > 0 ? `Tự động mở khóa sau ${formatCountdown(resendSecondsLeft)}` : 'Đang mở khóa và chuẩn bị form nhập OTP…'}</small></div></div>}
        {step === 'otp' && <label className="pin-otp-field"><span>Mã OTP gồm 6 số</span><div className={`pin-otp-boxes ${otpSecondsLeft === 0 ? 'is-expired' : ''}`} onClick={() => otpInputRef.current?.focus()}>{Array.from({ length: 6 }, (_, index) => <i key={index} className={otp.length === index ? 'active' : ''}>{otp[index] || ''}</i>)}<input ref={otpInputRef} required disabled={otpSecondsLeft === 0} inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} autoComplete="one-time-code" aria-label="Mã OTP gồm 6 số" /></div><div className={`pin-otp-timer ${otpSecondsLeft === 0 ? 'is-expired' : ''}`}><Clock3 size={15} /><span>{otpSecondsLeft > 0 ? `Mã hết hạn sau ${String(Math.floor(otpSecondsLeft / 60)).padStart(2, '0')}:${String(otpSecondsLeft % 60).padStart(2, '0')}` : 'Mã OTP đã hết hạn'}</span></div></label>}
        {step === 'reset' && <><label><span>PIN mới</span><PinBoxesInput value={newPin} onChange={setNewPin} label="PIN mới gồm 6 số" autoFocus /></label><label><span>Xác nhận PIN mới</span><PinBoxesInput value={confirmPin} onChange={setConfirmPin} label="Xác nhận PIN mới gồm 6 số" /></label></>}
        {resetMessage && <p className="form-success"><ShieldCheck size={17} /> {resetMessage}</p>}
        {resetError && step !== 'sending' && <p className="form-error" role="alert">{resetError}</p>}
        {step !== 'sending' && <button className="primary-button" disabled={resetBusy || (step === 'otp' ? otp.length !== 6 || otpSecondsLeft === 0 : newPin.length !== 6 || confirmPin.length !== 6)}>{resetBusy ? 'Đang xử lý…' : step === 'otp' ? 'Xác thực OTP' : 'Đặt lại mã PIN'}</button>}
        {step === 'otp' && <button type="button" className="pin-reset-cancel" disabled={resetBusy || resendSecondsLeft > 0} onClick={() => void startPinReset()}>{resendSecondsLeft > 0 ? `Gửi lại sau ${formatCountdown(resendSecondsLeft)}` : 'Gửi lại OTP'}</button>}
      </form>}
    </div>
  </Modal>
}

function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor(totalSeconds % 3600 / 60)
  const seconds = totalSeconds % 60
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function PinBoxesInput({ value, onChange, label, autoFocus = false }: { value: string; onChange: (value: string) => void; label: string; autoFocus?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (autoFocus) window.setTimeout(() => ref.current?.focus(), 80) }, [autoFocus])
  return <div className="pin-reset-pin-boxes" onClick={() => ref.current?.focus()}>
    {Array.from({ length: 6 }, (_, index) => <i key={index} className={value.length === index ? 'active' : ''}>{value[index] ? '•' : ''}</i>)}
    <input ref={ref} required type="password" inputMode="numeric" maxLength={6} value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))} autoComplete="new-password" aria-label={label} />
  </div>
}
