import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getHealth } from '../services/api'

export default function Navbar() {
  const { pathname } = useLocation()
  const [redisOk, setRedisOk] = useState(null)

  useEffect(() => {
    getHealth()
      .then(({ data }) => setRedisOk(data.status === 'ok'))
      .catch(() => setRedisOk(false))
  }, [])

  const link = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${
        pathname === to
          ? 'bg-blue-800 text-white'
          : 'text-blue-100 hover:bg-blue-700 hover:text-white'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="bg-blue-700 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          Biblioteca Digital
        </Link>

        <div className="flex items-center gap-3">
          {/* indicador Redis */}
          {redisOk !== null && (
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
              redisOk ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${redisOk ? 'bg-emerald-400' : 'bg-red-400'}`} />
              Redis {redisOk ? 'OK' : 'OFF'}
            </span>
          )}
          {link('/', 'Acervo')}
          {link('/cadastrar', '+ Novo Livro')}
        </div>
      </div>
    </nav>
  )
}
