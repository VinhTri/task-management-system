import { Activity, CircleCheck, Server, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { PortalShell } from '../../../shared/components/PortalShell'

export function AdminDashboard() {
  return <PortalShell portal="admin">
    <div className="welcome-row"><div><span className="eyebrow">SMARTSPEND CONTROL</span><h1>Hệ thống đang ổn định</h1><p>Theo dõi vận hành và truy cập người dùng tại một nơi.</p></div><span className="system-live"><i /> Tất cả dịch vụ hoạt động</span></div>
    <div className="metric-grid admin-metrics">
      <article className="metric-card"><span className="green"><Users /></span><p>Tổng người dùng</p><strong>1.284</strong><small>+42 trong tháng này</small></article>
      <article className="metric-card"><span className="purple"><Activity /></span><p>Đang hoạt động</p><strong>876</strong><small>68,2% tổng người dùng</small></article>
      <article className="metric-card"><span className="orange"><UserPlus /></span><p>Đăng ký mới</p><strong>18</strong><small>Trong 7 ngày qua</small></article>
      <article className="metric-card dark"><span><ShieldCheck /></span><p>Cảnh báo bảo mật</p><strong>0</strong><small><CircleCheck size={15} /> Không có rủi ro</small></article>
    </div>
    <div className="dashboard-grid admin-grid"><section className="content-card"><div className="card-heading"><div><h3>Hoạt động người dùng</h3><p>Lượt đăng nhập trong tuần</p></div></div><div className="line-visual"><svg viewBox="0 0 600 190" preserveAspectRatio="none"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#77bfa3" stopOpacity=".35"/><stop offset="100%" stopColor="#77bfa3" stopOpacity="0"/></linearGradient></defs><path d="M0,150 C70,130 85,145 145,95 S230,125 290,80 S380,100 430,48 S520,72 600,25 L600,190 L0,190 Z" fill="url(#fill)"/><path d="M0,150 C70,130 85,145 145,95 S230,125 290,80 S380,100 430,48 S520,72 600,25" fill="none" stroke="#2e8665" strokeWidth="4"/></svg></div><div className="chart-labels"><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span></div></section><section className="content-card service-card"><div className="card-heading"><div><h3>Trạng thái dịch vụ</h3><p>Hạ tầng thời gian thực</p></div></div>{['Customer API','Admin API','PostgreSQL','Redis'].map((service) => <div className="service" key={service}><span><Server size={17} />{service}</span><b><i /> Hoạt động</b></div>)}</section></div>
  </PortalShell>
}
