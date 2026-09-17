import { useEffect, useState } from 'react'
import { fetchCollection } from '../../services/firestoreService'
import { isFirebaseEnabled } from '../../config'

export default function Reports() {
  const [metrics, setMetrics] = useState({ students: 0, assessments: 0, certificates: 0 })

  useEffect(() => {
    if (!isFirebaseEnabled) {
      return
    }

    Promise.all([fetchCollection('students'), fetchCollection('assessments'), fetchCollection('certificates')])
      .then(([students, assessments, certificates]) => {
        setMetrics({
          students: students.length,
          assessments: assessments.length,
          certificates: certificates.length,
        })
      })
      .catch(() => {})
  }, [])

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p>Analytics, attendance summaries, and program performance.</p>
        </div>
      </div>
      <div className="panel-grid">
        <div className="metric-card report-card">
          <h3>Active students</h3>
          <p>{metrics.students} students currently enrolled.</p>
        </div>
        <div className="metric-card report-card">
          <h3>Assessments</h3>
          <p>{metrics.assessments} records available for analytics.</p>
        </div>
        <div className="metric-card report-card">
          <h3>Certificates</h3>
          <p>{metrics.certificates} certificates issued.</p>
        </div>
      </div>
    </div>
  )
}
