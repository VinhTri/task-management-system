import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { request } from '../../../shared/api/http'
import type { AuthTokens } from '../../../shared/types/api'
import { sessionStore } from '../../../shared/auth/session'
import { Brand } from '../../../shared/components/Brand'
import { getPasswordRules, isStrongPassword } from '../../../shared/validation/password'

export function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const passwordRules = getPasswordRules(password)
  const passwordsMatch = password.length > 0 && password === confirmPassword

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const requestOtp = async () => {
    const result = await request<void>('customer', '/api/v1/auth/register/otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    setMessage(result.message)
    setCooldown(60)
  }

  const sendOtp = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError('')
    try {
      await requestOtp(); setStep(2)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể gửi OTP.') }
    finally { setLoading(false) }
  }

  const resendOtp = async () => {
    if (cooldown > 0 || loading) return
    setLoading(true); setError(''); setMessage('')
    try { await requestOtp() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể gửi lại OTP.') }
    finally { setLoading(false) }
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
      const result = await request<AuthTokens>('customer', '/api/v1/auth/register', { method: 'POST', body: JSON.stringify({ email, password, otp }) })
      sessionStore.set('customer', result.data); navigate('/customer/setup-pin', { replace: true })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tạo tài khoản.') }
    finally { setLoading(false) }
  }

  return (
    <main className="simple-auth-page">
      <div className="simple-auth-shell">
        <Brand />
        <Link to="/customer/login" className="back-link"><ArrowLeft size={17} /> Quay lại đăng nhập</Link>
        <section className="simple-card">
          <span className="auth-card__badge">BẮT ĐẦU MIỄN PHÍ</span>
          <h1>Tạo tài khoản SmartSpend</h1>
          <p>{step === 1 ? 'Nhập email để nhận mã xác thực.' : 'Kiểm tra email và hoàn tất tài khoản của bạn.'}</p>
          <div className="stepper"><span className="active"><b>1</b>Email</span><i /><span className={step === 2 ? 'active' : ''}><b>2</b>Xác thực</span></div>
          {step === 1 ? (
            <form onSubmit={sendOtp} className="auth-form">
              <label><span>Email</span><div className="input-wrap"><Mail size={18} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" required /></div></label>
              {error && <p className="form-error">{error}</p>}
              <button className="primary-button" disabled={loading}>{loading ? 'Đang gửi…' : 'Gửi mã OTP'} <ArrowRight size={18} /></button>
            </form>
          ) : (
            <form onSubmit={register} className="auth-form">
              {message && <p className="form-success"><CheckCircle2 size={17} /> {message}</p>}
              <label><span>Mã OTP 6 số</span><div className="input-wrap"><ShieldCheck size={18} /><input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="000000" pattern="\d{6}" required /></div></label>
              <div className="otp-resend">
                <span>Chưa nhận được mã?</span>
                <button type="button" onClick={resendOtp} disabled={cooldown > 0 || loading}>
                  {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại OTP'}
                </button>
              </div>
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
        </section>
      </div>
    </main>
  )
}
