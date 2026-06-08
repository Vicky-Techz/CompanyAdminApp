import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { registerWithInvite } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerWithInvite(email, password, token)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Failed to register.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create account</h2>
        <p>Register using your invite token.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email address
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </label>
          <label>
            Invite token
            <input value={token} onChange={(e) => setToken(e.target.value)} type="text" required />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" disabled={loading} className="button-primary">
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>
        <div className="auth-actions">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  )
}
