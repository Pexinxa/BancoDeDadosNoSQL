import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Iniciais do nome para avatar
  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') ?? 'A'

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Topbar Admin */}
      <nav className="bg-slate-800 shadow-lg sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <span className="text-white font-bold text-lg">Painel Admin</span>
              <span className="text-slate-400 text-sm hidden sm:inline">— Biblioteca Digital</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/" className="text-slate-400 hover:text-white text-sm transition hidden sm:block">
              ← Área Pública
            </Link>

            {/* Avatar + nome */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center">
                {initials}
              </div>
              <span className="text-emerald-400 text-sm font-medium hidden sm:block">
                {user?.name}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-slate-400 py-3 border-t border-slate-200">
        Painel Administrativo — Biblioteca Digital
      </footer>
    </div>
  )
}
