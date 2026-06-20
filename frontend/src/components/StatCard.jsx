import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ title, value, icon: Icon, iconColor, iconBg, change, changePositive, subtitle }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest truncate">{title}</p>
          <p className="text-2xl font-bold text-slate-100 mt-2 tabular-nums">{value}</p>
          {(change != null || subtitle) && (
            <div className="flex items-center gap-1.5 mt-2">
              {change != null && (
                <>
                  {changePositive ? (
                    <TrendingDown size={13} className="text-emerald-400 shrink-0" />
                  ) : (
                    <TrendingUp size={13} className="text-rose-400 shrink-0" />
                  )}
                  <span className={`text-xs font-semibold ${changePositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {change}
                  </span>
                </>
              )}
              {subtitle && (
                <span className="text-xs text-slate-500">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
          <Icon size={19} className={iconColor} />
        </div>
      </div>
    </div>
  )
}
