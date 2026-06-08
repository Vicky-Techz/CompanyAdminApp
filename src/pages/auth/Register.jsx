import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FIREBASE_ADMIN_USER } from '../../config'

export default function Register() {
  const navigate = useNavigate()
  const { createAccount } = useAuth()
  const [email, setEmail] = useState(FIREBASE_ADMIN_USER.email)
  const [password, setPassword] = useState(FIREBASE_ADMIN_USER.password)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await createAccount(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Failed to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create account</h2>
        <p>Use the admin email below to create the main admin account.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email address
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </label>
          <div className="field-note">Password must be at least 6 characters for Firebase.</div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" disabled={loading} className="button-primary">
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <div className="auth-actions">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  )
}
