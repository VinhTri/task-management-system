// Lucian UX/UI Prompt #040 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#040
import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { BarChart3, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react'
import type { Portal } from '../auth/session'
import { Brand } from './Brand'

interface RailItem {
  label: string
  description: string
  icon: ReactNode
}

const CUSTOMER_ITEMS: RailItem[] = [
  { label: 'Tổng quan', description: 'Nắm bắt dòng tiền của bạn chỉ trong vài giây.', icon: <BarChart3 aria-hidden="true" /> },
  { label: 'Bảo mật', description: 'Mọi phiên đăng nhập đều được bảo vệ an toàn.', icon: <ShieldCheck aria-hidden="true" /> },
  { label: 'Thông minh', description: 'Theo dõi chi tiêu và xây dựng thói quen tốt hơn.', icon: <Sparkles aria-hidden="true" /> },
]

const ADMIN_ITEMS: RailItem[] = [
  { label: 'Vận hành', description: 'Theo dõi hệ thống từ một không gian tập trung.', icon: <BarChart3 aria-hidden="true" /> },
  { label: 'Phân quyền', description: 'Truy cập quản trị được kiểm soát theo vai trò.', icon: <ShieldCheck aria-hidden="true" /> },
  { label: 'An toàn', description: 'Bảo vệ dữ liệu và hoạt động quan trọng.', icon: <Sparkles aria-hidden="true" /> },
]

export function ExpandingAuthRail({ portal }: { portal: Portal }) {
  const [expanded, setExpanded] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const items = portal === 'admin' ? ADMIN_ITEMS : CUSTOMER_ITEMS

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const direction = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
    if (!direction) return
    event.preventDefault()
    const buttons = event.currentTarget.closest('ul')?.querySelectorAll<HTMLButtonElement>('.u040-login__rail-item')
    buttons?.[(index + direction + items.length) % items.length]?.focus()
  }

  return (
    <aside className={`u040-login__rail${expanded ? ' is-wide' : ''}`} aria-label="Giới thiệu SmartSpend">
      <div className="u040-login__rail-top"><Brand inverse /></div>
      <button
        className="u040-login__rail-toggle"
        type="button"
        aria-expanded={expanded}
        aria-label={expanded ? 'Thu gọn phần giới thiệu' : 'Mở rộng phần giới thiệu'}
        onClick={() => setExpanded((value) => !value)}
      >
        <ChevronRight aria-hidden="true" />
      </button>

      <div className="u040-login__rail-copy">
        <span>{portal === 'admin' ? 'KHÔNG GIAN VẬN HÀNH' : 'TÀI CHÍNH NHẸ NHÀNG HƠN'}</span>
        <h1>{portal === 'admin' ? 'Điều hành hệ thống, rõ ràng từng nhịp.' : 'Tiền của bạn. Kế hoạch của bạn.'}</h1>
      </div>

      <ul className="u040-login__rail-nav">
        <li className="u040-login__rail-highlight" style={{ '--rail-y': `${activeIndex * 58}px` } as CSSProperties} aria-hidden="true" />
        {items.map((item, index) => (
          <li key={item.label}>
            <button
              className="u040-login__rail-item"
              type="button"
              aria-current={activeIndex === index ? 'true' : undefined}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => moveFocus(event, index)}
            >
              {item.icon}<span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="u040-login__rail-detail" aria-live="polite">{items[activeIndex].description}</p>
      <small className="u040-login__rail-foot">© 2026 SmartSpend</small>
    </aside>
  )
}
