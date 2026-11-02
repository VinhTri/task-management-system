import { useState, type FormEvent } from 'react'
// Lucian UX/UI Prompt #040 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#040
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login, request } from '../api/http'
import type { AccountOverview } from '../types/api'
import type { Portal } from '../auth/session'
import { Brand } from './Brand'
import './ExpandingAuthRail.css'

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
    <main className="u040-login">
      <section className={`u040-login__shell${admin ? ' u040-login__shell--admin' : ''}`}>
        <div className="u040-login__panel">
          <div className="u040-login__card">
            <div className="u040-login__brand"><Brand /></div>
            <h2>{admin ? 'Đăng nhập quản trị' : 'Chào mừng trở lại'}</h2>
            <p className="u040-login__intro">{admin ? 'Đăng nhập bằng tài khoản quản trị được cấp' : 'Đăng nhập vào tài khoản SmartSpend của bạn'}</p>

          <form onSubmit={submit} className="u040-login__form">
            <label>
              <span>Email</span>
              <div className="u040-login__input"><span className="u040-login__input-icon"><Mail aria-hidden="true" /></span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={admin ? 'admin@smartspend.vn' : 'Email của bạn'} autoComplete="email" required /></div>
            </label>
            <label>
              <span>Mật khẩu</span>
              <div className="u040-login__input"><span className="u040-login__input-icon"><LockKeyhole aria-hidden="true" /></span><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" autoComplete="current-password" minLength={12} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? <EyeOff /> : <Eye />}</button></div>
            </label>
            {!admin && <div className="u040-login__options"><Link to="/customer/forgot-password">Quên mật khẩu?</Link></div>}
            {error && <p className="u040-login__error" role="alert">{error}</p>}
            <button className="u040-login__submit" disabled={loading}>{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
          </form>

            {!admin && <p className="u040-login__switch">Chưa có tài khoản? <Link to="/customer/register">Đăng ký miễn phí</Link></p>}
            <Link className="u040-login__portal-link" to={admin ? '/customer/login' : '/admin/login'}>{admin ? '← Về đăng nhập khách hàng' : 'Đăng nhập dành cho quản trị viên →'}</Link>
          </div>
        </div>
        <aside className="u040-login__visual" aria-label="Giới thiệu SmartSpend">
          <div className="u040-login__visual-art" aria-hidden="true">
            <div className="u040-login__glass u040-login__glass--balance"><i /><span /><b /></div>
            <div className="u040-login__glass u040-login__glass--chart"><i /><i /><i /><i /><i /></div>
            <div className="u040-login__orb" />
          </div>
          <div className="u040-login__visual-copy">
            <span>{admin ? 'SMARTSPEND ADMIN' : 'SMARTSPEND'}</span>
            <h1>{admin ? 'Vận hành rõ ràng. Kiểm soát an toàn.' : 'Tài chính thông minh. Cuộc sống nhẹ nhàng.'}</h1>
            <p>{admin ? 'Theo dõi hoạt động và quản lý hệ thống trong một không gian tập trung.' : 'Theo dõi dòng tiền, quản lý chi tiêu và xây dựng kế hoạch tài chính theo cách của bạn.'}</p>
            <ul className="u040-login__visual-points">
              {(admin ? ['Quản lý hệ thống tập trung', 'Phân quyền truy cập an toàn', 'Theo dõi hoạt động rõ ràng'] : ['Nắm bắt dòng tiền tức thời', 'Phân loại chi tiêu thông minh', 'Bảo vệ tài khoản nhiều lớp']).map((item) => <li key={item}><b>✓</b>{item}</li>)}
            </ul>
          </div>
        </aside>
      </section>
    </main>
  )
}
