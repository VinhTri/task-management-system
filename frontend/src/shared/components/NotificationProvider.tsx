import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { createClientId } from '../utils/id'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface NotificationInput {
  type?: NotificationType
  title?: string
  message: string
  duration?: number
}

interface NotificationItem extends NotificationInput {
  id: string
  type: NotificationType
}

const NotificationContext = createContext<((input: NotificationInput) => void) | null>(null)

const titles: Record<NotificationType, string> = {
  success: 'Thành công', error: 'Có lỗi xảy ra', warning: 'Cần chú ý', info: 'Thông báo',
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const dismiss = useCallback((id: string) => setItems((current) => current.filter((item) => item.id !== id)), [])
  const notify = useCallback((input: NotificationInput) => {
    const item: NotificationItem = { ...input, id: createClientId(), type: input.type || 'info' }
    setItems((current) => [...current.slice(-3), item])
    window.setTimeout(() => dismiss(item.id), input.duration ?? 3500)
  }, [dismiss])
  const value = useMemo(() => notify, [notify])

  return <NotificationContext.Provider value={value}>{children}<div className="notification-stack" aria-live="polite">{items.map((item) => {
    const Icon = item.type === 'success' ? CheckCircle2 : item.type === 'info' ? Info : CircleAlert
    return <article key={item.id} className={`notification notification--${item.type}`}><span><Icon size={20} /></span><div><strong>{item.title || titles[item.type]}</strong><p>{item.message}</p></div><button onClick={() => dismiss(item.id)} aria-label="Đóng thông báo"><X size={17} /></button></article>
  })}</div></NotificationContext.Provider>
}

export function useNotification() {
  const notify = useContext(NotificationContext)
  if (!notify) throw new Error('useNotification must be used inside NotificationProvider')
  return notify
}
