import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/students', label: 'Students' },
  { to: '/certificates', label: 'Certificates' },
  { to: '/staff', label: 'Staff' },
  { to: '/programs', label: 'Programs / Batches' },
  { to: '/bulk', label: 'Bulk Operations' },
  { to: '/reports', label: 'Reports' },
  { to: '/payments', label: 'Payments' },
  { to: '/settings', label: 'Settings' },
  { to: '/tools', label: 'Data & Tools' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">E</div>
        <div>
          <p>EVOLVE</p>
          <span>Robotics Admin</span>
        </div>
      </div>

      <nav>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>Demo access available</p>
        <span>v1.0</span>
      </div>
    </aside>
  )
}
