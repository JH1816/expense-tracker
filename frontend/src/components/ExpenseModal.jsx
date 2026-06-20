import { useState } from 'react'
import { X } from 'lucide-react'
import { createExpense, updateExpense } from '../api'

const CURRENCIES = ['SGD', 'USD', 'EUR', 'GBP', 'MYR', 'JPY', 'AUD']

const today = () => new Date().toISOString().slice(0, 10)

export default function ExpenseModal({ expense = null, categories, onClose, onSave }) {
  const isEditing = expense !== null

  const [form, setForm] = useState({
    amount: expense?.amount?.toString() ?? '',
    merchant: expense?.merchant ?? '',
    description: expense?.description ?? '',
    category_id: expense?.category_id?.toString() ?? '',
    date: expense ? new Date(expense.date).toISOString().slice(0, 10) : today(),
    currency: expense?.currency ?? 'SGD',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        category_id: form.category_id ? parseInt(form.category_id) : null,
      }
      if (isEditing) {
        await updateExpense(expense.id, payload)
      } else {
        await createExpense(payload)
      }
      onSave()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-base font-semibold text-slate-100">
            {isEditing ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Amount + Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Amount <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.amount}
                onChange={set('amount')}
                className="input"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Currency</label>
              <select value={form.currency} onChange={set('currency')} className="input">
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Merchant <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.merchant}
              onChange={set('merchant')}
              className="input"
              placeholder="e.g. McDonald's, Grab, Amazon"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
            <select value={form.category_id} onChange={set('category_id')} className="input">
              <option value="">— Select category —</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={set('date')}
              className="input"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Description <span className="text-slate-600">(optional)</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={set('description')}
              className="input"
              placeholder="e.g. Lunch with team"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
