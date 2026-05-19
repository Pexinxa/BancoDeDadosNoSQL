import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getLivros, excluirLivro, emprestar, devolver, getMeusEmprestimos, coverUrl } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import ConfirmModal from '../../components/ConfirmModal'
import Toast from '../../components/Toast'

// ── Cores por categoria (usada quando não há capa) ───────────────────────────
const CAT_COLORS = {
  'Ficção Científica': 'from-blue-600 to-cyan-700',
  'Romance':           'from-pink-500 to-rose-600',
  'Terror':            'from-gray-700 to-slate-900',
  'Fantasia':          'from-purple-600 to-indigo-700',
  'Biografia':         'from-amber-500 to-orange-600',
  'História':          'from-green-600 to-emerald-700',
  'Autoajuda':         'from-yellow-500 to-amber-600',
  'Tecnologia':        'from-cyan-600 to-blue-700',
  'Filosofia':         'from-indigo-600 to-purple-700',
  'Psicologia':        'from-teal-500 to-green-700',
  'Outro':             'from-slate-500 to-gray-700',
}
const catColor = (cat) => CAT_COLORS[cat] ?? 'from-slate-600 to-gray-700'

const StatusBadge = ({ status }) => (
  status === 'Disponível'
    ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">Disponível</span>
    : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400 text-white">Emprestado</span>
)

const POR_PAGINA = 12

