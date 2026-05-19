// Esta página foi substituída pela página unificada /auth
// O App.jsx redireciona /admin/login → /auth automaticamente
import { Navigate } from 'react-router-dom'
export default function AdminLogin() {
  return <Navigate to="/auth" replace />
}
