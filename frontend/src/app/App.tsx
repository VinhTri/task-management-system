import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLoginPage } from '../features/admin/auth/AdminLoginPage'
import { AdminDashboard } from '../features/admin/dashboard/AdminDashboard'
import { CustomerLoginPage } from '../features/customer/auth/CustomerLoginPage'
import { ForgotPasswordPage } from '../features/customer/auth/ForgotPasswordPage'
import { RegisterPage } from '../features/customer/auth/RegisterPage'
import { SetupPinPage } from '../features/customer/account/SetupPinPage'
import { CustomerSettingsPage } from '../features/customer/account/CustomerSettingsPage'
import { WalletPage } from '../features/customer/wallet/WalletPage'
import { QuickTransactionPage } from '../features/customer/wallet/QuickTransactionPage'
import { TransactionHistoryPage } from '../features/customer/wallet/TransactionHistoryPage'
import { CategoriesPage } from '../features/customer/category/CategoriesPage'
import { CategoryOverviewPage } from '../features/customer/category/CategoryOverviewPage'
import { ProtectedRoute } from '../shared/components/ProtectedRoute'

export default function App() {
  return <Routes>
    <Route path="/" element={<Navigate to="/customer/login" replace />} />
    <Route path="/customer/login" element={<CustomerLoginPage />} />
    <Route path="/customer/register" element={<RegisterPage />} />
    <Route path="/customer/forgot-password" element={<ForgotPasswordPage />} />
    <Route element={<ProtectedRoute portal="customer" />}>
      <Route path="/customer/setup-pin" element={<SetupPinPage />} />
      <Route path="/customer" element={<Navigate to="/customer/wallet" replace />} />
      <Route path="/customer/wallet" element={<WalletPage />} />
      <Route path="/customer/operations" element={<QuickTransactionPage />} />
      <Route path="/customer/transactions" element={<TransactionHistoryPage />} />
      <Route path="/customer/categories" element={<CategoryOverviewPage />} />
      <Route path="/customer/categories/manage" element={<CategoriesPage />} />
      <Route path="/customer/settings" element={<CustomerSettingsPage />} />
    </Route>
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route element={<ProtectedRoute portal="admin" />}><Route path="/admin" element={<AdminDashboard />} /></Route>
    <Route path="*" element={<Navigate to="/customer/login" replace />} />
  </Routes>
}
