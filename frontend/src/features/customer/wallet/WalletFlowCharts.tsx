// Lucian UX/UI Prompt #095 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#095
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import type { WalletTransaction } from '../../../shared/types/api'
import { formatVnd, formatVndCompact } from '../../../shared/utils/currency'
import './WalletFlowCharts.css'

type Period = 'week' | 'month' | 'year'
type Flow = 'income' | 'expense'
interface Point { label: string; fullLabel: string; value: number }

const PERIODS: Period[] = ['week', 'month', 'year']
const SLOT_COUNT = 12
const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const money = (value: number, _currency: string, compact = false) => compact ? formatVndCompact(value) : formatVnd(value)
const niceMaximum = (value: number) => {
  if (value <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(value / 3))
  return ([1, 2, 2.5, 5, 10].map((step) => step * power).find((step) => step * 3 >= value) ?? 10 * power) * 3
}

function pointsFor(transactions: WalletTransaction[], period: Period): Point[] {
  const now = new Date()
  if (period === 'week') return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - index))
    const key = dayKey(date)
    return { label: new Intl.DateTimeFormat('vi-VN', { weekday: 'narrow' }).format(date), fullLabel: new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(date), value: transactions.filter((item) => dayKey(new Date(item.createdAt)) === key).reduce((sum, item) => sum + item.amount, 0) }
  })
  if (period === 'month') {
    const year = now.getFullYear(), month = now.getMonth()
    return Array.from({ length: 5 }, (_, index) => ({ label: `T${index + 1}`, fullLabel: `Tuần ${index + 1}`, value: transactions.filter((item) => { const date = new Date(item.createdAt); return date.getFullYear() === year && date.getMonth() === month && Math.min(4, Math.floor((date.getDate() - 1) / 7)) === index }).reduce((sum, item) => sum + item.amount, 0) }))
  }
  const year = now.getFullYear()
  return Array.from({ length: 12 }, (_, index) => ({ label: String(index + 1), fullLabel: `Tháng ${index + 1}`, value: transactions.filter((item) => { const date = new Date(item.createdAt); return date.getFullYear() === year && date.getMonth() === index }).reduce((sum, item) => sum + item.amount, 0) }))
}

function useRollingNumber(target: number) {
  const [shown, setShown] = useState(0)
  const shownRef = useRef(0)
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const from = shownRef.current, started = performance.now(), duration = reduced ? 1 : 420
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration)
      const eased = 1 - (1 - progress) ** 3
      const next = from + (target - from) * eased
      shownRef.current = next; setShown(next)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])
  return shown
}

