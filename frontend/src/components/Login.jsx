import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const buttonRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const initGSI = () => {
      if (!window.google || !buttonRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      })
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 280,
        text: 'signin_with',
        shape: 'rectangular',
      })
    }

    if (window.google) {
      initGSI()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initGSI
    document.head.appendChild(script)
  }, [])

  async function handleCredentialResponse(response) {
    setError('')
    try {
      const res = await api.post('/auth/google', { credential: response.credential })
      login(res.data.token, res.data.user)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error ?? 'Sign-in failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-3xl shadow-xl shadow-emerald-500/30 mx-auto mb-4">
            💰
          </div>
          <h1 className="text-2xl font-bold text-slate-100">SpendSmart</h1>
          <p className="text-slate-500 text-sm mt-1">Gmail Expense Tracker</p>
        </div>

        {/* Card */}
        <div className="card text-center space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Sign in to continue</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your expenses are private and tied to your Google account.
            </p>
          </div>

          {!GOOGLE_CLIENT_ID ? (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left">
              <p className="text-xs font-semibold text-amber-400 mb-1">Setup required</p>
              <p className="text-xs text-slate-400">
                Add your Google OAuth Client ID to{' '}
                <code className="text-emerald-400 bg-slate-900 px-1 rounded">frontend/.env</code>:
              </p>
              <pre className="text-xs text-slate-300 bg-slate-900 rounded-lg p-3 mt-2 text-left overflow-auto">
                VITE_GOOGLE_CLIENT_ID=your-client-id-here
              </pre>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <div ref={buttonRef} />
              </div>
              {error && (
                <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </>
          )}

          <p className="text-[10px] text-slate-600">
            By signing in you agree to keep your expenses to yourself 😄
          </p>
        </div>
      </div>
    </div>
  )
}
