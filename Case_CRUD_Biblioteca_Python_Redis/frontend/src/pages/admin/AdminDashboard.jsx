import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLivros, excluirLivro, getEstatisticas } from '../../services/api'
import ConfirmModal from '../../components/ConfirmModal'
import Toast from '../../components/Toast'
import StatsCard from '../../components/StatsCard'
import Pagination from '../../components/Pagination'

const statusBadge = (s) => {
  const base = 'text-xs font-semibold px-2.5 py-0.5 rounded-full'
  return s === 'Disponível'
    ? <span className={`${base} bg-emerald-100 text-emerald-700`}>✓ Disponível</span>
    : <span className={`${base} bg-amber-100 text-amber-700`}>↗ Emprestado</span>
}

const POR_PAGINA = 10

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [livros, setLivros]     = useState([])
  const [total, setTotal]       = useState(0)
  const [stats, setStats]       = useState(null)
  const [pagina, setPagina]     = useState(1)

  const [busca, setBusca]               = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCat, setFilterCat]       = useState('')

  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast]     = useState(null)
  const timer = useRef(null)

  const showToast = (message, type = 'success') => setToast({ message, type })

  const fetchLivros = useCallback(async (pg = 1) => {
    setLoading(true)
    try {
      const params = { pagina: pg, por_pagina: POR_PAGINA }
      if (busca)       params.busca      = busca
      if (filterStatus) params.status    = filterStatus
      if (filterCat)   params.categoria  = filterCat
      const { data } = await getLivros(params)
      setLivros(data.livros)
      setTotal(data.total)
    } catch {
      showToast('Erro ao carregar livros.', 'error')
    } finally {
      setLoading(false)
    }
  }, [busca, filterStatus, filterCat])

  const fetchStats = useCallback(async () => {
    try { const { data } = await getEstatisticas(); setStats(data) }
    catch { /* silencioso */ }
  }, [])

  useEffect(() => { fetchStats() }, [])

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { fetchLivros(1); setPagina(1) }, 400)
    return () => clearTimeout(timer.current)
  }, [busca])

  useEffect(() => { fetchLivros(1); setPagina(1) }, [filterStatus, filterCat])
  useEffect(() => { fetchLivros(pagina) }, [pagina])

  const handleDelete = async () => {
    try {
      await excluirLivro(confirm.id)
      showToast(`"${confirm.titulo}" excluído.`)
      fetchLivros(pagina)
      fetchStats()
    } catch (err) {
      const msg = err.response?.status === 401 ? 'Sessão expirada. Faça login novamente.' : 'Erro ao excluir.'
      showToast(msg, 'error')
    } finally {
      setConfirm(null)
    }
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {toast   && <Toast {...toast} onClose={() => setToast(null)} />}
      {confirm && (
        <ConfirmModal
          title="Excluir livro"
          message={`Tem certeza que deseja excluir "${confirm.titulo}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatsCard label="Total de Livros"    value={stats.total_livros}     icon="📚" color="blue"   />
          <StatsCard label="Disponíveis"         value={stats.disponiveis}      icon="✅" color="green"  />
          <StatsCard label="Emprestados"         value={stats.emprestados}      icon="📤" color="amber"  />
          <StatsCard label="Total Exemplares"    value={stats.total_exemplares} icon="🔢" color="purple" />
        </div>
      )}

      {/* Categorias */}
      {stats && Object.keys(stats.categorias).length > 0 && (
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide">Livros por Categoria</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.categorias)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => (
                <span
                  key={cat}
                  onClick={() => { setFilterCat(c => c === cat ? '' : cat); setPagina(1) }}
                  className={`cursor-pointer text-xs px-3 py-1 rounded-full font-medium transition ${
                    filterCat === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  {cat} <span className="opacity-70">({count})</span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Header da tabela */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <p className="text-sm text-slate-500">
          {total} livro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => navigate('/cadastrar')}
          className="btn-primary shrink-0"
        >
          + Novo Livro
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <input
          className="input"
          placeholder="🔍 Buscar por título ou autor..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option>Disponível</option>
          <option>Emprestado</option>
        </select>
        <select className="input" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">Todas as categorias</option>
          {stats && Object.keys(stats.categorias).sort().map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : livros.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-2">📭</div>
          <p className="font-medium">Nenhum livro encontrado.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Título','Autor','Categoria','Ano','Qtd.','Status','Atualizado','Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {livros.map(livro => (
                  <tr key={livro.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[150px] truncate" title={livro.titulo}>{livro.titulo}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[120px] truncate" title={livro.autor}>{livro.autor}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{livro.categoria}</td>
                    <td className="px-4 py-3 text-slate-500">{livro.ano_publicacao}</td>
                    <td className="px-4 py-3 text-center font-semibold">{livro.quantidade_disponivel}</td>
                    <td className="px-4 py-3">{statusBadge(livro.status)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(livro.atualizado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => navigate(`/admin/editar/${livro.id}`)}
                          className="btn-secondary text-xs py-1 px-2"
                        >✏️</button>
                        <button
                          onClick={() => setConfirm({ id: livro.id, titulo: livro.titulo })}
                          className="btn-danger text-xs py-1 px-2"
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
        </>
      )}
    </div>
  )
}