function FlowBarChart({ flow, transactions, currency }: { flow: Flow; transactions: WalletTransaction[]; currency: string }) {
  const [period, setPeriod] = useState<Period>('week')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null)
  const filtered = useMemo(() => transactions.filter((item) => flow === 'income' ? item.type === 'DEPOSIT' || item.type === 'TRANSFER_IN' : item.type === 'WITHDRAWAL' || item.type === 'TRANSFER_OUT'), [flow, transactions])
  const points = useMemo(() => pointsFor(filtered, period), [filtered, period])
  const slots = Array.from({ length: SLOT_COUNT }, (_, index) => points[index] ?? null)
  const total = points.reduce((sum, point) => sum + point.value, 0)
  const average = total / points.length
  const maximum = niceMaximum(Math.max(...points.map((point) => point.value), 0))
  const selectedIndex = activeIndex ?? pinnedIndex
  const selected = selectedIndex === null ? null : points[selectedIndex]
  const previous = selectedIndex !== null && selectedIndex > 0 ? points[selectedIndex - 1].value : null
  const change = selected && previous ? (selected.value - previous) / previous : null
  const shown = useRollingNumber(selected?.value ?? total)
  const periodLabel = period === 'week' ? '7 ngày gần nhất' : period === 'month' ? 'Tháng này' : 'Năm nay'

  const changePeriod = (next: Period) => { if (next !== period) { setPeriod(next); setActiveIndex(null); setPinnedIndex(null) } }
  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? points.length - 1 : null
    if (next === null) return
    event.preventDefault()
    const target = Math.max(0, Math.min(points.length - 1, next))
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('.u095-wallet__bar')[target]?.focus()
  }
  const sweep = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const index = Math.max(0, Math.min(points.length - 1, Math.floor((event.clientX - rect.left) / rect.width * points.length)))
    setActiveIndex(index)
    if (event.type === 'pointerdown' && event.pointerType !== 'mouse') event.currentTarget.setPointerCapture(event.pointerId)
  }
  const selectedRatio = selected ? selected.value / maximum : 0
  const tooltipStyle = { '--tip-x': `${((selectedIndex ?? 0) + .5) / points.length * 100}%`, '--tip-y': `${Math.max(0, selectedRatio * 72)}%` } as CSSProperties

  return <section className={`u095-wallet u095-wallet--${flow}${selected ? ' has-active' : ''}`}>
    <header className="u095-wallet__header">
      <div><div className="u095-wallet__top"><small>{selected?.fullLabel ?? periodLabel}</small>{change !== null && <span className={change < 0 ? 'is-down' : ''}>{change >= 0 ? '+' : '−'}{Math.abs(Math.round(change * 100))}%</span>}</div><b>{money(shown, currency, true)}</b></div>
      <div className="u095-wallet__period" style={{ '--period-index': PERIODS.indexOf(period) } as CSSProperties} role="group" aria-label="Khoảng thời gian">
        {([['week', 'T'], ['month', 'Th'], ['year', 'N']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={period === value} onClick={() => changePeriod(value)}>{label}</button>)}
      </div>
    </header>
    <div className="u095-wallet__chart">
      <div className="u095-wallet__grid" aria-hidden="true">{[0, 1, 2, 3].map((line) => <i key={line} style={{ bottom: `${line / 3 * 100}%` }}><span>{money(maximum * line / 3, currency, true)}</span></i>)}</div>
      <div className="u095-wallet__average" style={{ '--average': average / maximum } as CSSProperties} aria-hidden="true"><span>TB</span></div>
      <div className="u095-wallet__bars" role="group" aria-label={flow === 'income' ? 'Biểu đồ thu nhập' : 'Biểu đồ chi tiêu'} onPointerMove={sweep} onPointerDown={sweep} onPointerLeave={() => setActiveIndex(null)}>
        {slots.map((point, index) => <button key={index} type="button" className={`u095-wallet__bar${point ? '' : ' is-off'}${selectedIndex === index ? ' is-active' : ''}${pinnedIndex === index ? ' is-pinned' : ''}${index === points.length - 1 ? ' is-last' : ''}`} tabIndex={point ? (index === points.length - 1 ? 0 : -1) : -1} aria-label={point ? `${point.fullLabel}: ${money(point.value, currency)}` : undefined} style={{ '--bar-ratio': point ? point.value / maximum : 0, '--bar-delay': index, '--bar-padding': points.length > 8 ? '2.5px' : '5px' } as CSSProperties} onFocus={() => point && setActiveIndex(index)} onBlur={() => setActiveIndex(null)} onClick={() => point && setPinnedIndex((current) => current === index ? null : index)} onKeyDown={(event) => point && move(event, index)}><i /><em>{point?.label}</em></button>)}
      </div>
      <div className="u095-wallet__tooltip" style={tooltipStyle} aria-hidden="true"><b>{selected ? money(selected.value, currency, true) : ''}</b>{change !== null && <small className={change < 0 ? 'is-down' : ''}>{change >= 0 ? '+' : '−'}{Math.abs(Math.round(change * 100))}%</small>}</div>
    </div>
    <footer><span>{flow === 'income' ? 'Thu nhập' : 'Chi tiêu'}</span><small>Trung bình {money(average, currency, true)} / cột</small></footer>
  </section>
}

export function WalletFlowCharts({ transactions, currency, loading }: { transactions: WalletTransaction[]; currency: string; loading: boolean }) {
  if (loading) return <section className="u095-wallets u095-wallets--loading" aria-busy="true">Đang tải biểu đồ thu chi…</section>
  return <div className="u095-wallets"><FlowBarChart flow="income" transactions={transactions} currency={currency} /><FlowBarChart flow="expense" transactions={transactions} currency={currency} /></div>
}
