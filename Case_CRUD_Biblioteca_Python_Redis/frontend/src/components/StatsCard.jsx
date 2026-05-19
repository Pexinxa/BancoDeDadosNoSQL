export default function StatsCard({ label, value, icon, color = 'blue' }) {
  const colors = {
    blue:    'bg-blue-50 text-blue-600 border-blue-100',
    green:   'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber:   'bg-amber-50 text-amber-600 border-amber-100',
    purple:  'bg-purple-50 text-purple-600 border-purple-100',
  }
  return (
    <div className={`card flex items-center gap-4 border ${colors[color]}`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  )
}
