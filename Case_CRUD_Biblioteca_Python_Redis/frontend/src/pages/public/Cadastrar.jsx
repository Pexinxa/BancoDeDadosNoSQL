import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { criarLivro, uploadCover } from '../../services/api'
import BookForm from '../../components/BookForm'
import Toast from '../../components/Toast'

export default function Cadastrar() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [toast, setToast]     = useState(null)

  const handleSubmit = async ({ coverFile, ...data }) => {
    setLoading(true)
    try {
      // 1. Cria o livro
      const { data: livro } = await criarLivro(data)

      // 2. Se houver capa, faz upload separado
      if (coverFile) {
        try {
          await uploadCover(livro.id, coverFile)
        } catch {
          setToast({ message: 'Livro criado, mas falha ao enviar a capa.', type: 'error' })
          setTimeout(() => navigate('/'), 2000)
          return
        }
      }

      setToast({ message: 'Livro cadastrado com sucesso!', type: 'success' })
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail) ? detail.map(d => d.msg).join(' | ') : detail || 'Erro ao cadastrar.'
      setToast({ message: msg, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="btn-secondary text-sm py-1.5">← Voltar</button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cadastrar Livro</h1>
          <p className="text-sm text-slate-500">Contribua com o acervo da biblioteca.</p>
        </div>
      </div>
      <div className="card">
        <BookForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  )
}
