import { useEffect, useState } from 'react'
import { fetchCollection, subscribeCollection } from '../../services/firestoreService'
import { isFirebaseEnabled, FIRESTORE_SEED_DATA } from '../../config'

const fallbackStaff = FIRESTORE_SEED_DATA.staff

export default function Staff() {
  const [staff, setStaff] = useState(fallbackStaff)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseEnabled) {
      setLoading(false)
      return
    }

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
