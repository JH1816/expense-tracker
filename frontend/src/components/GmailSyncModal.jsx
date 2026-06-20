import { X, Mail, Info } from 'lucide-react'

export default function GmailSyncModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center border border-blue-500/20">
              <Mail size={18} className="text-blue-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-100">Sync from Gmail</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex gap-2 mb-2">
              <Info size={15} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-300 font-medium">How it works</p>
            </div>
            <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside ml-1">
              <li>Claude scans your Gmail for transaction &amp; receipt emails</li>
              <li>Amounts, merchants, and dates are parsed automatically</li>
              <li>New expenses are added — duplicates are skipped</li>
              <li>You can edit or delete any synced expense afterwards</li>
            </ol>
          </div>

          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700">
            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-widest">
              How to sync
            </p>
            <p className="text-sm text-slate-300">
              Simply ask Claude:{' '}
              <span className="text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                "sync my Gmail expenses"
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Claude has access to your Gmail (tanjunhengonly@gmail.com) in this session
              and will find transaction emails and add them here automatically.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full btn-ghost"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
