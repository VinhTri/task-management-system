import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, request } from '../../../shared/api/http'
import { Brand } from '../../../shared/components/Brand'
import '../../../shared/components/ExpandingAuthRail.css'
import { getPasswordRules, isStrongPassword } from '../../../shared/validation/password'

interface ResetTokenResponse { resetToken: string; expiresInSeconds: number }
type Step = 'email' | 'otp' | 'password' | 'done'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
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
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  useEffect(() => {
    if (otpSecondsLeft <= 0) return
    const timer = window.setInterval(() => setOtpSecondsLeft((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [otpSecondsLeft])

  const requestResetOtp = async () => {
    const result = await request<{ expiresInSeconds: number; resendAfterSeconds: number }>('customer', '/api/v1/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email }) })
    setMessage(result.message); setOtp(''); setOtpSecondsLeft(result.data.expiresInSeconds); setCooldown(result.data.resendAfterSeconds)
  }

  const sendOtp = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError(''); setMessage('')
    try { await requestResetOtp(); setStep('otp') }
    catch (reason) { handleOtpError(reason, 'Không thể gửi mã OTP.') }
    finally { setLoading(false) }
  }

  const resendOtp = async () => {
    if (cooldown > 0 || loading) return
    setLoading(true); setError(''); setMessage('')
    try { await requestResetOtp() }
    catch (reason) { handleOtpError(reason, 'Không thể gửi lại OTP.') }
    finally { setLoading(false) }
  }

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError('')
    try {
      const result = await request<ResetTokenResponse>('customer', '/api/v1/auth/password/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) })
      setResetToken(result.data.resetToken); setMessage('OTP hợp lệ. Hãy tạo mật khẩu mới.'); setStep('password')
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

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (!isStrongPassword(password)) { setError('Mật khẩu chưa đáp ứng đầy đủ các yêu cầu.'); return }
    if (!passwordsMatch) { setError('Mật khẩu xác nhận không khớp.'); return }
    setLoading(true)
    try {
      const result = await request<void>('customer', '/api/v1/auth/password/reset', { method: 'POST', body: JSON.stringify({ resetToken, newPassword: password }) })
      setMessage(result.message); setStep('done')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể đặt lại mật khẩu.') }
    finally { setLoading(false) }
  }

  const stepNumber = step === 'email' ? 1 : step === 'otp' ? 2 : 3
  return <main className="u040-login"><section className="u040-login__shell"><div className="u040-login__panel"><div className="u040-login__card auth-flow-card">
    <div className="u040-login__brand"><Brand /></div><Link to="/customer/login" className="back-link"><ArrowLeft size={17} /> Quay lại đăng nhập</Link>
    <section className="simple-card">
      <span className="auth-card__badge">KHÔI PHỤC TÀI KHOẢN</span>
      <h1>{step === 'done' ? 'Đã đổi mật khẩu' : 'Quên mật khẩu?'}</h1>
      <p>{step === 'email' && 'Nhập email để nhận mã OTP khôi phục.'}{step === 'otp' && `Mã xác thực đã được gửi tới ${email}.`}{step === 'password' && 'Tạo mật khẩu mới an toàn cho tài khoản.'}{step === 'done' && 'Bạn có thể sử dụng mật khẩu mới để đăng nhập.'}</p>
      {step !== 'done' && <div className="stepper stepper--three"><span className="active"><b>1</b>Email</span><i /><span className={stepNumber >= 2 ? 'active' : ''}><b>2</b>OTP</span><i /><span className={stepNumber >= 3 ? 'active' : ''}><b>3</b>Mật khẩu</span></div>}

      {step === 'email' && <form onSubmit={sendOtp} className="auth-form"><label><span>Email</span><div className="input-wrap"><Mail size={18} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@email.com" autoComplete="email" required /></div></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? 'Đang gửi…' : 'Gửi mã khôi phục'} <ArrowRight size={18} /></button></form>}

      {step === 'otp' && <form onSubmit={verifyOtp} className="auth-form">{message && <p className="form-success"><CheckCircle2 size={17} /> {message}</p>}<label><span>Mã OTP 6 số</span><div className="input-wrap"><ShieldCheck size={18} /><input value={otp} disabled={otpSecondsLeft === 0} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" pattern="\d{6}" required /></div><small>{otpSecondsLeft > 0 ? `Mã hết hạn sau ${formatCountdown(otpSecondsLeft)}` : 'Mã OTP đã hết hạn hoặc bị vô hiệu hóa.'}</small></label><div className="otp-resend"><button type="button" className="text-button" onClick={() => setStep('email')}>Đổi email</button><button type="button" onClick={resendOtp} disabled={cooldown > 0 || loading}>{cooldown > 0 ? `Gửi lại sau ${formatCountdown(cooldown)}` : 'Gửi lại OTP'}</button></div>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={loading || otp.length !== 6 || otpSecondsLeft === 0}>{loading ? 'Đang xác thực…' : 'Xác thực OTP'} <ArrowRight size={18} /></button></form>}

      {step === 'password' && <form onSubmit={resetPassword} className="auth-form">{message && <p className="form-success"><CheckCircle2 size={17} /> {message}</p>}<label><span>Mật khẩu mới</span><div className="input-wrap"><KeyRound size={18} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={72} autoComplete="new-password" required /></div></label><ul className="password-rules">{passwordRules.map((rule) => <li key={rule.key} className={rule.valid ? 'valid' : ''}><span>{rule.valid ? '✓' : '○'}</span>{rule.label}</li>)}</ul><label><span>Xác nhận mật khẩu mới</span><div className={`input-wrap ${confirmPassword && !passwordsMatch ? 'input-wrap--error' : ''}`}><KeyRound size={18} /><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} maxLength={72} autoComplete="new-password" required /></div></label>{confirmPassword && <p className={`password-match ${passwordsMatch ? 'valid' : ''}`}>{passwordsMatch ? '✓ Mật khẩu đã khớp' : 'Mật khẩu xác nhận chưa khớp'}</p>}{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={loading || !isStrongPassword(password) || !passwordsMatch}>{loading ? 'Đang cập nhật…' : 'Đặt lại mật khẩu'} <ArrowRight size={18} /></button></form>}

      {step === 'done' && <div className="reset-complete"><span><CheckCircle2 size={30} /></span><p>{message}</p><button className="primary-button" onClick={() => navigate('/customer/login', { replace: true })}>Đăng nhập ngay <ArrowRight size={18} /></button></div>}
    </section>
  </div></div><aside className="u040-login__visual" aria-label="Hướng dẫn khôi phục mật khẩu"><div className="u040-login__visual-art" aria-hidden="true"><div className="u040-login__glass u040-login__glass--balance"><i /><span /><b /></div><div className="u040-login__glass u040-login__glass--chart"><i /><i /><i /><i /><i /></div><div className="u040-login__orb" /></div><div className="u040-login__visual-copy"><span>KHÔI PHỤC TÀI KHOẢN</span><h1>Lấy lại quyền truy cập an toàn.</h1><p>SmartSpend xác minh đúng chủ tài khoản trước khi cho phép thiết lập mật khẩu mới.</p><ol className="u040-login__visual-steps"><li><b>01</b><span><strong>Xác nhận email</strong><small>Nhập email đã dùng để đăng ký tài khoản.</small></span></li><li><b>02</b><span><strong>Kiểm tra mã OTP</strong><small>Sử dụng mã xác thực có thời hạn trong email.</small></span></li><li><b>03</b><span><strong>Đặt mật khẩu mới</strong><small>Tạo mật khẩu mạnh và đăng nhập trở lại.</small></span></li></ol></div></aside></section></main>
}

function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor(totalSeconds % 3600 / 60)
  const seconds = totalSeconds % 60
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
