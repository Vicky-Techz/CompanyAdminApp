import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCollection } from '../services/firestoreService'
import { isFirebaseEnabled, DASHBOARD_DEFAULTS } from '../config'

const defaultStats = DASHBOARD_DEFAULTS.stats

const defaultStudents = DASHBOARD_DEFAULTS.recentStudents

const computeCourseAnalytics = (students) => {
  const counts = students.reduce((acc, student) => {
    const course = (student.category || student.program || student.batch || 'General').trim() || 'General'
    acc[course] = (acc[course] || 0) + 1
    return acc
  }, {})
  return Object.entries(counts).map(([name, count]) => ({ name, count }))
}

export default function Dashboard() {
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState(defaultStats)
  const [students, setStudents] = useState(defaultStudents)
  const [allStudents, setAllStudents] = useState(defaultStudents)
  const courseAnalytics = useMemo(() => computeCourseAnalytics(allStudents), [allStudents])

  useEffect(() => {
    if (!isFirebaseEnabled) {
      return
    }

    Promise.all([
      fetchCollection('students'),
      fetchCollection('batches'),
      fetchCollection('approvals'),
      fetchCollection('certificates'),
    ])
      .then(([studentsData, batchesData, approvalsData, certificatesData]) => {
        setStats([
          { label: 'Total Students', value: studentsData.length, icon: '👨‍🎓' },
          { label: 'Active Batches', value: batchesData.length, icon: '📦' },
          { label: 'Pending Approvals', value: approvalsData.length, icon: '🕒' },
          { label: 'Certificates Issued', value: certificatesData.length, icon: '🎓' },
        ])
        setAllStudents(studentsData)
        setStudents(studentsData.slice(0, 3).map((item) => ({
          id: item.id,
          name: item.name || 'Unnamed',
          email: item.email || 'unknown@example.com',
          batch: item.batch || 'N/A',
          status: item.status || 'Active',
        })))
      })
      .catch(() => {
        // keep fallback stats and students when Firestore data is unavailable
      })
  }, [])

  const filteredStudents = useMemo(() => {
    return students.filter((student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase()),
    )
  }, [students, search])

  return (
    <div className="page-content dashboard-page">
      <div className="dashboard-grid">
        {stats.map((item) => (
          <div key={item.label} className="metric-card">
            <div className="metric-icon">{item.icon}</div>
            <div>
              <p className="metric-label">{item.label}</p>
              <h2>{item.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <section className="quick-actions-section">
        <div className="section-header">
          <div>
            <h3>Quick access</h3>
            <p>Open the most important admin areas with one click.</p>
          </div>
        </div>
        <div className="quick-actions-grid">
          <Link to="/students" className="quick-action-card">
            <span>👨‍🎓</span>
            <div>
              <h4>Students</h4>
              <p>View and manage student records.</p>
            </div>
          </Link>
          <Link to="/certificates" className="quick-action-card">
            <span>🎓</span>
            <div>
              <h4>Certificates</h4>
              <p>Generate or review certificates.</p>
            </div>
          </Link>
          <Link to="/staff" className="quick-action-card">
            <span>👥</span>
            <div>
              <h4>Staff</h4>
              <p>Manage instructors and staff profiles.</p>
            </div>
          </Link>
          <Link to="/programs" className="quick-action-card">
            <span>📦</span>
            <div>
              <h4>Programs</h4>
              <p>Edit programs and batch details.</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="dashboard-row analytics-panel">
        <div className="panel full-panel">
          <div className="panel-header">
            <h3>Course analytics</h3>
            <span>{courseAnalytics.length} categories</span>
          </div>
          <div className="analytics-grid">
            {courseAnalytics.map((item) => (
              <div key={item.name} className="analytics-card">
                <h4>{item.name}</h4>
                <p>{item.count} student{item.count === 1 ? '' : 's'}</p>
              </div>
            ))}
          </div>
          <div className="analytics-chart">
            {/* Simple SVG bar chart */}
            <svg viewBox="0 0 600 240" preserveAspectRatio="xMidYMid meet">
              {
                (() => {
                  const max = Math.max(1, ...courseAnalytics.map(c => c.count))
                  const pad = 40
                  const w = 600
                  const h = 200
                  const chartWidth = w - pad * 2
                  const barWidth = chartWidth / Math.max(1, courseAnalytics.length)
                  return courseAnalytics.map((c, i) => {
                    const barHeight = (c.count / max) * (h - 40)
                    const x = pad + i * barWidth
                    const y = h - barHeight
                    return (
                      <g key={c.name}>
                        <rect x={x + 8} y={y} width={Math.max(8, barWidth - 16)} height={barHeight} fill="rgba(143,94,255,0.85)" rx="6" />
                        <text x={x + barWidth / 2} y={h + 14} fontSize="12" fill="#d7c6ff" textAnchor="middle">{c.name}</text>
                        <text x={x + barWidth / 2} y={y - 6} fontSize="12" fill="#fff" textAnchor="middle">{c.count}</text>
                      </g>
                    )
                  })
                })()
              }
            </svg>
          </div>
        </div>
      </section>

      <section className="dashboard-row">
        <div className="panel notifications-panel">
          <div className="panel-header">
            <h3>Notifications</h3>
            <span>Live</span>
          </div>
          <ul>
            <li>4 new students imported from Excel.</li>
            <li>Program hierarchy updated for Spring terms.</li>
            <li>Template upload available for certificates.</li>
          </ul>
        </div>

        <div className="panel search-panel">
          <div className="panel-header">
            <h3>Live Search</h3>
            <span>Suggestions</span>
          </div>
          <input
            type="search"
            placeholder="Search students by name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="search-suggestions">
            {filteredStudents.map((student) => (
              <div key={student.id} className="search-suggestion">
                <strong>{student.name}</strong>
                <span>{student.email}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-row split-panels">
        <div className="panel full-panel">
          <div className="panel-header">
            <h3>Student Management</h3>
            <button type="button" className="button-secondary">Add Student Manually</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Batch</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.batch}</td>
                  <td>{student.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel full-panel">
          <div className="panel-header">
            <h3>Certificate System</h3>
            <button type="button" className="button-secondary">Bulk PDF Generation</button>
          </div>
          <table className="data-table small">
            <thead>
              <tr>
                <th>Student</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Jeann Kaur</td>
                <td>24/11/2023</td>
                <td>Ready</td>
              </tr>
              <tr>
                <td>Sanoj Patel</td>
                <td>27/11/2023</td>
                <td>Issued</td>
              </tr>
              <tr>
                <td>Sathya Dewan</td>
                <td>30/11/2023</td>
                <td>Pending</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
