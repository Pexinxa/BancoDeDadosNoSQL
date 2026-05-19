import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// ── Ícones inline SVG ────────────────────────────────────────────────────────
const IconBook = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)
const IconMail = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)
const IconLock = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)
const IconUser = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const IconEye = ({ open }) => open ? (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
) : (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)

// ── Campo com ícone ─────────────────────────────────────────────────────────
function InputField({ label, icon, error, right, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative flex items-center">
        <span className="absolute left-3 pointer-events-none">{icon}</span>
        <input
          {...props}
          className={`w-full pl-9 ${right ? 'pr-10' : 'pr-3'} py-2.5 border rounded-xl text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
            ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
        />
        {right && <span className="absolute right-3">{right}</span>}
      </div>
      {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1">⚠ {error}</p>}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function AuthPage() {
  const navigate     = useNavigate()
  const location     = useLocation()
  const { login, register, isAuth } = useAuth()

  // Redireciona se já autenticado
  const from = location.state?.from?.pathname || '/'
  useEffect(() => { if (isAuth) navigate(from, { replace: true }) }, [isAuth])

  const [tab, setTab]         = useState('login')   // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [globalErr, setGlobalErr] = useState('')

  // ── Campos de Login ──────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail]   = useState('')
  const [loginPass,  setLoginPass]    = useState('')
  const [loginErrs,  setLoginErrs]    = useState({})
  const [showLoginPass, setShowLoginPass] = useState(false)

  // ── Campos de Cadastro ───────────────────────────────────────────────────
  const [regName,    setRegName]    = useState('')
  const [regEmail,   setRegEmail]   = useState('')
  const [regPass,    setRegPass]    = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regErrs,    setRegErrs]    = useState({})
  const [showRegPass, setShowRegPass]     = useState(false)
  const [showRegConfirm, setShowRegConfirm] = useState(false)

  // ── Troca de aba ────────────────────────────────────────────────────────
  const switchTab = (t) => {
    setTab(t)
    setGlobalErr('')
    setLoginErrs({})
    setRegErrs({})
  }

  // ── Validação de Login ───────────────────────────────────────────────────
  const validateLogin = () => {
    const e = {}
    if (!loginEmail.trim()) e.email = 'E-mail é obrigatório.'
    else if (!/\S+@\S+\.\S+/.test(loginEmail)) e.email = 'E-mail inválido.'
    if (!loginPass) e.password = 'Senha é obrigatória.'
    return e
  }

  // ── Validação de Cadastro ────────────────────────────────────────────────
  const validateRegister = () => {
    const e = {}
    if (!regName.trim()) e.name = 'Nome é obrigatório.'
    if (!regEmail.trim()) e.email = 'E-mail é obrigatório.'
    else if (!/\S+@\S+\.\S+/.test(regEmail)) e.email = 'E-mail inválido.'
    if (!regPass) e.password = 'Senha é obrigatória.'
    else if (regPass.length < 6) e.password = 'Mínimo de 6 caracteres.'
    if (regPass !== regConfirm) e.confirm = 'As senhas não coincidem.'
    return e
  }

  // ── Submit Login ─────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    const errs = validateLogin()
    if (Object.keys(errs).length) { setLoginErrs(errs); return }
    setLoading(true); setGlobalErr('')
    try {
      await login(loginEmail, loginPass)
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Credenciais inválidas.'
      setGlobalErr(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Submit Cadastro ──────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault()
    const errs = validateRegister()
    if (Object.keys(errs).length) { setRegErrs(errs); return }
    setLoading(true); setGlobalErr('')
    try {
      await register(regName, regEmail, regPass)   // agora chama o backend
      navigate('/', { replace: true })
    } catch (err) {
      const detail = err.response?.data?.detail
      setGlobalErr(detail || err.message || 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1f4b] via-[#1a3a8f] to-[#1e40af] flex flex-col items-center justify-center p-4">

      {/* Voltar ao site */}
      <a href="/" className="absolute top-5 left-5 text-blue-200 hover:text-white text-sm flex items-center gap-1 transition">
        ← Início
      </a>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-white">
            <div className="bg-white/20 p-2 rounded-xl"><IconBook /></div>
            <span className="text-2xl font-bold tracking-tight">
              Biblioteca<span className="text-blue-300">Digital</span>
            </span>
          </div>
          <p className="text-blue-200 text-sm mt-2">Seu universo de livros, na palma da mão.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Abas */}
          <div className="flex border-b border-slate-100">
            {[['login', 'Entrar'], ['register', 'Criar conta']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className={`flex-1 py-4 text-sm font-semibold transition-all ${
                  tab === key
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Erro global */}
          {globalErr && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5 flex items-center gap-2">
              <span>⚠</span> {globalErr}
            </div>
          )}

          {/* ── FORMULÁRIO DE LOGIN ──────────────────────────────────────── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="p-6 space-y-4" noValidate>
              <InputField
                label="E-mail"
                icon={<IconMail />}
                type="email"
                placeholder="seu@email.com"
                value={loginEmail}
                onChange={e => { setLoginEmail(e.target.value); setLoginErrs(v => ({...v, email:''})) }}
                error={loginErrs.email}
                autoFocus
              />
              <InputField
                label="Senha"
                icon={<IconLock />}
                type={showLoginPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={loginPass}
                onChange={e => { setLoginPass(e.target.value); setLoginErrs(v => ({...v, password:''})) }}
                error={loginErrs.password}
                right={
                  <button type="button" onClick={() => setShowLoginPass(v => !v)}
                    className="text-slate-400 hover:text-slate-600 transition">
                    <IconEye open={showLoginPass} />
                  </button>
                }
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[.98] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 mt-2"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>

              <p className="text-center text-sm text-slate-500">
                Não tem conta?{' '}
                <button type="button" onClick={() => switchTab('register')}
                  className="text-blue-600 hover:underline font-medium">
                  Criar conta
                </button>
              </p>
            </form>
          )}

          {/* ── FORMULÁRIO DE CADASTRO ───────────────────────────────────── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="p-6 space-y-4" noValidate>
              <InputField
                label="Nome completo"
                icon={<IconUser />}
                type="text"
                placeholder="Seu nome"
                value={regName}
                onChange={e => { setRegName(e.target.value); setRegErrs(v => ({...v, name:''})) }}
                error={regErrs.name}
                autoFocus
              />
              <InputField
                label="E-mail"
                icon={<IconMail />}
                type="email"
                placeholder="seu@email.com"
                value={regEmail}
                onChange={e => { setRegEmail(e.target.value); setRegErrs(v => ({...v, email:''})) }}
                error={regErrs.email}
              />
              <InputField
                label="Senha"
                icon={<IconLock />}
                type={showRegPass ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={regPass}
                onChange={e => { setRegPass(e.target.value); setRegErrs(v => ({...v, password:''})) }}
                error={regErrs.password}
                right={
                  <button type="button" onClick={() => setShowRegPass(v => !v)}
                    className="text-slate-400 hover:text-slate-600 transition">
                    <IconEye open={showRegPass} />
                  </button>
                }
              />
              <InputField
                label="Confirmar senha"
                icon={<IconLock />}
                type={showRegConfirm ? 'text' : 'password'}
                placeholder="Repita a senha"
                value={regConfirm}
                onChange={e => { setRegConfirm(e.target.value); setRegErrs(v => ({...v, confirm:''})) }}
                error={regErrs.confirm}
                right={
                  <button type="button" onClick={() => setShowRegConfirm(v => !v)}
                    className="text-slate-400 hover:text-slate-600 transition">
                    <IconEye open={showRegConfirm} />
                  </button>
                }
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[.98] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 mt-2"
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>

              <p className="text-center text-sm text-slate-500">
                Já tem conta?{' '}
                <button type="button" onClick={() => switchTab('login')}
                  className="text-blue-600 hover:underline font-medium">
                  Entrar
                </button>
              </p>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
