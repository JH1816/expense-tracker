import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Plus, Search, Trash2, Edit2, RefreshCw } from 'lucide-react'
import { getExpenses, getCategories, deleteExpense } from '../api'
import ExpenseModal from './ExpenseModal'
import GmailSyncModal from './GmailSyncModal'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const YEARS = [2024, 2025, 2026]

export default function ExpenseList() {
  const now = new Date()
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1)
  const [filterYear, setFilterYear] = useState(now.getFullYear())
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showSync, setShowSync] = useState(false)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filterCat) params.category_id = filterCat
      if (filterMonth) params.month = filterMonth
      if (filterYear) params.year = filterYear
      const res = await getExpenses(params)
      setExpenses(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, filterCat, filterMonth, filterYear])

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data))
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  async function handleDelete(id) {
    if (!window.confirm('Delete this expense?')) return
    await deleteExpense(id)
    fetchExpenses()
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Expenses</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {expenses.length} transaction{expenses.length !== 1 ? 's' : ''} ·{' '}
            <span className="text-slate-400 font-medium">SGD {total.toFixed(2)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSync(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-sm hover:bg-blue-500/15 transition"
          >
            <RefreshCw size={15} />
            Sync Gmail
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 btn-primary rounded-xl"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search merchant or note…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="input w-auto">
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>

        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="input w-auto">
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>

        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="input w-auto">
          {YEARS.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              {['Merchant', 'Category', 'Date', 'Source', 'Amount', ''].map((h) => (
                <th
                  key={h}
                  className={`px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest ${h === 'Amount' || h === '' ? 'text-right' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center">
                  <div className="w-7 h-7 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin mx-auto" />
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center text-slate-600">
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="text-sm">No expenses found. Try changing the filters.</p>
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr
                  key={exp.id}
                  className="border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors group"
                >
                  {/* Merchant */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                        style={{ backgroundColor: (exp.category?.color ?? '#6b7280') + '20' }}
                      >
                        {exp.category?.icon ?? '📦'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate max-w-[180px]">
                          {exp.merchant}
                        </p>
                        {exp.description && (
                          <p className="text-xs text-slate-500 truncate max-w-[180px]">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-5 py-3.5">
                    {exp.category ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: exp.category.color + '20',
                          color: exp.category.color,
                        }}
                      >
                        {exp.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5 text-sm text-slate-400 whitespace-nowrap">
                    {format(new Date(exp.date), 'MMM d, yyyy')}
                  </td>

                  {/* Source */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        exp.source === 'gmail'
                          ? 'bg-blue-500/15 text-blue-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {exp.source === 'gmail' ? '📧 Gmail' : '✏️ Manual'}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-sm font-bold text-slate-200 tabular-nums">
                      {exp.currency} {exp.amount.toFixed(2)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditing(exp)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-600 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <ExpenseModal
          categories={categories}
          onClose={() => setShowAdd(false)}
          onSave={() => { fetchExpenses(); setShowAdd(false) }}
        />
      )}
      {editing && (
        <ExpenseModal
          expense={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={() => { fetchExpenses(); setEditing(null) }}
        />
      )}
      {showSync && <GmailSyncModal onClose={() => setShowSync(false)} />}
    </div>
  )
}
