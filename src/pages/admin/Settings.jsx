export default function Settings() {
  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p>Configure app settings, notification preferences, and program defaults.</p>
        </div>
      </div>
      <div className="panel-grid">
        <div className="metric-card setting-card">
          <h3>General</h3>
          <p>Branding, default region, and app behavior settings.</p>
        </div>
        <div className="metric-card setting-card">
          <h3>Notifications</h3>
          <p>Enable dashboard alerts and email notifications.</p>
        </div>
        <div className="metric-card setting-card">
          <h3>Security</h3>
          <p>Manage authentication and invite token settings.</p>
        </div>
      </div>
    </div>
  )
}
