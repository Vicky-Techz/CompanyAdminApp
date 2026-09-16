import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { addCollectionItem, fetchCollection, fetchDocument, setCollectionItem, subscribeCollection } from '../../services/firestoreService'
import { FIRESTORE_SEED_DATA, isFirebaseEnabled } from '../../config'

const getToday = () => new Date().toISOString().slice(0, 10)

const getRemainingSyllabus = (syllabus, topicsCovered) => {
  const syllabusItems = syllabus
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  if (!syllabusItems.length) return ''

  const covered = topicsCovered
    .toLowerCase()
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  if (!covered.length) return syllabusItems.join('\n')

  return syllabusItems
    .filter((item) => !covered.some((topic) => item.toLowerCase().includes(topic) || topic.includes(item.toLowerCase())))
    .join('\n')
}

export default function StudentProfile() {
  const { id } = useParams()
  const [student, setStudent] = useState(() => ({
    name: 'Demo Student',
    email: 'demo@student.com',
    batch: '2024',
    category: 'Robotics',
  }))
  const [loading, setLoading] = useState(!isFirebaseEnabled)
  const [staff, setStaff] = useState(FIRESTORE_SEED_DATA.staff || [])
  const [assessments, setAssessments] = useState([])
  const [attendance, setAttendance] = useState([])
  const [assessmentForm, setAssessmentForm] = useState({
    classDate: getToday(),
    staffId: '',
    topicsCovered: '',
    syllabus: '',
    syllabusRemaining: '',
  })
  const [assessmentMessage, setAssessmentMessage] = useState('')
  const [attendanceForm, setAttendanceForm] = useState({ date: getToday() })
  const [attendanceMessage, setAttendanceMessage] = useState('')
  const [syllabusFileName, setSyllabusFileName] = useState('')
  const remainingSyllabus = useMemo(
    () => getRemainingSyllabus(assessmentForm.syllabus, assessmentForm.topicsCovered),
    [assessmentForm.syllabus, assessmentForm.topicsCovered],
  )

  useEffect(() => {
    if (!isFirebaseEnabled) return

    fetchDocument('students', id)
      .then((item) => {
        if (item) {
          setStudent(item)
          if (item.syllabusContent) {
            setAssessmentForm((current) => ({
              ...current,
              syllabus: item.syllabusContent,
            }))
          }
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!isFirebaseEnabled) return

    fetchCollection('staff').then((items) => {
      if (items.length) setStaff(items)
    }).catch(() => {})

    fetchCollection('assessments').then((items) => {
      setAssessments(items.filter((item) => item.studentId === id))
    }).catch(() => {})
    fetchCollection('attendance').then((items) => {
      setAttendance(items.filter((item) => item.studentId === id))
    }).catch(() => {})

    const unsubscribeStaff = subscribeCollection('staff', (items) => {
      if (items.length) setStaff(items)
    })
    const unsubscribeAssessments = subscribeCollection('assessments', (items) => {
      setAssessments(items.filter((item) => item.studentId === id))
    })
    const unsubscribeAttendance = subscribeCollection('attendance', (items) => {
      setAttendance(items.filter((item) => item.studentId === id))
    })

    return () => {
      unsubscribeStaff?.()
      unsubscribeAssessments?.()
      unsubscribeAttendance?.()
    }
  }, [id])

  const handleAddAttendance = async (event) => {
    event.preventDefault()
    const existing = attendance.find((record) => record.date === attendanceForm.date)
    const status = existing?.status === 'Present' ? 'Not Present' : 'Present'
    const record = {
      studentId: id,
      student: student.name,
      date: attendanceForm.date,
      status,
    }

    try {
      if (isFirebaseEnabled) {
        if (existing) {
          const saved = await setCollectionItem('attendance', existing.id, record)
          setAttendance((current) => current.map((item) => item.id === existing.id ? saved : item))
        } else {
          const saved = await addCollectionItem('attendance', record)
          setAttendance((current) => [saved, ...current])
        }
        setAttendanceMessage('Attendance saved to Firebase.')
      } else {
        setAttendance((current) => existing
          ? current.map((item) => item.id === existing.id ? { ...item, ...record } : item)
          : [{ id: `AT-${Date.now()}`, ...record }, ...current])
        setAttendanceMessage('Attendance saved locally in demo mode.')
      }
    } catch (error) {
      setAttendanceMessage(`Attendance could not be saved: ${error.message}`)
    }
  }

  const handleAddAssessment = async (event) => {
    event.preventDefault()
    const selectedStaff = staff.find((member) => member.id === assessmentForm.staffId)

    if (!assessmentForm.classDate || !selectedStaff || !assessmentForm.topicsCovered || !assessmentForm.syllabus) {
      setAssessmentMessage('Date, staff, topics covered, and syllabus are required.')
      return
    }

    const assessment = {
      studentId: id,
      student: student.name,
      classDate: assessmentForm.classDate,
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      topicsCovered: assessmentForm.topicsCovered,
      syllabus: assessmentForm.syllabus,
      syllabusRemaining: remainingSyllabus,
      status: 'Completed',
    }

    try {
      if (isFirebaseEnabled) {
        await addCollectionItem('assessments', assessment)
        setAssessmentMessage('Class assessment saved to Firebase.')
      } else {
        setAssessments((current) => [{ id: `AS-${Date.now()}`, ...assessment }, ...current])
        setAssessmentMessage('Class assessment added locally in demo mode.')
      }
      setAssessmentForm({
        classDate: getToday(),
        staffId: '',
        topicsCovered: '',
        syllabus: '',
        syllabusRemaining: '',
      })
      setSyllabusFileName('')
    } catch (error) {
      setAssessmentMessage(`Assessment could not be saved: ${error.message}`)
    }
  }

  const handleSyllabusUpload = async (event) => {
    const [file] = event.target.files
    if (!file) return

    try {
      const syllabusText = await file.text()
      setAssessmentForm((current) => ({ ...current, syllabus: syllabusText }))
      setSyllabusFileName(file.name)
      setAssessmentMessage('Syllabus uploaded. Remaining syllabus will update automatically.')
    } catch (error) {
      setAssessmentMessage(`Syllabus could not be uploaded: ${error.message}`)
    }
    event.target.value = ''
  }

  return (
    <div className="page-content">
      <div className="panel-card">
        <div className="panel-header">
          <h3>Attendance</h3>
          <span>{attendance.length} record{attendance.length === 1 ? '' : 's'}</span>
        </div>
        <form onSubmit={handleAddAttendance} className="small-form">
          <label>
            Date
            <input
              type="date"
              value={attendanceForm.date}
              onChange={(event) => setAttendanceForm({ date: event.target.value })}
              required
            />
          </label>
          <button type="submit" className="button-primary">
            {attendance.find((record) => record.date === attendanceForm.date)?.status === 'Present'
              ? 'Mark not present'
              : 'Mark present'}
          </button>
          {attendanceMessage && <p className="form-note">{attendanceMessage}</p>}
        </form>
        {attendance.length > 0 && (
          <div className="students-table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record.id}><td>{record.date}</td><td>{record.status}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="panel-card">
        <h2>Student profile</h2>
        {loading ? (
          <p>Loading profile...</p>
        ) : (
          <>
            <div className="page-actions profile-actions">
              <Link className="button-primary" to={`/students?edit=${encodeURIComponent(student?.id || id)}`}>
                Edit student
              </Link>
              <Link className="button-secondary" to={`/payments?studentId=${encodeURIComponent(student?.id || id)}`}>
                Add payment
              </Link>
            </div>
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
                <strong>Contact</strong>
                <p>{student?.contact || student?.phone || 'Not available'}</p>
              </div>
              <div>
                <strong>Parent / guardian</strong>
                <p>{student?.parentName || 'Not available'}</p>
              </div>
              <div>
                <strong>Age</strong>
                <p>{student?.age || 'Not available'}</p>
              </div>
              <div>
                <strong>Date of birth</strong>
                <p>{student?.dob || 'Not available'}</p>
              </div>
              <div>
                <strong>Gender</strong>
                <p>{student?.gender || 'Not available'}</p>
              </div>
              <div>
                <strong>Batch</strong>
                <p>{student?.batch || 'N/A'}</p>
              </div>
              <div>
                <strong>Program</strong>
                <p>{student?.program || 'Not available'}</p>
              </div>
              <div>
                <strong>Selected syllabus</strong>
                <p>{student?.syllabusName || 'Not available'}</p>
              </div>
              <div>
                <strong>Category</strong>
                <p>{student?.category || 'N/A'}</p>
              </div>
              <div>
                <strong>Subcategory</strong>
                <p>{student?.subcategory || 'Not available'}</p>
              </div>
              <div>
                <strong>Total course fee</strong>
                <p>{student?.totalCourseFee || 'Not available'}</p>
              </div>
              <div>
                <strong>Joining Date</strong>
                <p>{student?.joiningDate || 'Not available'}</p>
              </div>
              <div>
                <strong>Completion Date</strong>
                <p>{student?.completionDate || 'Not available'}</p>
              </div>
              <div>
                <strong>Notes</strong>
                <p>{student?.notes || 'Not available'}</p>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="panel-card">
        <div className="panel-header">
          <h3>Class assessment</h3>
          <span>{assessments.length} class{assessments.length === 1 ? '' : 'es'}</span>
        </div>
        <form onSubmit={handleAddAssessment} className="small-form">
          <div className="form-grid-two">
            <label>
              Class date
              <input
                type="date"
                value={assessmentForm.classDate}
                onChange={(event) => setAssessmentForm({ ...assessmentForm, classDate: event.target.value })}
                required
              />
            </label>
            <label>
              Staff who took the class
              <select
                value={assessmentForm.staffId}
                onChange={(event) => setAssessmentForm({ ...assessmentForm, staffId: event.target.value })}
                required
              >
                <option value="">Select staff member</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} {member.role ? `(${member.role})` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Topics covered
            <textarea
              value={assessmentForm.topicsCovered}
              onChange={(event) => setAssessmentForm({ ...assessmentForm, topicsCovered: event.target.value })}
              rows="3"
              placeholder="Topics covered in this class"
              required
            />
          </label>
          <label>
            Syllabus for the student
            <textarea
              value={assessmentForm.syllabus}
              onChange={(event) => setAssessmentForm({ ...assessmentForm, syllabus: event.target.value })}
              rows="3"
              placeholder="Full syllabus or current syllabus section"
              required
            />
            <div className="syllabus-upload-field">
              <label className="button-secondary file-upload syllabus-upload">
                Upload syllabus
                <input type="file" accept=".txt,.md,.csv" onChange={handleSyllabusUpload} hidden />
              </label>
              {syllabusFileName && <small className="form-note">Uploaded: {syllabusFileName}</small>}
            </div>
          </label>
          <label>
            Syllabus remaining
            <textarea
              value={remainingSyllabus}
              rows="3"
              placeholder="Remaining topics will be calculated automatically"
              readOnly
            />
          </label>
          <button type="submit" className="button-primary">Save class assessment</button>
          {assessmentMessage && <p className="form-note">{assessmentMessage}</p>}
        </form>
      </div>
      <div className="panel-card">
        <div className="panel-header">
          <h3>Class history</h3>
          <span>{assessments.length} record{assessments.length === 1 ? '' : 's'}</span>
        </div>
        {assessments.length === 0 ? (
          <p className="form-note">No class assessments recorded yet.</p>
        ) : (
          <div className="students-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Staff</th>
                  <th>Topics covered</th>
                  <th>Syllabus</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td>{assessment.classDate || assessment.date || '—'}</td>
                    <td>{assessment.staffName || assessment.staff || '—'}</td>
                    <td>{assessment.topicsCovered || '—'}</td>
                    <td>{assessment.syllabus || '—'}</td>
                    <td>{assessment.syllabusRemaining || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
