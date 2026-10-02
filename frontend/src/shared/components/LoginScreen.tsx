import { useState, type FormEvent } from 'react'
import { ArrowRight, BarChart3, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login, request } from '../api/http'
import type { AccountOverview } from '../types/api'
import type { Portal } from '../auth/session'
import { Brand } from './Brand'

interface LoginScreenProps {
  portal: Portal
}

export function LoginScreen({ portal }: LoginScreenProps) {
  const admin = portal === 'admin'
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(portal, email, password)
      const requested = (location.state as { from?: string } | null)?.from
      if (!admin) {
        const account = await request<AccountOverview>('customer', '/api/v1/account')
        navigate(account.data.pinConfigured ? (requested || '/customer') : '/customer/setup-pin', { replace: true })
      } else {
        navigate(requested || '/admin', { replace: true })
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Đăng nhập không thành công.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={`auth-page auth-page--${portal}`}>
      <section className="auth-story">
        <Brand inverse />
        <div className="auth-story__content">
          <span className="eyebrow"><Sparkles size={15} /> {admin ? 'Không gian vận hành' : 'Tài chính nhẹ nhàng hơn'}</span>
          <h1>{admin ? 'Điều hành hệ thống, rõ ràng từng nhịp.' : 'Tiền của bạn. Kế hoạch của bạn.'}</h1>
          <p>{admin
            ? 'Một nơi tập trung để theo dõi người dùng, kiểm soát truy cập và giữ SmartSpend vận hành an toàn.'
            : 'Theo dõi chi tiêu, xây dựng thói quen và tiến gần hơn đến những điều quan trọng với bạn.'}</p>
          <div className="story-stat">
            <span className="story-stat__icon">{admin ? <ShieldCheck /> : <BarChart3 />}</span>
            <div><strong>{admin ? 'Bảo mật theo vai trò' : 'Một góc nhìn duy nhất'}</strong><small>{admin ? 'Khu vực dành riêng cho quản trị viên' : 'Nắm bắt dòng tiền trong vài giây'}</small></div>
          </div>
        </div>
        <p className="auth-story__foot">© 2026 SmartSpend · Tài chính thông minh mỗi ngày</p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="mobile-brand"><Brand /></div>
          <span className="auth-card__badge">{admin ? 'ADMIN PORTAL' : 'WELCOME BACK'}</span>
          <h2>{admin ? 'Đăng nhập quản trị' : 'Chào mừng trở lại'}</h2>
          <p className="auth-card__intro">{admin ? 'Sử dụng tài khoản quản trị được cấp.' : 'Tiếp tục hành trình tài chính của bạn.'}</p>

          <form onSubmit={submit} className="auth-form">
            <label>
              <span>Email</span>
              <div className="input-wrap"><Mail size={18} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={admin ? 'admin@smartspend.vn' : 'ban@email.com'} autoComplete="email" required /></div>
            </label>
            <label>
              <span>Mật khẩu</span>
              <div className="input-wrap"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu" autoComplete="current-password" minLength={12} required /><button type="button" className="icon-button" onClick={() => setShowPassword((value) => !value)} aria-label="Hiện hoặc ẩn mật khẩu">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            </label>
            <div className="form-options">
              <label className="check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span /> Ghi nhớ đăng nhập</label>
              {!admin && <Link to="/customer/forgot-password">Quên mật khẩu?</Link>}
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" disabled={loading}>{loading ? 'Đang đăng nhập…' : 'Đăng nhập'} {!loading && <ArrowRight size={18} />}</button>
          </form>

          {!admin && <p className="auth-switch">Chưa có tài khoản? <Link to="/customer/register">Đăng ký miễn phí</Link></p>}
          <Link className="portal-link" to={admin ? '/customer/login' : '/admin/login'}>{admin ? '← Về trang đăng nhập khách hàng' : 'Đăng nhập dành cho quản trị viên →'}</Link>
        </div>
      </section>
    </main>
  )
}
