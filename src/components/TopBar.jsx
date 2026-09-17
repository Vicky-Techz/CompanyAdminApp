import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchCollection, subscribeCollection, setCollectionItem } from '../services/firestoreService'
import { isFirebaseEnabled } from '../config'

export default function TopBar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [query, setQuery] = useState('')
  const [students, setStudents] = useState([])
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const profileRef = useRef(null)
  const notifRef = useRef(null)
  const searchRef = useRef(null)

  const initials = useMemo(() => {
    if (!user?.email) return 'EA'
    return user.email
      .split('@')[0]
      .split(/[-_.]/)
      .map((part) => part[0]?.toUpperCase())
      .join('')
  }, [user])

  const displayName = useMemo(() => {
    if (user?.displayName) return user.displayName
    if (user?.email) return user.email.split('@')[0]
    return 'Guest'
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isFirebaseEnabled) return

    fetchCollection('students').then((items) => setStudents(items)).catch(() => {})

    const unsubscribe = subscribeCollection('students', (items) => {
      setStudents(items)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!isFirebaseEnabled) return
    // subscribe to notifications collection in Firestore
    const unsub = subscribeCollection('notifications', (items) => {
      // ensure items have read flag
      setNotifications(items.map((it) => ({ id: it.id, title: it.title, body: it.body, read: !!it.read })))
    })
    // initial fetch
    fetchCollection('notifications').then((items) => {
      setNotifications(items.map((it) => ({ id: it.id, title: it.title, body: it.body, read: !!it.read })))
    }).catch(() => {})

    return unsub
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length
  const matchingStudents = query.trim()
    ? students.filter((student) => {
      const searchValue = query.toLowerCase().trim()
      return [student.name, student.email, student.contact, student.phone]
        .some((value) => String(value || '').toLowerCase().includes(searchValue))
    }).slice(0, 8)
    : []

  const markAllRead = async () => {
    if (isFirebaseEnabled) {
      await Promise.all(notifications.map((n) => setCollectionItem('notifications', n.id, { ...n, read: true })))
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>Dashboard</h1>
        <div className="search-box" ref={searchRef}>
          <input
            type="search"
            placeholder="Search students by name or phone..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <div className="topbar-search-results">
              {matchingStudents.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  className="topbar-search-result"
                  onClick={() => {
                    navigate(`/students/${student.id}`)
                    setQuery('')
                  }}
                >
                  <strong>{student.name}</strong>
                  <span>{student.contact || student.phone || student.email || 'No phone number'}</span>
                </button>
              ))}
              {matchingStudents.length === 0 && <div className="topbar-search-empty">No students found.</div>}
            </div>
          )}
        </div>
      </div>
      <div className="topbar-right">
        <div className="notification-wrapper" ref={notifRef}>
          <button
            type="button"
            className="notification-button"
            aria-label="Notifications"
            onClick={() => {
              setNotifOpen((s) => !s)
              setProfileOpen(false)
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 17H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 22c1.1 0 2-.9 2-2H10c0 1.1.9 2 2 2z" fill="currentColor"/>
              <path d="M18 8a6 6 0 10-12 0v3l-2 2v1h18v-1l-2-2V8z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>

          {notifOpen && (
            <div className={`notification-dropdown ${notifOpen ? 'open' : ''}`}>
              <div className="notification-header">
                <strong>Notifications</strong>
                <button className="button-secondary small" onClick={markAllRead}>Mark all read</button>
              </div>
              <div className="notification-list">
                {notifications.map((n) => (
                  <div key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'}`}>
                    <div className="notification-title">{n.title}</div>
                    <div className="notification-body">{n.body}</div>
                  </div>
                ))}
                {notifications.length === 0 && <div className="notification-empty">No notifications</div>}
              </div>
            </div>
          )}
        </div>

        <div className="profile-pill" ref={profileRef}>
          {user?.role === 'super_admin' && <div className="profile-role">Admin</div>}
          <button
            type="button"
            className="profile-icon-button"
            aria-label="Profile"
            onClick={() => {
              setProfileOpen((s) => !s)
              setNotifOpen(false)
            }}
          >
            <span className="avatar">{initials}</span>
          </button>

          {profileOpen && (
            <div className={`profile-dropdown ${profileOpen ? 'open' : ''}`}>
              <div className="profile-top">
                <div className="avatar-large">{initials}</div>
                <div className="profile-meta">
                  <strong>{displayName}</strong>
                  <small>{user?.email || 'Guest user'}</small>
                </div>
              </div>
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  logout()
                  setProfileOpen(false)
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
