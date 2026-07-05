import { useState, useCallback } from 'react'
import { authAPI } from '../services/api'

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('fc_token'))
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('fc_user') || 'null') }
    catch { return null }
  })

  const _save = (data) => {
    localStorage.setItem('fc_token', data.access)
    localStorage.setItem('fc_user', JSON.stringify(data.user))
    setToken(data.access)
    setUser(data.user)
    return data.user
  }

  const login    = useCallback(async creds => _save((await authAPI.login(creds)).data),    [])
  const register = useCallback(async creds => _save((await authAPI.register(creds)).data), [])

  const logout = useCallback(() => {
    localStorage.removeItem('fc_token')
    localStorage.removeItem('fc_user')
    setToken(null); setUser(null)
  }, [])

  return { token, user, login, register, logout }
}
