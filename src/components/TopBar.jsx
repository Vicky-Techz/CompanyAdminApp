import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function TopBar({ onSearch }) {
  const { user, logout } = useAuth()
  const [query, setQuery] = useState('')

  const initials = useMemo(() => {
    if (!user?.email) return 'EA'
    return user.email
      .split('@')[0]
      .split(/[-_.]/)
      .map((part) => part[0]?.toUpperCase())
      .join('')
  }, [user])

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>Dashboard</h1>
        <div className="search-box">
          <input
            type="search"
            placeholder="Live search students, programs..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              onSearch?.(event.target.value)
            }}
          />
        </div>
      </div>
      <div className="topbar-right">
        <button type="button" className="notification-button">
          Notifications <span>3</span>
        </button>
        <div className="profile-pill">
          <span>{initials}</span>
          <div>
            <strong>{user?.email || 'Guest'}</strong>
            <button type="button" onClick={logout}>Logout</button>
          </div>
        </div>
      </div>
    </header>
  )
}
