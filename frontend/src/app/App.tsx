import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLoginPage } from '../features/admin/auth/AdminLoginPage'
import { AdminDashboard } from '../features/admin/dashboard/AdminDashboard'
import { CustomerLoginPage } from '../features/customer/auth/CustomerLoginPage'
import { ForgotPasswordPage } from '../features/customer/auth/ForgotPasswordPage'
import { RegisterPage } from '../features/customer/auth/RegisterPage'
import { CustomerDashboard } from '../features/customer/dashboard/CustomerDashboard'
import { SetupPinPage } from '../features/customer/account/SetupPinPage'
import { WalletPage } from '../features/customer/wallet/WalletPage'
import { CategoriesPage } from '../features/customer/category/CategoriesPage'
import { ProtectedRoute } from '../shared/components/ProtectedRoute'

export default function App() {
  return <Routes>
    <Route path="/" element={<Navigate to="/customer/login" replace />} />
    <Route path="/customer/login" element={<CustomerLoginPage />} />
    <Route path="/customer/register" element={<RegisterPage />} />
    <Route path="/customer/forgot-password" element={<ForgotPasswordPage />} />
    <Route element={<ProtectedRoute portal="customer" />}>
      <Route path="/customer/setup-pin" element={<SetupPinPage />} />
      <Route path="/customer" element={<CustomerDashboard />} />
      <Route path="/customer/wallet" element={<WalletPage />} />
      <Route path="/customer/categories" element={<CategoriesPage />} />
    </Route>
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route element={<ProtectedRoute portal="admin" />}><Route path="/admin" element={<AdminDashboard />} /></Route>
    <Route path="*" element={<Navigate to="/customer/login" replace />} />
  </Routes>
}
