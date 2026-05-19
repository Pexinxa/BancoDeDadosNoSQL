import { useEffect } from 'react'

const icons = {
  success: (
    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
}

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const border = type === 'success' ? 'border-emerald-400' : 'border-red-400'

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 bg-white border-l-4 ${border} shadow-lg rounded-lg px-4 py-3 min-w-[260px] animate-fade-in`}
    >
      {icons[type]}
      <span className="text-sm font-medium text-slate-700">{message}</span>
      <button
        onClick={onClose}
        className="ml-auto text-slate-400 hover:text-slate-600"
      >
        ✕
      </button>
    </div>
  )
}
