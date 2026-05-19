import { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ── Avatar com iniciais ──────────────────────────────────────────────────────
function Avatar({ name }) {
  const initials = name
    ?.split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') ?? '?'
  return (
    <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center select-none">
      {initials}
    </div>
  )
}

// ── Menu dropdown do usuário ─────────────────────────────────────────────────
function UserMenu({ user, isAdmin, logout }) {
  const [open, setOpen]  = useState(false)
  const ref              = useRef(null)
  const navigate         = useNavigate()

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    setOpen(false)
    navigate('/')
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 hover:opacity-80 transition"
      >
        <Avatar name={user.name} />
        {/* Nome visível em telas maiores */}
        <span className="hidden sm:block text-sm text-white font-medium max-w-[100px] truncate">
          {user.name.split(' ')[0]}
        </span>
        <svg className="w-3 h-3 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
          {/* Info do usuário */}
          <div className="px-4 py-2.5 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
            {isAdmin && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                Administrador
              </span>
            )}
          </div>

          {/* Ações */}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              🛡️ Painel Admin
            </Link>
          )}
          {!isAdmin && (
            <button
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 w-full text-left transition"
              onClick={() => setOpen(false)}
            >
              👤 Minha conta
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left transition"
          >
            🚪 Sair
          </button>
        </div>
      )}
    </div>
  )
}

// ── Layout Principal ─────────────────────────────────────────────────────────
export default function PublicLayout() {
  const { user, isAdmin, isAuth, logout } = useAuth()
  const { pathname, search } = useLocation()

  // Banner de acesso negado
  const acessoNegado = search.includes('acesso=negado')

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <nav className="bg-[#1a3a8f] shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Biblioteca<span className="text-blue-300">Digital</span></span>
          </Link>

          {/* Links centrais */}
          <div className="hidden sm:flex items-center gap-1">
            <Link to="/"
              className={`text-sm px-3 py-1.5 rounded-lg transition font-medium ${
                pathname === '/' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}>
              🏠 Início
            </Link>
            {/* Link "Painel Admin" só aparece para admin */}
            {isAdmin && (
              <Link to="/admin"
                className="text-sm px-3 py-1.5 rounded-lg transition font-medium text-blue-100 hover:bg-white/10 hover:text-white">
                🛡️ Painel Admin
              </Link>
            )}
          </div>

          {/* Lado direito: avatar ou botão Entrar */}
          <div className="flex items-center gap-3">
            {isAuth ? (
              // Logado: avatar + dropdown
              <UserMenu user={user} isAdmin={isAdmin} logout={logout} />
            ) : (
              // Não logado: botão Entrar
              <Link
                to="/auth"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Entrar
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Banner: acesso negado */}
      {acessoNegado && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-center text-sm text-red-600 font-medium">
          🚫 Acesso negado. Você não tem permissão para acessar essa área.
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-slate-400 py-4 border-t border-slate-100">
        Biblioteca Digital © {new Date().getFullYear()} — FastAPI · Redis · React
      </footer>
    </div>
  )
}
