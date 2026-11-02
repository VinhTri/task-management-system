import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, ExternalLink, FolderCog, History, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, PieChart, Settings, Shield, ShieldCheck, SlidersHorizontal, Tags, UserRound, WalletCards, Zap } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { apiAssetUrl, logout, request } from '../api/http'
import type { Portal } from '../auth/session'
import type { CurrentUser } from '../types/api'
import { applyTheme } from '../utils/theme'
import { Brand } from './Brand'
import './PortalViewport.css'

export function PortalShell({ portal, children }: { portal: Portal; children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const admin = portal === 'admin'
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [walletMenuOpen, setWalletMenuOpen] = useState(true)
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.localStorage.getItem('smartspend-sidebar-collapsed') === 'true')
  const displayName = currentUser?.username || currentUser?.email?.split('@')[0] || (admin ? 'Quản trị viên' : 'Tài khoản')
  const avatarUrl = apiAssetUrl(portal, currentUser?.avatarUrl)

  const pageHeader = portal === 'admin'
    ? 'Quản trị hệ thống'
    : location.pathname === '/customer/transactions'
      ? 'Lịch sử giao dịch'
      : location.pathname === '/customer/operations'
        ? 'Giao dịch nhanh'
      : location.pathname === '/customer/categories/manage'
        ? 'Quản lý danh mục'
      : location.pathname === '/customer/categories'
        ? 'Tổng quan danh mục'
      : location.pathname === '/customer/settings'
        ? 'Cài đặt tài khoản'
        : 'Tổng quan ví'
  useEffect(() => {
    if (portal !== 'customer') return

    const checkSession = () => {
      if (document.visibilityState === 'visible') {
        request<CurrentUser>('customer', '/api/v1/me')
          .then((response) => { setCurrentUser(response.data); applyTheme(response.data.theme, response.data.id) })
          .catch(() => undefined)
      }
    }

    checkSession()
    const timer = window.setInterval(checkSession, 15_000)
    window.addEventListener('focus', checkSession)
    document.addEventListener('visibilitychange', checkSession)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', checkSession)
      document.removeEventListener('visibilitychange', checkSession)
    }
  }, [portal])

  useEffect(() => {
    const closeSettings = (event: MouseEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) setSettingsOpen(false)
    }
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false)
    }
    document.addEventListener('mousedown', closeSettings)
    document.addEventListener('keydown', closeWithEscape)
    return () => {
      document.removeEventListener('mousedown', closeSettings)
      document.removeEventListener('keydown', closeWithEscape)
    }
  }, [])

  useEffect(() => {
    const syncSidebar = (event: Event) => setSidebarCollapsed(Boolean((event as CustomEvent<boolean>).detail))
    window.addEventListener('smartspend-sidebar-change', syncSidebar)
    return () => window.removeEventListener('smartspend-sidebar-change', syncSidebar)
  }, [])

  useEffect(() => {
    document.documentElement.scrollLeft = 0
    document.body.scrollLeft = 0
  }, [location.pathname, sidebarCollapsed])

  useEffect(() => {
    const syncProfile = (event: Event) => {
      const profile = (event as CustomEvent<CurrentUser>).detail
      setCurrentUser(profile)
      applyTheme(profile.theme, profile.id)
    }
    window.addEventListener('smartspend-profile-change', syncProfile)
    return () => window.removeEventListener('smartspend-profile-change', syncProfile)
  }, [])

  const signOut = async () => {
    await logout(portal)
    navigate(`/${portal}/login`, { replace: true })
  }
  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      window.localStorage.setItem('smartspend-sidebar-collapsed', String(!collapsed))
      return !collapsed
    })
  }

  return <div className={`test-layout portal-scroll-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    <header className="test-header">
      <Brand />
      <nav className="sidebar-nav">{admin
        ? <><span className="sidebar-nav__label">HỆ THỐNG</span><NavLink to="/admin"><LayoutDashboard size={18} /><span>Quản trị</span></NavLink></>
        : <><span className="sidebar-nav__label">QUẢN LÝ TÀI CHÍNH</span><div className={`sidebar-group ${['/customer/wallet','/customer/operations','/customer/transactions'].includes(location.pathname) ? 'active' : ''}`}>
          <button type="button" className="sidebar-group__trigger" onClick={() => setWalletMenuOpen((open) => !open)} aria-expanded={walletMenuOpen}><span><WalletCards size={19} /><span>Ví của tôi</span></span><ChevronDown size={16} className={walletMenuOpen ? 'open' : ''} /></button>
          <div className={`sidebar-submenu ${walletMenuOpen ? 'open' : ''}`}>
            <NavLink to="/customer/wallet"><LayoutDashboard size={16} /><span>Tổng quan ví</span></NavLink>
            <NavLink to="/customer/operations"><Zap size={16} /><span>Giao dịch nhanh</span></NavLink>
            <NavLink to="/customer/transactions"><History size={16} /><span>Lịch sử giao dịch</span></NavLink>
          </div>
        </div><div className={`sidebar-group ${location.pathname.startsWith('/customer/categories') ? 'active' : ''}`}>
          <button type="button" className="sidebar-group__trigger" onClick={() => setCategoryMenuOpen((open) => !open)} aria-expanded={categoryMenuOpen}><span><Tags size={19} /><span>Danh mục</span></span><ChevronDown size={16} className={categoryMenuOpen ? 'open' : ''} /></button>
          <div className={`sidebar-submenu ${categoryMenuOpen ? 'open' : ''}`}>
            <NavLink end to="/customer/categories"><PieChart size={16} /><span>Tổng quan danh mục</span></NavLink>
            <NavLink to="/customer/categories/manage"><FolderCog size={16} /><span>Quản lý danh mục</span></NavLink>
          </div>
        </div></>}
      </nav>
      <div className="sidebar-security"><span><ShieldCheck size={17} /></span><div><strong>Kết nối an toàn</strong><small>Dữ liệu được bảo vệ</small></div></div>
    </header>
    <div className="test-main">
      <div className="test-topbar">
        <button type="button" className="sidebar-toggle" onClick={toggleSidebar} aria-label={sidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'} title={sidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}>{sidebarCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}</button>
        <div className="topbar-page-title"><h1>{pageHeader}</h1></div>
        <div className="topbar-account"><span className="topbar-avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : displayName.charAt(0).toUpperCase()}</span><span className="topbar-account__copy"><strong>{displayName}</strong><small>{currentUser?.email || (admin ? 'ADMIN' : 'USER')}</small></span></div>
        <div className="topbar-settings" ref={settingsRef}>
          <button type="button" className={settingsOpen ? 'active' : ''} aria-label="Mở cài đặt" aria-haspopup="menu" aria-expanded={settingsOpen} onClick={() => setSettingsOpen((open) => !open)}><Settings size={18} /></button>
          {settingsOpen && <div className="topbar-settings__menu" role="menu">
            <div className="topbar-settings__identity"><span>{avatarUrl ? <img src={avatarUrl} alt="" /> : displayName.charAt(0).toUpperCase()}</span><div><strong>{displayName}</strong><small>{currentUser?.email || (admin ? 'ADMIN' : 'USER')}</small></div></div>
            {!admin && <>
              <button type="button" role="menuitem" onClick={() => { navigate('/customer/settings?section=profile'); setSettingsOpen(false) }}><UserRound size={17} /><span><strong>Hồ sơ</strong><small>Thông tin tài khoản</small></span></button>
              <button type="button" role="menuitem" onClick={() => { navigate('/customer/settings?section=security'); setSettingsOpen(false) }}><Shield size={17} /><span><strong>Bảo mật</strong><small>Mật khẩu và mã PIN</small></span></button>
              <button type="button" role="menuitem" onClick={() => { navigate('/customer/settings?section=system'); setSettingsOpen(false) }}><SlidersHorizontal size={17} /><span><strong>Cài đặt hệ thống</strong><small>Tùy chỉnh giao diện</small></span></button>
            </>}
            <button type="button" role="menuitem" className="topbar-settings__logout" onClick={signOut}><LogOut size={17} /><span><strong>Đăng xuất</strong><small>Kết thúc phiên hiện tại</small></span></button>
          </div>}
        </div>
      </div>
      <main className="test-content">{children}</main>
      <footer className="portal-footer">
        <div className="portal-footer__partners">
          <div className="portal-footer__certification"><span><ShieldCheck size={24} /></span><div><strong>ISO 27001</strong><small>Chứng nhận bảo mật</small></div></div>
          <i aria-hidden />
          <span className="portal-footer__label">Đối tác chiến lược</span>
          <div className="portal-footer__brands" aria-label="Đối tác SmartSpend"><b>Vietcombank</b><b>BIDV</b><b>VietinBank</b><b>VPBank</b><b>MB</b><b>ACB</b><b>TPBank</b><b>OCB</b><b>NAPAS</b></div>
        </div>
        <div className="portal-footer__bottom">
          <nav aria-label="Liên kết cuối trang"><a href="#guide">Hướng dẫn</a><a href="#support">Hỗ trợ</a><a href="#status">API status</a><a href="#developers">Tài liệu nhà phát triển <ExternalLink size={12} /></a></nav>
          <span>© 2026 SmartSpend. All rights reserved.</span>
        </div>
      </footer>
    </div>
  </div>
}
