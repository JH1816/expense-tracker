import { useState, useEffect, useCallback } from 'react'
import { format, subMonths, addMonths } from 'date-fns'
import {
  ChevronLeft, ChevronRight, DollarSign, ShoppingBag,
  BarChart2, Tag, RefreshCw,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts'
import { getDashboard } from '../api'
import StatCard from './StatCard'
import GmailSyncModal from './GmailSyncModal'

const CustomTooltipStyle = {
  contentStyle: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '12px',
  },
  itemStyle: { color: '#cbd5e1' },
  labelStyle: { color: '#64748b', marginBottom: 4 },
}

const RADIAN = Math.PI / 180
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSync, setShowSync] = useState(false)

  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDashboard(month, year)
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetchData() }, [fetchData])

  const pctChange =
    data?.prev_total > 0
      ? (((data.total - data.prev_total) / data.prev_total) * 100).toFixed(1)
      : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Your spending overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSync(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-sm hover:bg-blue-500/15 transition"
          >
            <RefreshCw size={15} />
            Sync Gmail
          </button>

          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setCurrentDate(d => subMonths(d, 1))}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-medium text-slate-200 min-w-[110px] text-center px-1">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentDate(d => addMonths(d, 1))}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Spent"
          value={`SGD ${data?.total?.toFixed(2) ?? '0.00'}`}
          icon={DollarSign}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-400/10"
          change={pctChange != null ? `${pctChange > 0 ? '+' : ''}${pctChange}%` : null}
          changePositive={Number(pctChange) < 0}
          subtitle="vs last month"
        />
        <StatCard
          title="Transactions"
          value={data?.count ?? 0}
          icon={ShoppingBag}
          iconColor="text-blue-400"
          iconBg="bg-blue-400/10"
          subtitle="this month"
        />
        <StatCard
          title="Avg Transaction"
          value={`SGD ${data?.average?.toFixed(2) ?? '0.00'}`}
          icon={BarChart2}
          iconColor="text-purple-400"
          iconBg="bg-purple-400/10"
        />
        <StatCard
          title="Categories"
          value={data?.by_category?.length ?? 0}
          icon={Tag}
          iconColor="text-orange-400"
          iconBg="bg-orange-400/10"
          subtitle="active"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category donut */}
        <div className="card">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
            By Category
          </h3>
          {data?.by_category?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data.by_category}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={2}
                    dataKey="amount"
                    labelLine={false}
                    label={PieLabel}
                  >
                    {data.by_category.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`SGD ${v.toFixed(2)}`, 'Amount']}
                    {...CustomTooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-3 space-y-2">
                {data.by_category.slice(0, 6).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs text-slate-400 truncate">
                        {cat.icon} {cat.name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-200 shrink-0 ml-2">
                      SGD {cat.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center text-slate-600 gap-2">
              <span className="text-3xl">📊</span>
              <p className="text-sm">No expenses this month</p>
            </div>
          )}
        </div>

        {/* Monthly trend bar chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Monthly Trend
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.monthly_trend} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              />
              <Tooltip
                formatter={(v) => [`SGD ${v.toFixed(2)}`, 'Total']}
                {...CustomTooltipStyle}
              />
              <Bar dataKey="amount" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily spending area chart */}
      <div className="card">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Daily Spending — {format(currentDate, 'MMMM yyyy')}
        </h3>
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={data?.daily} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              interval={3}
            />
            <YAxis hide />
            <Tooltip
              formatter={(v) => [`SGD ${v.toFixed(2)}`, 'Spent']}
              labelFormatter={(l) => `Day ${l}`}
              {...CustomTooltipStyle}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#10b981"
              fill="url(#dailyGrad)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Recent Transactions
          </h3>
          <a href="/expenses" className="text-xs text-emerald-400 hover:text-emerald-300 transition">
            View all →
          </a>
        </div>

        {data?.recent?.length > 0 ? (
          <div className="divide-y divide-slate-700/50">
            {data.recent.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{ backgroundColor: (exp.category?.color ?? '#6b7280') + '20' }}
                  >
                    {exp.category?.icon ?? '📦'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{exp.merchant}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {format(new Date(exp.date), 'MMM d, yyyy')}
                      {exp.category && ` · ${exp.category.name}`}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-slate-200">
                    {exp.currency} {exp.amount.toFixed(2)}
                  </p>
                  {exp.source === 'gmail' && (
                    <p className="text-[10px] text-blue-400">Gmail</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-slate-600 space-y-2">
            <p className="text-3xl">🧾</p>
            <p className="text-sm">No transactions yet — add one or sync Gmail!</p>
          </div>
        )}
      </div>

      {showSync && <GmailSyncModal onClose={() => setShowSync(false)} />}
    </div>
  )
}
