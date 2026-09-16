import { useEffect, useState } from 'react'
import { fetchCollection, subscribeCollection } from '../services/firestoreService'
import { isFirebaseEnabled } from '../firebaseConfig'

const fallbackStaff = [
  { id: 'ST001', name: 'Sanathbir Smith', role: 'Administrator', status: 'Active' },
  { id: 'ST002', name: 'Madhan Smith', role: 'Instructor', status: 'Pending Approval' },
  { id: 'ST003', name: 'Raman Murri', role: 'Support', status: 'Approved' },
]

export default function Staff() {
  const [staff, setStaff] = useState(fallbackStaff)
  const [loading, setLoading] = useState(!isFirebaseEnabled)

  useEffect(() => {
    if (!isFirebaseEnabled) return

    fetchCollection('staff').then((items) => {
      if (items.length) {
        setStaff(items)
      }
      setLoading(false)
    })

    const unsubscribe = subscribeCollection('staff', (items) => {
      if (items.length) {
        setStaff(items)
      }
    })

    return unsubscribe
  }, [])

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Staff & Approval</h2>
          <p>Create, review, and manage staff approval flows.</p>
        </div>
      </div>
      <div className="panel-card">
        <div className="panel-header">
          <h3>Pending approvals</h3>
          <span>{loading ? 'Loading...' : `${staff.length} staff records`}</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{member.role}</td>
                <td>{member.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
