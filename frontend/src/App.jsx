import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LandingPage     from './pages/LandingPage'
import AuthPage        from './pages/AuthPage'
import AdminDashboard  from './pages/AdminDashboard'
import PublicFormPage  from './pages/PublicFormPage'

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/"        element={<LandingPage />} />
      <Route path="/login"   element={<AuthPage mode="login" />} />
      <Route path="/register"element={<AuthPage mode="register" />} />
      <Route path="/admin"   element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/f/:slug" element={<PublicFormPage />} />
    </Routes>
  )
}
