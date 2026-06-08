import { useEffect, useState } from 'react'
import { fetchCollection } from '../services/firestoreService'
import { isFirebaseEnabled } from '../firebaseConfig'

export default function Tools() {
  const [counts, setCounts] = useState({ students: 0, certificates: 0, receipts: 0 })

  useEffect(() => {
    if (!isFirebaseEnabled) {
      return
    }

    Promise.all([fetchCollection('students'), fetchCollection('certificates'), fetchCollection('receipts')])
      .then(([students, certificates, receipts]) => {
        setCounts({
          students: students.length,
          certificates: certificates.length,
          receipts: receipts.length,
        })
      })
      .catch(() => {
        // fallback to zero counts if fetch fails
      })
  }, [])

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Data & Tools</h2>
          <p>Firebase backend, Excel import, and PDF export utilities.</p>
        </div>
      </div>
      <div className="panel-grid">
        <div className="metric-card tool-card">
          <h3>Firebase</h3>
          <p>{isFirebaseEnabled ? 'Connected to Firestore and storage.' : 'Firebase not configured. Running in demo mode.'}</p>
        </div>
        <div className="metric-card tool-card">
          <h3>Data summary</h3>
          <p>{counts.students} students • {counts.certificates} certificates • {counts.receipts} receipts</p>
        </div>
      </div>
    </div>
  )
}
