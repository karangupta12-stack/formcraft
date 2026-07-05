import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import './Auth.css'

export default function AuthPage({ mode }) {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const isLogin = mode === 'login'
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({ username:'', display_name:'', password:'', confirm_password:'' })
  const [errors, setErrors]   = useState({})

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})) }

  const validate = () => {
    const e = {}
    if (!form.username.trim())  e.username = 'Username is required'
    if (!isLogin && !form.display_name.trim()) e.display_name = 'Display name is required'
    if (!form.password)         e.password = 'Password is required'
    if (!isLogin && form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      if (isLogin) {
        await login({ username: form.username.toLowerCase().trim(), password: form.password })
        toast.success('Welcome back!')
      } else {
        await register({ username: form.username.toLowerCase().trim(), display_name: form.display_name.trim(), password: form.password, confirm_password: form.confirm_password })
        toast.success('Account created! Welcome to FormCraft 🎉')
      }
      navigate('/admin')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const newErrs = {}
        Object.entries(data).forEach(([k,v]) => { newErrs[k] = Array.isArray(v) ? v[0] : v })
        setErrors(newErrs)
        toast.error(Object.values(newErrs)[0] || 'Something went wrong')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    } finally { setLoading(false) }
  }

  const handleKey = e => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div className="page auth-page">
      <div className="bg-decoration"><div className="bg-blob blob-1"/><div className="bg-blob blob-2"/></div>

      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <div className="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="6" x2="12" y2="14"/><line x1="8" y1="10" x2="16" y2="10"/></svg>
          </div>
          <span>FormCraft</span>
        </Link>
        <div className="nav-links">
          {isLogin
            ? <><span className="auth-hint hide-mobile">No account?</span><Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link></>
            : <><span className="auth-hint hide-mobile">Have account?</span><Link to="/login" className="btn btn-ghost btn-sm">Login</Link></>
          }
        </div>
      </nav>

      <div className="auth-center">
        <div className="auth-card card">
          <div className="auth-header">
            <div className="auth-icon">{isLogin ? '🔐' : '✨'}</div>
            <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
            <p>{isLogin ? 'Sign in to your FormCraft dashboard' : 'Start building professional forms for free'}</p>
          </div>

          <div className="auth-body">
            {!isLogin && (
              <div className="field-group">
                <label className="label">Display Name <span className="required-star">*</span></label>
                <input className={`input ${errors.display_name?'error':''}`} placeholder="e.g. Karan Sharma" value={form.display_name} onChange={e=>set('display_name',e.target.value)} onKeyDown={handleKey} />
                {errors.display_name && <span className="field-error">⚠ {errors.display_name}</span>}
              </div>
            )}

            <div className="field-group">
              <label className="label">Username <span className="required-star">*</span></label>
              <input className={`input ${errors.username?'error':''}`} placeholder="e.g. karan123" value={form.username} onChange={e=>set('username',e.target.value)} onKeyDown={handleKey} autoComplete="username" />
              {errors.username && <span className="field-error">⚠ {errors.username}</span>}
              {!isLogin && <span className="helper-text">Your form links: formcraft.app/f/&lt;form-id&gt;</span>}
            </div>

            <div className="field-group">
              <label className="label">Password <span className="required-star">*</span></label>
              <input type="password" className={`input ${errors.password?'error':''}`} placeholder="Min 4 characters" value={form.password} onChange={e=>set('password',e.target.value)} onKeyDown={handleKey} autoComplete={isLogin?'current-password':'new-password'} />
              {errors.password && <span className="field-error">⚠ {errors.password}</span>}
            </div>

            {!isLogin && (
              <div className="field-group">
                <label className="label">Confirm Password <span className="required-star">*</span></label>
                <input type="password" className={`input ${errors.confirm_password?'error':''}`} placeholder="Repeat your password" value={form.confirm_password} onChange={e=>set('confirm_password',e.target.value)} onKeyDown={handleKey} autoComplete="new-password" />
                {errors.confirm_password && <span className="field-error">⚠ {errors.confirm_password}</span>}
              </div>
            )}

            <button className="btn btn-primary auth-submit" onClick={handleSubmit} disabled={loading}>
              {loading
                ? <><svg className="spinner" viewBox="0 0 24 24" width="17" height="17"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" strokeLinecap="round"/></svg>Please wait…</>
                : isLogin ? 'Sign In' : 'Create Account'
              }
            </button>

            <p className="auth-switch">
              {isLogin
                ? <>Don't have an account? <Link to="/register">Sign up free</Link></>
                : <>Already have an account? <Link to="/login">Sign in</Link></>
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
