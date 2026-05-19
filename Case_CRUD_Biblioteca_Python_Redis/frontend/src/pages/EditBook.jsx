import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getLivro, atualizarLivro } from '../services/api'
import BookForm from '../components/BookForm'
import Toast from '../components/Toast'

export default function EditBook() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [livro, setLivro] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    getLivro(id)
      .then(({ data }) => setLivro(data))
      .catch(() => {
        setToast({ message: 'Livro não encontrado.', type: 'error' })
        setTimeout(() => navigate('/'), 2000)
      })
      .finally(() => setFetching(false))
  }, [id, navigate])

  const handleSubmit = async (data) => {
    setLoading(true)
    try {
      await atualizarLivro(id, data)
      setToast({ message: 'Livro atualizado com sucesso!', type: 'success' })
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map(d => d.msg).join(' | ')
        : detail || 'Erro ao atualizar livro.'
      setToast({ message: msg, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="btn-secondary text-sm py-1.5">
          ← Voltar
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Editar Livro</h1>
          <p className="text-sm text-slate-500 truncate max-w-xs">
            {livro ? livro.titulo : 'Carregando...'}
          </p>
        </div>
      </div>

      <div className="card">
        {fetching ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : livro ? (
          <BookForm initialData={livro} onSubmit={handleSubmit} loading={loading} />
        ) : null}
      </div>
    </div>
  )
}
