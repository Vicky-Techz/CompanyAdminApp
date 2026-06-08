import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page-content centered-page">
      <div className="empty-state-card">
        <h2>Page not found</h2>
        <p>The page you are looking for does not exist.</p>
        <Link to="/" className="button-primary">Return to dashboard</Link>
      </div>
    </div>
  )
}
