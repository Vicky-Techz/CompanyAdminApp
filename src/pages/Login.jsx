import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Unable to login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Welcome back</h2>
        <p>Sign in to access the Evolve dashboard.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email address
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" disabled={loading} className="button-primary">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="auth-actions">
          <Link to="/register">Register with invite token</Link>
          <Link to="/demo">Use demo access</Link>
        </div>
      </div>
    </div>
  )
}
