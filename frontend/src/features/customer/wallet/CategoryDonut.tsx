// Lucian UX/UI Prompt #097 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#097
import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Tags } from 'lucide-react'
import type { Category } from '../../../shared/types/api'
import { CATEGORY_ICON_MAP, getCategoryColor } from '../../../shared/categoryVisuals'
import './CategoryDonut.css'

const RADIUS = 80
const CIRCUMFERENCE = Math.PI * 2 * RADIUS
const GAP = 3

export function CategoryDonut({ categories, loading }: { categories: Category[]; loading: boolean }) {
  const data = useMemo(() => {
    return categories.slice(0, 60)
  }, [categories])
  const dataKey = data.map((category) => category.id).join(':')
  const [enabled, setEnabled] = useState<Set<number>>(() => new Set())
  const [activeId, setActiveId] = useState<number | null>(null)

  useEffect(() => {
    setEnabled(new Set(data.map((category) => category.id)))
    setActiveId(null)
  }, [dataKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const visibleCount = data.filter((category) => enabled.has(category.id)).length
  let accumulated = 0
  const slices = data.map((category) => {
    const visible = enabled.has(category.id)
    const fraction = visible && visibleCount ? 1 / visibleCount : 0
    const length = fraction * CIRCUMFERENCE
    const start = accumulated
    accumulated += length
    const middle = (start + length / 2) / CIRCUMFERENCE * Math.PI * 2
    return { category, visible, fraction, length, start, middle }
  })

  const active = data.find((category) => category.id === activeId && enabled.has(category.id))
  const toggle = (id: number) => {
    setEnabled((current) => {
      if (current.has(id) && current.size === 1) return current
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setActiveId((current) => current === id ? null : current)
  }
  const handleSliceKey = (event: KeyboardEvent<SVGCircleElement>, id: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggle(id)
    }
  }

  if (loading) return <section className="u097-wallet" aria-busy="true"><div className="u097-wallet__empty">Đang tải cơ cấu danh mục…</div></section>
  if (!data.length) return <section className="u097-wallet"><div className="u097-wallet__empty"><strong>Chưa có danh mục</strong><span>Tạo danh mục để xem biểu đồ cơ cấu.</span></div></section>

  return <section className={`u097-wallet${active ? ' has-active' : ''}`}>
    <header className="u097-wallet__header"><small>Cơ cấu danh mục thu và chi</small><b>Màu sắc ví của bạn</b></header>
    <div className="u097-wallet__donut" onPointerLeave={() => setActiveId(null)}>
      <svg viewBox="0 0 216 216" role="group" aria-label="Biểu đồ cơ cấu danh mục">
        <circle className="u097-wallet__track" cx="108" cy="108" r={RADIUS} />
        {slices.map(({ category, visible, fraction, length, start, middle }) => {
          const highlighted = activeId === category.id && visible
          const offset = highlighted ? 7 : 0
          return <circle
            key={category.id}
            className={`u097-wallet__slice${highlighted ? ' is-active' : ''}`}
            cx="108" cy="108" r={RADIUS}
            style={{
              '--slice-color': getCategoryColor(category.icon, category.type, category.color),
              '--slice-x': `${Math.cos(middle) * offset}px`,
              '--slice-y': `${Math.sin(middle) * offset}px`,
            } as CSSProperties}
            strokeDasharray={`${Math.max(0, length - GAP)} ${CIRCUMFERENCE}`}
            strokeDashoffset={-start - GAP / 2}
            opacity={visible ? 1 : 0}
            role="button" tabIndex={0}
            aria-label={`${category.name}, ${Math.round(fraction * 100)}%, ${visible ? 'đang hiển thị' : 'đang ẩn'}`}
            onPointerEnter={() => visible && setActiveId(category.id)}
            onFocus={() => visible && setActiveId(category.id)}
            onBlur={() => setActiveId(null)}
            onClick={() => toggle(category.id)}
            onKeyDown={(event) => handleSliceKey(event, category.id)}
          />
        })}
      </svg>
      <div className="u097-wallet__center" aria-live="polite">
        <small>{active?.name ?? 'Đang hiển thị'}</small>
        <b>{active ? '1 danh mục' : `${visibleCount} danh mục`}</b>
        <span>{active ? `${Math.round(100 / visibleCount)}% cơ cấu` : `trên tổng số ${data.length}`}</span>
      </div>
    </div>
    <div className="u097-wallet__legend" role="group" aria-label="Danh mục trong biểu đồ">
      {data.map((category) => {
        const included = enabled.has(category.id)
        const CategoryIcon = CATEGORY_ICON_MAP.get(category.icon) ?? Tags
        const color = getCategoryColor(category.icon, category.type, category.color)
        return <button
          key={category.id}
          type="button"
          className={activeId === category.id ? 'is-active' : ''}
          style={{ '--slice-color': color, '--slice-soft': `${color}18` } as CSSProperties}
          aria-pressed={included}
          aria-label={`${category.name}, ${included ? 'đang hiển thị' : 'đang ẩn'}`}
          onPointerEnter={() => included && setActiveId(category.id)}
          onPointerLeave={() => setActiveId(null)}
          onFocus={() => included && setActiveId(category.id)}
          onBlur={() => setActiveId(null)}
          onClick={() => toggle(category.id)}
        ><i aria-hidden="true"><CategoryIcon /></i><span>{category.name}</span><small>{category.type === 'EXPENSE' ? 'Chi' : 'Thu'}</small></button>
      })}
    </div>
  </section>
}
