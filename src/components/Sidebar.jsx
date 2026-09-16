import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../../icon/logo.png'

const baseNavItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/students', label: 'Students' },
  { to: '/certificates', label: 'Certificates' },
]

const adminNavItems = [
  { to: '/staff', label: 'Staff' },
  { to: '/programs', label: 'Programs / Batches' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/syllabus', label: 'Syllabus' },
  { to: '/reports', label: 'Reports' },
  { to: '/payments', label: 'Payments' },
  { to: '/settings', label: 'Settings' },
  { to: '/tools', label: 'Data & Tools' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const isSuperUser = user?.role === 'super_admin'
  const navItems = [...baseNavItems, ...(isSuperUser ? adminNavItems : [])]

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <img src={logo} alt="Evolve logo" />
        </div>
        <p>Evolve robotics</p>
        <span className="brand-tagline">deeply routed</span>
      </div>

      <nav>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>{user?.displayName || user?.email || 'User'}</p>
      </div>
    </aside>
  )
}
