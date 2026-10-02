import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { sessionStore, type Portal } from '../auth/session'

export function ProtectedRoute({ portal }: { portal: Portal }) {
  const location = useLocation()
  if (!sessionStore.get(portal)) {
    return <Navigate to={`/${portal}/login`} replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
