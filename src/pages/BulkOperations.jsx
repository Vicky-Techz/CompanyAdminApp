import { useEffect, useState } from 'react'
import { fetchCollection, setCollectionItem, subscribeCollection } from '../services/firestoreService'
import { isFirebaseEnabled } from '../firebaseConfig'

const fallbackAttendance = [
  { id: 'A001', date: '2025-04-10', student: 'Jahn Aknih', status: 'Present' },
  { id: 'A002', date: '2025-04-10', student: 'James Kanchar', status: 'Absent' },
  { id: 'A003', date: '2025-04-10', student: 'Jonas Math', status: 'Present' },
]

const fallbackAssessments = [
  { id: 'AS001', student: 'Jahn Aknih', subject: 'Electronics', score: 92, status: 'Completed' },
  { id: 'AS002', student: 'James Kanchar', subject: 'Robotics', score: 76, status: 'Pending' },
  { id: 'AS003', student: 'Jonas Math', subject: 'AI', score: 88, status: 'Completed' },
]

export default function BulkOperations() {
  const [attendance, setAttendance] = useState(fallbackAttendance)
  const [assessments, setAssessments] = useState(fallbackAssessments)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseEnabled) {
      setLoading(false)
      return
    }

    fetchCollection('attendance')
      .then((items) => {
        if (items.length) {
          setAttendance(items.map((item) => ({
            id: item.id,
            date: item.date || 'N/A',
            student: item.student || 'Unknown',
            status: item.status || 'Absent',
          })))
        }
      })
      .finally(() => setLoading(false))

    const unsubAttendance = subscribeCollection('attendance', (items) => {
      if (items.length) {
        setAttendance(items.map((item) => ({
          id: item.id,
          date: item.date || 'N/A',
          student: item.student || 'Unknown',
          status: item.status || 'Absent',
        })))
      }
    })

    const unsubAssessments = subscribeCollection('assessments', (items) => {
      if (items.length) {
        setAssessments(items.map((item) => ({
          id: item.id,
          student: item.student || 'Unknown',
          subject: item.subject || 'General',
          score: item.score || 0,
          status: item.status || 'Pending',
        })))
      }
    })

    return () => {
      unsubAttendance()
      unsubAssessments()
    }
  }, [])

  const toggleAttendance = async (record) => {
    const updated = { ...record, status: record.status === 'Present' ? 'Absent' : 'Present' }
    setAttendance((current) => current.map((item) => (item.id === record.id ? updated : item)))
    if (isFirebaseEnabled) {
      await setCollectionItem('attendance', record.id, updated)
    }
  }

  const toggleAssessment = async (record) => {
    const updated = { ...record, status: record.status === 'Completed' ? 'Pending' : 'Completed' }
    setAssessments((current) => current.map((item) => (item.id === record.id ? updated : item)))
    if (isFirebaseEnabled) {
      await setCollectionItem('assessments', record.id, updated)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Bulk Operations</h2>
          <p>Manage attendance and assessment status updates in bulk.</p>
        </div>
      </div>

      <div className="panel split-panels">
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3>Bulk attendance</h3>
              <p>{loading ? 'Loading attendance records...' : `${attendance.length} records`}</p>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record) => (
                <tr key={record.id}>
                  <td>{record.date}</td>
                  <td>{record.student}</td>
                  <td>{record.status}</td>
                  <td>
                    <button className="button-secondary" type="button" onClick={() => toggleAttendance(record)}>
                      Mark {record.status === 'Present' ? 'Absent' : 'Present'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3>Bulk assessment</h3>
              <p>{loading ? 'Loading assessments...' : `${assessments.length} assessments`}</p>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Subject</th>
                <th>Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((record) => (
                <tr key={record.id}>
                  <td>{record.student}</td>
                  <td>{record.subject}</td>
                  <td>{record.score}</td>
                  <td>{record.status}</td>
                  <td>
                    <button className="button-secondary" type="button" onClick={() => toggleAssessment(record)}>
                      Mark {record.status === 'Completed' ? 'Pending' : 'Completed'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
