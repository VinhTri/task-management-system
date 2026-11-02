import { FormEvent, useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Tags, Trash2 } from 'lucide-react'
import { request } from '../../../shared/api/http'
import { PortalShell } from '../../../shared/components/PortalShell'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { useNotification } from '../../../shared/components/NotificationProvider'
import type { Category, CategoryPayload, CategoryType } from '../../../shared/types/api'
import { CATEGORY_ICON_MAP, CATEGORY_ICONS, getCategoryColor } from '../../../shared/categoryVisuals'
import '../../../category.css'
const emptyForm: CategoryPayload = { name: '', type: 'EXPENSE', icon: 'food', color: getCategoryColor('food', 'EXPENSE') }

export function CategoriesPage() {
  const notify = useNotification()
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<CategoryPayload>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)
  const isAtLimit = categories.length >= 60
  const sameTypeCategories = categories.filter((category) => category.type === form.type)
  const usedIconKeys = new Set(sameTypeCategories.map((category) => category.icon))
  const expenseCategories = categories.filter((category) => category.type === 'EXPENSE')
  const incomeCategories = categories.filter((category) => category.type === 'INCOME')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await request<Category[]>('customer', '/api/v1/categories')
      setCategories(result.data)
      resetForm(result.data)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải danh mục.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const resetForm = (source = categories) => {
    const expenseIcons = new Set(source.filter((category) => category.type === 'EXPENSE').map((category) => category.icon))
    const incomeIcons = new Set(source.filter((category) => category.type === 'INCOME').map((category) => category.icon))
    const expenseIcon = CATEGORY_ICONS.find((item) => !expenseIcons.has(item.key))?.key
    const type: CategoryType = expenseIcon ? 'EXPENSE' : 'INCOME'
    const icon = expenseIcon ?? CATEGORY_ICONS.find((item) => !incomeIcons.has(item.key))?.key ?? emptyForm.icon
    setForm({ ...emptyForm, type, icon, color: getCategoryColor(icon, type) }); setError('')
  }

  const changeType = (type: CategoryType) => {
    const unavailable = new Set(categories
      .filter((category) => category.type === type)
      .map((category) => category.icon))
    const icon = unavailable.has(form.icon)
      ? (CATEGORY_ICONS.find((item) => !unavailable.has(item.key))?.key ?? form.icon)
      : form.icon
    setForm({ ...form, type, icon, color: getCategoryColor(icon, type, form.color) })
    setError('')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    const normalizedName = form.name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi')
    if (sameTypeCategories.some((category) => category.name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi') === normalizedName)) {
      setError(`Tên danh mục này đã có trong phần ${form.type === 'INCOME' ? 'thu nhập' : 'chi tiêu'}.`)
      return
    }
    if (usedIconKeys.has(form.icon)) {
      setError(`Icon này đã có trong phần ${form.type === 'INCOME' ? 'thu nhập' : 'chi tiêu'}.`)
      return
    }
    setSaving(true)
    try {
      const result = await request<Category>('customer', '/api/v1/categories', {
        method: 'POST', body: JSON.stringify(form),
      })
      notify({ type: 'success', message: result.message }); await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể lưu danh mục.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleting(true)
    setError('')
    const animation = new Promise((resolve) => window.setTimeout(resolve, 4200))
    try {
      const result = await request<void>('customer', `/api/v1/categories/${target.id}`, { method: 'DELETE' })
      await animation
      setDeleteTarget(null)
      await load()
      notify({ type: 'success', message: result.message })
    } catch (reason) {
      await animation
      notify({ type: 'error', message: reason instanceof Error ? reason.message : 'Không thể xóa danh mục.' })
    } finally {
      setDeleting(false)
    }
  }

  const content = <>
    <section className="category-workspace">
      <aside className="content-card category-editor"><form className="category-form" onSubmit={submit}><div className="category-form__head"><div><span className="eyebrow">DANH MỤC MỚI</span><h2>Thêm danh mục</h2><p>Chọn loại và một icon chưa được sử dụng.</p></div></div>
      <label><span>Tên danh mục</span><input required maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ví dụ: Ăn uống" disabled={isAtLimit} /></label>
      <fieldset className="category-type-picker" disabled={isAtLimit}><legend>Loại danh mục</legend><button type="button" className={form.type === 'EXPENSE' ? 'active' : ''} onClick={() => changeType('EXPENSE')}>Chi tiêu</button><button type="button" className={form.type === 'INCOME' ? 'active' : ''} onClick={() => changeType('INCOME')}>Thu nhập</button></fieldset>
      <fieldset className="category-icon-picker" disabled={isAtLimit}><legend>Chọn biểu tượng <small>Icon đã dùng sẽ bị khóa</small></legend><div>{CATEGORY_ICONS.map(({ key, label, Icon }) => {
        const used = usedIconKeys.has(key)
        const iconColor = getCategoryColor(key, form.type)
        return <button type="button" key={key} disabled={used} style={{ '--icon-color': iconColor, '--icon-soft': `${iconColor}18` } as CSSProperties} className={`${form.icon === key ? 'active' : ''}${used ? ' used' : ''}`} title={used ? `${label} · Đã có` : label} aria-label={`${label}${used ? ', đã có' : ''}`} aria-pressed={form.icon === key} onClick={() => setForm({ ...form, icon: key, color: iconColor })}><Icon /><span>{label}</span>{used && <em>Đã có</em>}</button>
      })}</div></fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={saving || isAtLimit}>{saving ? 'Đang lưu...' : isAtLimit ? 'Đã đạt giới hạn 60' : 'Tạo danh mục'}</button>
    </form></aside>
    <div className="content-card category-panel">
      <div className="category-embedded-head"><div><h3>Danh sách danh mục</h3><p>Thu nhập và chi tiêu của bạn.</p></div><span className={`category-count${isAtLimit ? ' limit' : ''}`}>{categories.length}/60</span></div>
      {loading ? <div className="category-empty">Đang tải danh mục...</div> : categories.length === 0 ? <div className="category-empty"><Tags size={34} /><strong>Chưa có danh mục</strong><p>Hãy tạo danh mục đầu tiên ở biểu mẫu bên trái.</p></div> : <div className="category-columns">{([
        { type: 'EXPENSE', title: 'Danh mục chi tiêu', items: expenseCategories },
        { type: 'INCOME', title: 'Danh mục thu nhập', items: incomeCategories },
      ] as const).map((group) => <section className={`category-column category-column--${group.type.toLowerCase()}`} key={group.type}>
        <header><div><span>{group.type === 'EXPENSE' ? 'CHI TIÊU' : 'THU NHẬP'}</span><h4>{group.title}</h4></div><b>{group.items.length}/30</b></header>
        <div>{group.items.length === 0 ? <div className="category-column__empty"><Tags size={25} /><span>Chưa có danh mục</span></div> : group.items.map((category) => {
          const CategoryIcon = CATEGORY_ICON_MAP.get(category.icon) ?? Tags
          const iconColor = getCategoryColor(category.icon, category.type, category.color)
          return <article className={`category-item category-item--${category.type.toLowerCase()}`} style={{ '--category-color': iconColor, '--category-soft': `${iconColor}18` } as CSSProperties} key={category.id}>
            <span className="category-item__icon"><CategoryIcon /></span>
            <div><strong>{category.name}</strong><small>{category.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}</small></div>
            <button
              className="danger category-delete-button"
              aria-label={`Xóa ${category.name}`}
              disabled={deleting}
              onClick={() => setDeleteTarget(category)}
            >
              <Trash2 size={16} /><span>Xóa</span>
            </button>
          </article>
        })}</div>
      </section>)}</div>}
    </div></section>
    <ConfirmModal open={Boolean(deleteTarget)} title="Xóa danh mục?" message={`Danh mục “${deleteTarget?.name || ''}” sẽ bị xóa và không thể khôi phục.`} confirmLabel="Xóa danh mục" danger busy={deleting} onClose={() => setDeleteTarget(null)} onConfirm={() => void remove()} />
  </>

  return <PortalShell portal="customer">{content}</PortalShell>
}
