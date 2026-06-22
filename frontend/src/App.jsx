import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { LayoutDashboard, Receipt, LogOut } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Dashboard from './components/Dashboard'
import ExpenseList from './components/ExpenseList'
import Login from './components/Login'

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

function ProtectedLayout() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email[0].toUpperCase()

  return (
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
          <div className="flex items-center gap-2 px-1">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-7 h-7 rounded-full shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-300 truncate">
                {user.name || user.email.split('@')[0]}
              </p>
              <p className="text-[10px] text-slate-600 truncate">{user.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1 text-slate-600 hover:text-slate-400 hover:bg-slate-800 rounded-lg transition shrink-0"
            >
              <LogOut size={13} />
            </button>
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
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
