import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, Wallet } from 'lucide-react'
import Dashboard from './components/Dashboard'
import ExpenseList from './components/ExpenseList'

function NavItem({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`
      }
    >
      <Icon size={17} />
      {label}
    </NavLink>
  )
}

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-950">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 bg-slate-900/80 border-r border-slate-800 flex flex-col">
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-lg shadow-lg shadow-emerald-500/25">
                💰
              </div>
              <div>
                <h1 className="font-bold text-slate-100 text-sm">SpendSmart</h1>
                <p className="text-xs text-slate-500">Gmail Expense Tracker</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
              Main
            </p>
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" end />
            <NavItem to="/expenses" icon={Receipt} label="Expenses" />
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-2 px-2">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                J
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-300 truncate">tanjunhengonly</p>
                <p className="text-[10px] text-slate-600 truncate">@gmail.com</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-screen overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expenses" element={<ExpenseList />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