export default function Catalogo() {
  const navigate  = useNavigate()
  const { isAdmin, isUser, isAuth, user } = useAuth()

  const [livros,    setLivros]    = useState([])
  const [total,     setTotal]     = useState(0)
  const [pagina,    setPagina]    = useState(1)
  const [busca,     setBusca]     = useState('')
  const [catAtiva,  setCatAtiva]  = useState('Todos')
  const [categorias, setCategorias] = useState(['Todos'])
  const [loading,   setLoading]   = useState(true)
  const [confirm,   setConfirm]   = useState(null)
  const [toast,     setToast]     = useState(null)

  // IDs dos livros que o usuário já pegou emprestado
  const [meusEmprestimos, setMeusEmprestimos] = useState(new Set())
  const [loanCount,       setLoanCount]       = useState(0)
  const LOAN_LIMIT = 3

  const timer = useRef(null)

  const showToast = (msg, type = 'success') => setToast({ message: msg, type })

  // ── Carrega empréstimos do usuário logado ────────────────────────────────
  const fetchMeusEmprestimos = async () => {
    if (!isUser && !isAdmin) return
    try {
      const { data } = await getMeusEmprestimos()
      setMeusEmprestimos(new Set(data.emprestimos.map(l => l.id)))
      setLoanCount(data.total)
    } catch { /* silencioso */ }
  }

  // ── Carrega livros ───────────────────────────────────────────────────────
  const fetchLivros = async (pg = 1, q = busca, cat = catAtiva) => {
    setLoading(true)
    try {
      const params = { pagina: pg, por_pagina: POR_PAGINA }
      if (q)               params.busca     = q
      if (cat !== 'Todos') params.categoria = cat
      const { data } = await getLivros(params)
      setLivros(data.livros)
      setTotal(data.total)
      setPagina(pg)

      if (pg === 1 && !q && cat === 'Todos') {
        const cats = [...new Set(data.livros.map(l => l.categoria))].sort()
        setCategorias(['Todos', ...cats])
      }
    } catch { setLivros([]) }
    finally  { setLoading(false) }
  }

  useEffect(() => { fetchLivros(1); fetchMeusEmprestimos() }, [])

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fetchLivros(1, busca, catAtiva), 400)
    return () => clearTimeout(timer.current)
  }, [busca])

  useEffect(() => { fetchLivros(1, busca, catAtiva) }, [catAtiva])
  useEffect(() => { fetchMeusEmprestimos() }, [isAuth])

  // ── Excluir (admin) ──────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await excluirLivro(confirm.id)
      showToast(`"${confirm.titulo}" excluído com sucesso.`)
      fetchLivros(pagina)
    } catch (err) {
      showToast(err.response?.status === 401 ? 'Sessão expirada.' : 'Erro ao excluir.', 'error')
    } finally { setConfirm(null) }
  }

  // ── Emprestar (user) ─────────────────────────────────────────────────────
  const handleEmprestar = async (livro) => {
    if (loanCount >= LOAN_LIMIT) {
      showToast(`Limite de ${LOAN_LIMIT} empréstimos atingido. Devolva um livro antes.`, 'error')
      return
    }
    try {
      await emprestar(livro.id)
      showToast(`"${livro.titulo}" emprestado com sucesso!`)
      fetchLivros(pagina)
      fetchMeusEmprestimos()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Erro ao emprestar.', 'error')
    }
  }

  // ── Devolver (user) ──────────────────────────────────────────────────────
  const handleDevolver = async (livro) => {
    try {
      await devolver(livro.id)
      showToast(`"${livro.titulo}" devolvido com sucesso!`)
      fetchLivros(pagina)
      fetchMeusEmprestimos()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Erro ao devolver.', 'error')
    }
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <>
      {toast   && <Toast {...toast} onClose={() => setToast(null)} />}
      {confirm && (
        <ConfirmModal
          title="Excluir livro"
          message={`Excluir "${confirm.titulo}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#0f1f4b] via-[#1a3a8f] to-[#1e40af] py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block bg-white/10 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full mb-5 tracking-wide">
            Bem-vindo à Biblioteca Digital
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-3">
            O mundo da leitura,{' '}
            <span className="text-blue-300">simples e ao seu alcance</span>
          </h1>
          <p className="text-blue-200 text-base mb-8">
            Transforme a maneira como você descobre, lê e organiza suas obras favoritas.
          </p>
          <div className="relative max-w-lg mx-auto">
            <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Buscar por título ou autor..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>

          {/* Contador de empréstimos do usuário */}
          {isUser && (
            <div className="mt-5 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-blue-100 text-sm">
              📚 Seus empréstimos:
              <span className={`font-bold ${loanCount >= LOAN_LIMIT ? 'text-red-300' : 'text-emerald-300'}`}>
                {loanCount}/{LOAN_LIMIT}
              </span>
              {loanCount >= LOAN_LIMIT && (
                <span className="text-red-300 text-xs">(limite atingido)</span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── CATÁLOGO ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Catálogo de Livros</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {total} livro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
            </p>
          </div>
          {isAdmin && (
            <Link to="/cadastrar" className="btn-primary shrink-0">+ Adicionar Livro</Link>
          )}
        </div>

        {/* Filtro por categoria */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categorias.map(cat => (
            <button key={cat} onClick={() => setCatAtiva(cat)}
              className={`text-sm px-4 py-1.5 rounded-full font-medium transition ${
                catAtiva === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grade */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : livros.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-medium text-slate-500">Nenhum livro encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {livros.map(livro => {
              const jaEmprestadoPorMim = meusEmprestimos.has(livro.id)
              const imgSrc = coverUrl(livro.capa_url)

              return (
                <div key={livro.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow overflow-hidden flex flex-col">

                  {/* Capa — foto real ou gradiente */}
                  <div className={`h-40 relative overflow-hidden ${!imgSrc ? `bg-gradient-to-br ${catColor(livro.categoria)}` : ''}`}>
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={`Capa de ${livro.titulo}`}
                        className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      /* Gradiente com título do livro quando não tem capa */
                      <div className="absolute inset-0 flex flex-col justify-end p-3">
                        <p className="text-white font-bold text-sm line-clamp-2 drop-shadow">{livro.titulo}</p>
                      </div>
                    )}

                    {/* Badge de status */}
                    <div className="absolute top-2 left-2">
                      <StatusBadge status={livro.status} />
                    </div>

                    {/* Botões admin */}
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        <button onClick={() => navigate(`/admin/editar/${livro.id}`)}
                          className="w-7 h-7 bg-black/30 hover:bg-black/50 text-white rounded-lg flex items-center justify-center text-xs transition"
                          title="Editar">✏️</button>
                        <button onClick={() => setConfirm({ id: livro.id, titulo: livro.titulo })}
                          className="w-7 h-7 bg-black/30 hover:bg-red-600/80 text-white rounded-lg flex items-center justify-center text-xs transition"
                          title="Excluir">🗑️</button>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full self-start mb-2">
                      {livro.categoria}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm leading-snug mb-1 line-clamp-2">
                      {livro.titulo}
                    </h3>
                    <p className="text-xs text-slate-500 mb-0.5">✍️ {livro.autor}</p>
                    <p className="text-xs text-slate-400 mb-3">📅 {livro.ano_publicacao}</p>
                    <p className="text-xs text-slate-400 mb-3">
                      {livro.quantidade_disponivel} exemplar{livro.quantidade_disponivel !== 1 ? 'es' : ''}
                    </p>

                    {/* Botão Emprestar/Devolver — apenas usuários logados (não admin) */}
                    {isUser && (
                      <div className="mt-auto">
                        {jaEmprestadoPorMim ? (
                          <button
                            onClick={() => handleDevolver(livro)}
                            className="w-full text-xs py-1.5 rounded-lg font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition"
                          >
                            ↩ Devolver
                          </button>
                        ) : livro.status === 'Disponível' ? (
                          <button
                            onClick={() => handleEmprestar(livro)}
                            disabled={loanCount >= LOAN_LIMIT}
                            className="w-full text-xs py-1.5 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            title={loanCount >= LOAN_LIMIT ? `Limite de ${LOAN_LIMIT} empréstimos atingido` : ''}
                          >
                            📖 Emprestar
                          </button>
                        ) : (
                          <div className="text-xs text-center text-slate-400 py-1.5">
                            Indisponível
                          </div>
                        )}
                      </div>
                    )}

                    {/* Guest: convite para login */}
                    {!isAuth && (
                      <div className="mt-auto">
                        <Link to="/auth"
                          className="block w-full text-xs py-1.5 rounded-lg text-center font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition">
                          Entrar para emprestar
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button disabled={pagina === 1} onClick={() => fetchLivros(pagina - 1)}
              className="btn-secondary text-xs py-1.5 px-4 disabled:opacity-40">← Anterior</button>
            <span className="text-sm text-slate-500 self-center px-2">{pagina} / {totalPaginas}</span>
            <button disabled={pagina === totalPaginas} onClick={() => fetchLivros(pagina + 1)}
              className="btn-secondary text-xs py-1.5 px-4 disabled:opacity-40">Próximo →</button>
          </div>
        )}
      </section>
    </>
  )
}
