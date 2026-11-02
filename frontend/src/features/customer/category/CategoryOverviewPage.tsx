import { useEffect, useState } from 'react'
import { PieChart, Tags } from 'lucide-react'
import { request } from '../../../shared/api/http'
import { PortalShell } from '../../../shared/components/PortalShell'
import { useNotification } from '../../../shared/components/NotificationProvider'
import type { Category } from '../../../shared/types/api'
import { CategoryDonut } from '../wallet/CategoryDonut'
import '../../../category.css'

export function CategoryOverviewPage() {
  const notify = useNotification()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    request<Category[]>('customer', '/api/v1/categories')
      .then((response) => setCategories(response.data))
      .catch((reason) => notify({ type: 'error', message: reason instanceof Error ? reason.message : 'Không thể tải tổng quan danh mục.' }))
      .finally(() => setLoading(false))
  }, [notify])

  const expenseCount = categories.filter((category) => category.type === 'EXPENSE').length
  const incomeCount = categories.filter((category) => category.type === 'INCOME').length

  return <PortalShell portal="customer"><div className="category-overview-page">
    <div className="category-overview-metrics">
      <article><span><Tags /></span><div><small>Tổng danh mục</small><strong>{categories.length}<i>/60</i></strong></div></article>
      <article><span><PieChart /></span><div><small>Danh mục chi tiêu</small><strong>{expenseCount}<i>/30</i></strong></div></article>
      <article><span><PieChart /></span><div><small>Danh mục thu nhập</small><strong>{incomeCount}<i>/30</i></strong></div></article>
    </div>
    <CategoryDonut categories={categories} loading={loading} />
  </div></PortalShell>
}
