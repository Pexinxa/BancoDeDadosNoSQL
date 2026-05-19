export default function Pagination({ pagina, totalPaginas, onChange }) {
  if (totalPaginas <= 1) return null

  const pages = Array.from({ length: totalPaginas }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1)

  const rendered = []
  let prev = 0
  for (const p of pages) {
    if (p - prev > 1) rendered.push('...')
    rendered.push(p)
    prev = p
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        disabled={pagina === 1}
        onClick={() => onChange(pagina - 1)}
        className="btn-secondary text-xs py-1 px-2 disabled:opacity-40"
      >← Ant.</button>

      {rendered.map((item, i) =>
        item === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-slate-400">…</span>
        ) : (
          <button
            key={item}
            onClick={() => onChange(item)}
            className={`text-xs py-1 px-3 rounded-lg font-medium transition ${
              item === pagina
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item}
          </button>
        )
      )}

      <button
        disabled={pagina === totalPaginas}
        onClick={() => onChange(pagina + 1)}
        className="btn-secondary text-xs py-1 px-2 disabled:opacity-40"
      >Próx. →</button>
    </div>
  )
}
