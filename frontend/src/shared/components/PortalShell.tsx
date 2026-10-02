import type { ReactNode } from 'react'
import { Bell, ChevronDown, LayoutDashboard, LogOut, Settings, Tags, Users, WalletCards } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../api/http'
import type { Portal } from '../auth/session'
import { Brand } from './Brand'

export function PortalShell({ portal, children }: { portal: Portal; children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const admin = portal === 'admin'
  const walletPage = location.pathname === '/customer/wallet'
  const categoryPage = location.pathname === '/customer/categories'
  const signOut = async () => {
    await logout(portal)
    navigate(`/${portal}/login`, { replace: true })
  }
  return <div className={`portal portal--${portal}`}>
    <aside className="sidebar">
      <Brand inverse />
      <nav>
        <NavLink to={`/${portal}`} end><LayoutDashboard size={19} /> Tổng quan</NavLink>
        {admin
          ? <a><Users size={19} /> Người dùng</a>
          : <NavLink to="/customer/wallet"><WalletCards size={19} /> Ví của tôi</NavLink>}
        {!admin && <NavLink to="/customer/categories"><Tags size={19} /> Danh mục</NavLink>}
        <a><Settings size={19} /> Cài đặt</a>
      </nav>
      <button onClick={signOut}><LogOut size={18} /> Đăng xuất</button>
    </aside>
    <div className="portal__main">
      <header className="topbar"><div><p>{admin ? 'Khu vực quản trị' : 'Không gian cá nhân'}</p><h2>{admin ? 'Trung tâm điều hành' : walletPage ? 'Ví của tôi' : categoryPage ? 'Danh mục giao dịch' : 'Tổng quan tài chính'}</h2></div><div className="topbar__actions"><button aria-label="Thông báo"><Bell size={19} /></button><span className="avatar">{admin ? 'AD' : 'TV'}</span><span className="profile-name">{admin ? 'Administrator' : 'Tài khoản của tôi'}</span><ChevronDown size={16} /></div></header>
      <div className="portal__content">{children}</div>
    </div>
  </div>
}
