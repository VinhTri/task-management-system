import { FormEvent, useCallback, useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Edit3, Plus, Search, Tags, Trash2, X } from 'lucide-react'
import { request } from '../../../shared/api/http'
import { PortalShell } from '../../../shared/components/PortalShell'
import type { Category, CategoryPayload, CategoryType } from '../../../shared/types/api'

const emptyForm: CategoryPayload = { name: '', type: 'EXPENSE', icon: 'tag', color: '#2F8967' }
const icons = ['tag', 'food', 'shopping', 'home', 'transport', 'salary', 'gift', 'health']

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<CategoryPayload>(emptyForm)
  const [editing, setEditing] = useState<Category | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async (keyword = '') => {
    setLoading(true)
    setError('')
    try {
      const result = await request<Category[]>('customer', `/api/v1/categories?query=${encodeURIComponent(keyword)}`)
      setCategories(result.data)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải danh mục.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(query), 300)
    return () => window.clearTimeout(timer)
  }, [load, query])

  const openCreate = () => {
    setEditing(null); setForm(emptyForm); setError(''); setMessage(''); setFormOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setForm({ name: category.name, type: category.type, icon: category.icon, color: category.color })
    setError(''); setMessage(''); setFormOpen(true)
  }

  const closeForm = () => { setFormOpen(false); setEditing(null); setForm(emptyForm) }

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('')
    try {
      const path = editing ? `/api/v1/categories/${editing.id}` : '/api/v1/categories'
      const result = await request<Category>('customer', path, {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify(form),
      })
      setMessage(result.message); closeForm(); await load(query)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể lưu danh mục.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (category: Category) => {
    if (!window.confirm(`Xóa danh mục “${category.name}”?`)) return
    setError(''); setMessage('')
    try {
      const result = await request<void>('customer', `/api/v1/categories/${category.id}`, { method: 'DELETE' })
      setMessage(result.message); await load(query)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể xóa danh mục.')
    }
  }

  return <PortalShell portal="customer">
    <div className="welcome-row category-heading"><div><span className="eyebrow">QUẢN LÝ DÒNG TIỀN</span><h1>Danh mục giao dịch</h1><p>Tự tạo nhóm thu nhập và chi tiêu phù hợp với bạn.</p></div><button className="primary-button compact" onClick={openCreate}><Plus size={18} /> Thêm danh mục</button></div>
    <section className="content-card category-panel">
      <div className="category-toolbar"><label className="category-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên danh mục..." /></label><span>{categories.length} danh mục</span></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success">{message}</p>}
      {loading ? <div className="category-empty">Đang tải danh mục...</div> : categories.length === 0 ? <div className="category-empty"><Tags size={34} /><strong>Chưa có danh mục</strong><p>Hãy tạo danh mục đầu tiên để phân loại giao dịch.</p></div> : <div className="category-grid">{categories.map((category) => <article className="category-item" key={category.id}>
        <span className="category-item__icon" style={{ backgroundColor: `${category.color}18`, color: category.color }}>{category.type === 'INCOME' ? <ArrowDownLeft /> : <ArrowUpRight />}</span>
        <div><strong>{category.name}</strong><small>{category.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'} · {category.icon}</small></div>
        <button aria-label={`Sửa ${category.name}`} onClick={() => openEdit(category)}><Edit3 size={16} /></button><button className="danger" aria-label={`Xóa ${category.name}`} onClick={() => void remove(category)}><Trash2 size={16} /></button>
      </article>)}</div>}
    </section>
    {formOpen && <div className="category-modal" role="dialog" aria-modal="true"><form className="category-form" onSubmit={submit}><div className="category-form__head"><div><h2>{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h2><p>Thông tin dùng để phân loại giao dịch.</p></div><button type="button" onClick={closeForm}><X /></button></div>
      <label><span>Tên danh mục</span><input required maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ví dụ: Ăn uống" /></label>
      <label><span>Loại danh mục</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as CategoryType })}><option value="EXPENSE">Chi tiêu</option><option value="INCOME">Thu nhập</option></select></label>
      <label><span>Biểu tượng</span><select value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })}>{icons.map((icon) => <option key={icon} value={icon}>{icon}</option>)}</select></label>
      <label><span>Màu sắc</span><div className="color-field"><input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value.toUpperCase() })} /><code>{form.color}</code></div></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={saving}>{saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo danh mục'}</button>
    </form></div>}
  </PortalShell>
}
