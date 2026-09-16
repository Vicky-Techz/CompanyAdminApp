import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchDocument } from '../../services/firestoreService'
import { isFirebaseEnabled } from '../../config'

export default function StudentProfile() {
  const { id } = useParams()
  const [student, setStudent] = useState(() => ({
    name: 'Demo Student',
    email: 'demo@student.com',
    batch: '2024',
    category: 'Robotics',
  }))
  const [loading, setLoading] = useState(!isFirebaseEnabled)

  useEffect(() => {
    if (!isFirebaseEnabled) return

    fetchDocument('students', id)
      .then((item) => {
        if (item) {
          setStudent(item)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="page-content centered-page">
      <div className="panel-card">
        <h2>Student profile</h2>
        {loading ? (
          <p>Loading profile...</p>
        ) : (
          <>
            <p>Profile details for student ID: <strong>{student?.id || id}</strong></p>
            <div className="profile-grid">
              <div>
                <strong>Name</strong>
                <p>{student?.name || 'Unnamed student'}</p>
              </div>
              <div>
                <strong>Email</strong>
                <p>{student?.email || 'unknown@example.com'}</p>
              </div>
              <div>
                <strong>Batch</strong>
                <p>{student?.batch || 'N/A'}</p>
              </div>
              <div>
                <strong>Category</strong>
                <p>{student?.category || 'N/A'}</p>
              </div>
              <div>
                <strong>Joining Date</strong>
                <p>{student?.joiningDate || 'Not available'}</p>
              </div>
              <div>
                <strong>Completion Date</strong>
                <p>{student?.completionDate || 'Not available'}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
