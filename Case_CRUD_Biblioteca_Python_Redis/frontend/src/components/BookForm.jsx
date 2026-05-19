import { useState, useRef } from 'react'
import { coverUrl } from '../services/api'

const currentYear = new Date().getFullYear()

const defaultForm = {
  titulo: '',
  autor: '',
  categoria: '',
  ano_publicacao: currentYear,
  quantidade_disponivel: 1,
  status: 'Disponível',
}

const categorias = [
  'Ficção Científica', 'Romance', 'Terror', 'Fantasia', 'Biografia',
  'História', 'Autoajuda', 'Tecnologia', 'Filosofia', 'Psicologia', 'Outro',
]

export default function BookForm({ initialData = {}, onSubmit, loading }) {
  const [form, setForm]       = useState({ ...defaultForm, ...initialData })
  const [errors, setErrors]   = useState({})
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(
    initialData.capa_url ? coverUrl(initialData.capa_url) : null
  )
  const fileInputRef = useRef(null)

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Valida tipo
    if (!file.type.startsWith('image/')) {
      setErrors(er => ({ ...er, cover: 'Selecione uma imagem (JPEG, PNG ou WebP).' }))
      return
    }
    // Valida tamanho (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(er => ({ ...er, cover: 'Imagem muito grande. Limite: 5 MB.' }))
      return
    }
    setErrors(er => ({ ...er, cover: '' }))
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const removeCover = () => {
    setCoverFile(null)
    setCoverPreview(initialData.capa_url ? coverUrl(initialData.capa_url) : null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validate = () => {
    const e = {}
    if (!form.titulo.trim())    e.titulo    = 'Título é obrigatório.'
    if (!form.autor.trim())     e.autor     = 'Autor é obrigatório.'
    if (!form.categoria.trim()) e.categoria = 'Categoria é obrigatória.'
    const ano = Number(form.ano_publicacao)
    if (!ano || ano < 1000 || ano > 2100) e.ano_publicacao = 'Ano inválido (1000–2100).'
    const qtd = Number(form.quantidade_disponivel)
    if (qtd < 0 || isNaN(qtd)) e.quantidade_disponivel = 'Quantidade deve ser ≥ 0.'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      ...form,
      ano_publicacao: Number(form.ano_publicacao),
      quantidade_disponivel: Number(form.quantidade_disponivel),
      coverFile,   // arquivo de imagem (File | null) — parent faz o upload
    })
  }

  const field = (label, key, el) => (
    <div>
      <label className="label">{label}</label>
      {el}
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── Upload de Capa ──────────────────────────────────────────────── */}
      <div>
        <label className="label">Capa do Livro</label>
        <div className="flex items-start gap-4">
          {/* Preview */}
          <div
            className="w-24 h-32 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 cursor-pointer hover:border-blue-400 transition shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            {coverPreview ? (
              <img src={coverPreview} alt="Capa" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-2">
                <div className="text-2xl mb-1">📷</div>
                <p className="text-xs text-slate-400 leading-tight">Clique para adicionar</p>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCoverChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary text-xs py-1.5 w-full justify-center"
            >
              {coverPreview ? '🔄 Trocar imagem' : '📷 Selecionar imagem'}
            </button>
            {coverPreview && coverFile && (
              <button
                type="button"
                onClick={removeCover}
                className="btn-danger text-xs py-1.5 w-full justify-center"
              >
                🗑️ Remover
              </button>
            )}
            <p className="text-xs text-slate-400">JPEG, PNG ou WebP · máx. 5 MB</p>
          </div>
        </div>
        {errors.cover && <p className="text-red-500 text-xs mt-1">{errors.cover}</p>}
      </div>

      {/* ── Campos do livro ──────────────────────────────────────────────── */}
      {field('Título *', 'titulo',
        <input className="input" value={form.titulo}
          onChange={e => set('titulo', e.target.value)} placeholder="Ex: Dom Quixote" />
      )}
      {field('Autor *', 'autor',
        <input className="input" value={form.autor}
          onChange={e => set('autor', e.target.value)} placeholder="Ex: Miguel de Cervantes" />
      )}
      {field('Categoria *', 'categoria',
        <select className="input" value={form.categoria}
          onChange={e => set('categoria', e.target.value)}>
          <option value="">Selecione...</option>
          {categorias.map(c => <option key={c}>{c}</option>)}
        </select>
      )}
      <div className="grid grid-cols-2 gap-4">
        {field('Ano de Publicação *', 'ano_publicacao',
          <input className="input" type="number" min="1000" max="2100"
            value={form.ano_publicacao}
            onChange={e => set('ano_publicacao', e.target.value)} />
        )}
        {field('Quantidade Disponível *', 'quantidade_disponivel',
          <input className="input" type="number" min="0"
            value={form.quantidade_disponivel}
            onChange={e => set('quantidade_disponivel', e.target.value)} />
        )}
      </div>
      {field('Status *', 'status',
        <select className="input" value={form.status}
          onChange={e => set('status', e.target.value)}>
          <option>Disponível</option>
          <option>Emprestado</option>
        </select>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
        {loading ? 'Salvando...' : 'Salvar Livro'}
      </button>
    </form>
  )
}
