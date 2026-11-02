import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, request } from '../../../shared/api/http'
import type { AuthTokens } from '../../../shared/types/api'
import { sessionStore } from '../../../shared/auth/session'
import { Brand } from '../../../shared/components/Brand'
import '../../../shared/components/ExpandingAuthRail.css'
import { getPasswordRules, isStrongPassword } from '../../../shared/validation/password'

export function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0)
  const passwordRules = getPasswordRules(password)
  const passwordsMatch = password.length > 0 && password === confirmPassword

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  useEffect(() => {
    if (otpSecondsLeft <= 0) return
    const timer = window.setInterval(() => setOtpSecondsLeft((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [otpSecondsLeft])

  const requestOtp = async () => {
    const result = await request<{ expiresInSeconds: number; resendAfterSeconds: number }>('customer', '/api/v1/auth/register/otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    setMessage(result.message)
    setOtp(''); setOtpSecondsLeft(result.data.expiresInSeconds); setCooldown(result.data.resendAfterSeconds)
  }

  const sendOtp = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError('')
    try {
      await requestOtp(); setStep(2)
    } catch (reason) { handleOtpError(reason, 'Không thể gửi OTP.') }
    finally { setLoading(false) }
  }

  const resendOtp = async () => {
    if (cooldown > 0 || loading) return
    setLoading(true); setError(''); setMessage('')
    try { await requestOtp() }
    catch (reason) { handleOtpError(reason, 'Không thể gửi lại OTP.') }
    finally { setLoading(false) }
  }

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError('')
    try {
      const result = await request<{ verificationToken: string; expiresInSeconds: number }>(
        'customer',
        '/api/v1/auth/register/verify-otp',
        { method: 'POST', body: JSON.stringify({ email, otp }) },
      )
      setVerificationToken(result.data.verificationToken)
      setMessage('Email đã được xác thực. Hãy tạo mật khẩu để hoàn tất đăng ký.')
      setStep(3)
    } catch (reason) { handleOtpError(reason, 'OTP không hợp lệ.') }
    finally { setLoading(false) }
  }

  const handleOtpError = (reason: unknown, fallback: string) => {
    if (reason instanceof ApiError && reason.retryAfterSeconds) setCooldown(reason.retryAfterSeconds)
    if (reason instanceof ApiError && reason.code === 'AUTH_006') {
      setOtp(''); setOtpSecondsLeft(0)
    }
    setError(reason instanceof Error ? reason.message : fallback)
  }

  const register = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (!isStrongPassword(password)) {
      setError('Mật khẩu chưa đáp ứng đầy đủ các yêu cầu.')
      return
    }
    if (!passwordsMatch) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setLoading(true)
    try {
      const result = await request<AuthTokens>('customer', '/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ verificationToken, password }),
      })
      sessionStore.set('customer', result.data); navigate('/customer/setup-pin', { replace: true })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tạo tài khoản.') }
    finally { setLoading(false) }
  }

  return (
    <main className="u040-login">
      <section className="u040-login__shell">
      <div className="u040-login__panel">
        <div className="u040-login__card auth-flow-card">
        <div className="u040-login__brand"><Brand /></div>
        <Link to="/customer/login" className="back-link"><ArrowLeft size={17} /> Quay lại đăng nhập</Link>
        <section className="simple-card">
          <span className="auth-card__badge">BẮT ĐẦU MIỄN PHÍ</span>
          <h1>Tạo tài khoản SmartSpend</h1>
          <p>{step === 1 && 'Nhập email để nhận mã xác thực.'}{step === 2 && 'Nhập mã OTP đã được gửi đến email.'}{step === 3 && 'Tạo mật khẩu để hoàn tất tài khoản.'}</p>
          <div className="stepper"><span className="active"><b>1</b>Email</span><i /><span className={step >= 2 ? 'active' : ''}><b>2</b>OTP</span><i /><span className={step === 3 ? 'active' : ''}><b>3</b>Mật khẩu</span></div>
          {step === 1 ? (
            <form onSubmit={sendOtp} className="auth-form">
              <label><span>Email</span><div className="input-wrap"><Mail size={18} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" required /></div></label>
              {error && <p className="form-error">{error}</p>}
              <button className="primary-button" disabled={loading}>{loading ? 'Đang gửi…' : 'Gửi mã OTP'} <ArrowRight size={18} /></button>
            </form>
          ) : step === 2 ? (
            <form onSubmit={verifyOtp} className="auth-form">
              {message && <p className="form-success"><CheckCircle2 size={17} /> {message}</p>}
              <label><span>Mã OTP 6 số</span><div className="input-wrap"><ShieldCheck size={18} /><input value={otp} disabled={otpSecondsLeft === 0} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" pattern="\d{6}" required /></div><small>{otpSecondsLeft > 0 ? `Mã hết hạn sau ${formatCountdown(otpSecondsLeft)}` : 'Mã OTP đã hết hạn hoặc bị vô hiệu hóa.'}</small></label>
              <div className="otp-resend">
                <button type="button" className="text-button" onClick={() => { setStep(1); setOtp(''); setMessage(''); setError('') }}>Đổi email</button>
                <button type="button" onClick={resendOtp} disabled={cooldown > 0 || loading}>
                  {cooldown > 0 ? `Gửi lại sau ${formatCountdown(cooldown)}` : 'Gửi lại OTP'}
                </button>
              </div>
              {error && <p className="form-error">{error}</p>}
              <button className="primary-button" disabled={loading || otp.length !== 6 || otpSecondsLeft === 0}>{loading ? 'Đang xác thực…' : 'Xác thực OTP'} <ArrowRight size={18} /></button>
            </form>
          ) : (
            <form onSubmit={register} className="auth-form">
              {message && <p className="form-success"><CheckCircle2 size={17} /> {message}</p>}
              <label><span>Mật khẩu</span><div className="input-wrap"><KeyRound size={18} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={12} maxLength={72} autoComplete="new-password" required /></div></label>
              <ul className="password-rules" aria-label="Yêu cầu mật khẩu">
                {passwordRules.map((rule) => <li key={rule.key} className={rule.valid ? 'valid' : ''}><span>{rule.valid ? '✓' : '○'}</span>{rule.label}</li>)}
              </ul>
              <label><span>Xác nhận mật khẩu</span><div className={`input-wrap ${confirmPassword && !passwordsMatch ? 'input-wrap--error' : ''}`}><KeyRound size={18} /><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={12} maxLength={72} autoComplete="new-password" required /></div></label>
              {confirmPassword && <p className={`password-match ${passwordsMatch ? 'valid' : ''}`}>{passwordsMatch ? '✓ Mật khẩu đã khớp' : 'Mật khẩu xác nhận chưa khớp'}</p>}
              {error && <p className="form-error">{error}</p>}
              <button className="primary-button" disabled={loading || !isStrongPassword(password) || !passwordsMatch}>{loading ? 'Đang tạo…' : 'Tạo tài khoản'} <ArrowRight size={18} /></button>
            </form>
          )}
        </section></div>
      </div>
      <aside className="u040-login__visual" aria-label="Giới thiệu SmartSpend">
        <div className="u040-login__visual-art" aria-hidden="true"><div className="u040-login__glass u040-login__glass--balance"><i /><span /><b /></div><div className="u040-login__glass u040-login__glass--chart"><i /><i /><i /><i /><i /></div><div className="u040-login__orb" /></div>
        <div className="u040-login__visual-copy">
          <span>ĐĂNG KÝ SMARTSPEND</span>
          <h1>Tạo tài khoản chỉ trong vài bước.</h1>
          <p>Quy trình đăng ký nhanh chóng và an toàn để bạn bắt đầu quản lý tài chính ngay hôm nay.</p>
          <ol className="u040-login__visual-steps">
            <li><b>01</b><span><strong>Nhập email</strong><small>Sử dụng email bạn thường xuyên truy cập.</small></span></li>
            <li><b>02</b><span><strong>Xác thực OTP</strong><small>Nhập mã 6 số được gửi đến email.</small></span></li>
            <li><b>03</b><span><strong>Tạo mật khẩu</strong><small>Hoàn tất tài khoản bằng mật khẩu an toàn.</small></span></li>
          </ol>
        </div>
      </aside>
      </section>
    </main>
  )
}

function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor(totalSeconds % 3600 / 60)
  const seconds = totalSeconds % 60
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
