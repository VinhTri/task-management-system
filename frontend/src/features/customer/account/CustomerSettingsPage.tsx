import { useEffect, useState } from 'react'
import { CalendarDays, Camera, Check, Mail, MonitorCog, Moon, Pencil, ShieldCheck, Sun, UserRound, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { apiAssetUrl, request } from '../../../shared/api/http'
import { PortalShell } from '../../../shared/components/PortalShell'
import { useNotification } from '../../../shared/components/NotificationProvider'
import type { CurrentUser } from '../../../shared/types/api'

type SettingsSection = 'profile' | 'security' | 'system'

const sections = {
  profile: { label: 'Hồ sơ', description: 'Thông tin nhận diện và tài khoản SmartSpend.', Icon: UserRound },
  security: { label: 'Bảo mật', description: 'Theo dõi các lớp bảo vệ đang áp dụng.', Icon: ShieldCheck },
  system: { label: 'Cài đặt hệ thống', description: 'Tùy chỉnh cách SmartSpend hiển thị.', Icon: MonitorCog },
}

function formatMembershipDuration(createdAt: string) {
  const start = new Date(createdAt)
  const end = new Date()
  if (Number.isNaN(start.getTime()) || start > end) return 'Chưa xác định'

  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()
  let days = end.getDate() - start.getDate()
  if (days < 0) {
    months -= 1
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }
  return [years && `${years} năm`, months && `${months} tháng`, `${days} ngày`].filter(Boolean).join(' ')
}

export function CustomerSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [profile, setProfile] = useState<CurrentUser | null>(null)
  const [username, setUsername] = useState('')
  const [editingUsername, setEditingUsername] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingTheme, setSavingTheme] = useState(false)
  const [profileError, setProfileError] = useState('')
  const notify = useNotification()
  const requestedSection = searchParams.get('section')
  const section: SettingsSection = requestedSection === 'security' || requestedSection === 'system' ? requestedSection : 'profile'
  const compactSidebar = window.localStorage.getItem('smartspend-sidebar-collapsed') === 'true'
  const config = sections[section]

  useEffect(() => {
    request<CurrentUser>('customer', '/api/v1/me')
      .then((response) => { setProfile(response.data); setUsername(response.data.username) })
      .catch(() => undefined)
  }, [])

  const applyProfile = (updated: CurrentUser) => {
    setProfile(updated)
    setUsername(updated.username)
    window.dispatchEvent(new CustomEvent('smartspend-profile-change', { detail: updated }))
  }

  const saveProfile = async () => {
    setProfileError(''); setSavingProfile(true)
    try {
      const response = await request<CurrentUser>('customer', '/api/v1/me', {
        method: 'PATCH', body: JSON.stringify({ username: username.trim() }),
      })
      applyProfile(response.data)
      setEditingUsername(false)
      notify({ type: 'success', message: 'Đã cập nhật tên người dùng.' })
    } catch (reason) {
      setProfileError(reason instanceof Error ? reason.message : 'Không thể cập nhật hồ sơ.')
    } finally {
      setSavingProfile(false)
    }
  }

  const uploadAvatar = async (file?: File) => {
    if (!file) return
    setProfileError('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setProfileError('Avatar phải là ảnh JPG, PNG hoặc WEBP và không vượt quá 2 MB.')
      return
    }
    setSavingProfile(true)
    try {
      const body = new FormData(); body.append('avatar', file)
      const response = await request<CurrentUser>('customer', '/api/v1/me/avatar', { method: 'POST', body })
      applyProfile(response.data)
      notify({ type: 'success', message: 'Đã cập nhật avatar.' })
    } catch (reason) {
      setProfileError(reason instanceof Error ? reason.message : 'Không thể cập nhật avatar.')
    } finally {
      setSavingProfile(false)
    }
  }

  const changeTheme = async (theme: CurrentUser['theme']) => {
    if (!profile || profile.theme === theme || savingTheme) return
    setSavingTheme(true)
    try {
      const response = await request<CurrentUser>('customer', '/api/v1/me/preferences', {
        method: 'PATCH', body: JSON.stringify({ theme }),
      })
      applyProfile(response.data)
      notify({ type: 'success', message: `Đã chuyển sang giao diện ${theme === 'DARK' ? 'tối' : 'sáng'}.` })
    } catch (reason) {
      notify({ type: 'error', message: reason instanceof Error ? reason.message : 'Không thể đổi giao diện.' })
    } finally {
      setSavingTheme(false)
    }
  }

  const setCompactSidebar = (compact: boolean) => {
    window.localStorage.setItem('smartspend-sidebar-collapsed', String(compact))
    window.dispatchEvent(new CustomEvent('smartspend-sidebar-change', { detail: compact }))
    setSearchParams({ section: 'system', compact: String(compact) }, { replace: true })
  }

  return <PortalShell portal="customer">
    <section className="content-card settings-page">
      <header className="settings-page__header"><span><config.Icon size={22} /></span><div><h2>{config.label}</h2><p>{config.description}</p></div></header>
      <div className="settings-page__layout">
        <nav aria-label="Nhóm cài đặt">{(Object.keys(sections) as SettingsSection[]).map((key) => { const item = sections[key]; return <button type="button" className={section === key ? 'active' : ''} onClick={() => setSearchParams({ section: key })} key={key}><item.Icon size={18} /><span><strong>{item.label}</strong><small>{item.description}</small></span></button> })}</nav>
        <div className="settings-page__content">
          {section === 'profile' && <><div className="settings-profile-hero"><span>{profile?.avatarUrl ? <img src={apiAssetUrl('customer', profile.avatarUrl) || ''} alt={`Avatar của ${profile.username}`} /> : (profile?.username || 'U').charAt(0).toUpperCase()}</span><div><div className="settings-profile-name"><h3>{profile?.username || 'Đang tải hồ sơ...'}</h3><button type="button" aria-label="Đổi tên người dùng" title="Đổi tên người dùng" disabled={!profile || savingProfile} onClick={() => { setUsername(profile?.username || ''); setProfileError(''); setEditingUsername(true) }}><Pencil size={14} /></button></div><p>{profile?.email || '—'}</p><label className="settings-avatar-button"><Camera size={14} /> Đổi avatar<input type="file" accept="image/jpeg,image/png,image/webp" disabled={savingProfile} onChange={(event) => { void uploadAvatar(event.target.files?.[0]); event.currentTarget.value = '' }} /></label></div></div>{editingUsername && <div className="settings-profile-form"><label><span>Tên người dùng</span><div className="settings-username-field"><input autoFocus value={username} minLength={3} maxLength={50} pattern="[a-zA-Z0-9._-]+" onChange={(event) => setUsername(event.target.value)} placeholder="Nhập tên người dùng" /><div className="settings-username-actions"><button type="button" className="save" aria-label="Lưu tên người dùng" title="Lưu tên người dùng" disabled={savingProfile || username.trim() === profile?.username} onClick={() => void saveProfile()}><Check size={18} /></button><button type="button" className="cancel" aria-label="Hủy đổi tên" title="Hủy đổi tên" disabled={savingProfile} onClick={() => { setUsername(profile?.username || ''); setProfileError(''); setEditingUsername(false) }}><X size={18} /></button></div></div><small>3–50 ký tự; dùng chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.</small></label></div>}{profileError && <p className="form-error" role="alert">{profileError}</p>}<div className="settings-info-row"><span><Mail size={15} /> Email đăng nhập</span><strong>{profile?.email || '—'}</strong></div><div className="settings-info-row"><span><CalendarDays size={15} /> Ngày đăng ký</span><strong>{profile?.createdAt ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(profile.createdAt)) : '—'}</strong></div><div className="settings-info-row"><span>Thời gian hoạt động</span><strong>{profile?.createdAt ? formatMembershipDuration(profile.createdAt) : '—'}</strong></div><div className="settings-info-row"><span>Trạng thái</span><strong className="settings-status">{profile?.status === 'DISABLED' ? 'Đã vô hiệu hóa' : 'Đang hoạt động'}</strong></div></>}
          {section === 'security' && <><h3>Bảo vệ tài khoản</h3><p>Mọi giao dịch đều yêu cầu mã PIN và được xác thực tại máy chủ trước khi cập nhật số dư.</p><div className="settings-security-card"><ShieldCheck size={21} /><div><strong>Mã PIN giao dịch</strong><small>Đang được bật cho nạp, rút và chuyển tiền.</small></div><b>Đã bật</b></div><div className="settings-security-card"><ShieldCheck size={21} /><div><strong>Phiên đăng nhập an toàn</strong><small>Token truy cập được làm mới và thu hồi khi đăng xuất.</small></div><b>Đã bật</b></div></>}
          {section === 'system' && <><h3>Hiển thị hệ thống</h3><p>Chế độ màu được đồng bộ theo tài khoản của bạn trên mọi thiết bị.</p><div className="settings-theme-picker" role="radiogroup" aria-label="Chế độ giao diện"><button type="button" role="radio" aria-checked={profile?.theme !== 'DARK'} className={profile?.theme !== 'DARK' ? 'active' : ''} disabled={savingTheme} onClick={() => void changeTheme('LIGHT')}><span><Sun size={22} /></span><div><strong>Giao diện sáng</strong><small>Rõ ràng, phù hợp ban ngày</small></div><Check size={17} /></button><button type="button" role="radio" aria-checked={profile?.theme === 'DARK'} className={profile?.theme === 'DARK' ? 'active' : ''} disabled={savingTheme} onClick={() => void changeTheme('DARK')}><span><Moon size={22} /></span><div><strong>Giao diện tối</strong><small>Dịu mắt trong môi trường thiếu sáng</small></div><Check size={17} /></button></div><div className="settings-toggle-row"><div><strong>Thu gọn thanh điều hướng</strong><small>Dành thêm không gian cho nội dung chính trên thiết bị này.</small></div><button type="button" role="switch" aria-checked={compactSidebar} className={`settings-switch ${compactSidebar ? 'active' : ''}`} onClick={() => setCompactSidebar(!compactSidebar)}><span /></button></div></>}
        </div>
      </div>
    </section>
  </PortalShell>
}
