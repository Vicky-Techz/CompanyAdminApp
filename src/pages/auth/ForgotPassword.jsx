import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      await resetPassword(email)
      setMessage('Password reset email sent. Check your inbox.')
    } catch (err) {
      setError(err.message || 'Unable to send reset link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Reset password</h2>
        <p>Enter your email to receive a password reset link.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email address
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          {message && <div className="form-note success-note">{message}</div>}
          {error && <div className="form-error">{error}</div>}
          <button type="submit" disabled={loading} className="button-primary">
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
        <div className="auth-actions">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  )
}
