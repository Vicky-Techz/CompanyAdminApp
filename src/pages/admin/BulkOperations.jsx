import { useEffect, useMemo, useState } from 'react'
import { addCollectionItem, fetchCollection, setCollectionItem, subscribeCollection } from '../../services/firestoreService'
import { isFirebaseEnabled, FIRESTORE_SEED_DATA } from '../../config'

const fallbackAttendance = FIRESTORE_SEED_DATA.attendance

export default function BulkOperations() {
  const [attendance, setAttendance] = useState(fallbackAttendance)
  const [loading, setLoading] = useState(!isFirebaseEnabled)

    const fallbackStudents = FIRESTORE_SEED_DATA.students
    const getToday = () => new Date().toISOString().slice(0, 10)

    const [students, setStudents] = useState(fallbackStudents)
    const [selectedDate, setSelectedDate] = useState(getToday())
    const [search, setSearch] = useState('')
    const [filterProgram, setFilterProgram] = useState('')
    const [filterBatch, setFilterBatch] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [filterSubcategory, setFilterSubcategory] = useState('')
    const [message, setMessage] = useState('')

    useEffect(() => {
      if (!isFirebaseEnabled) return

      fetchCollection('students').then((items) => setStudents(items)).catch(() => {})
      fetchCollection('attendance').then((items) => setAttendance(items)).catch(() => {}).finally(() => setLoading(false))

      const unsubscribeStudents = subscribeCollection('students', (items) => setStudents(items))
      const unsubscribeAttendance = subscribeCollection('attendance', (items) => setAttendance(items))

      return () => {
        unsubscribeStudents?.()
        unsubscribeAttendance?.()
      }
    }, [])

    const options = useMemo(() => ({
      programs: [...new Set(students.map((student) => student.program).filter(Boolean))],
      batches: [...new Set(students.map((student) => student.batch).filter(Boolean))],
      categories: [...new Set(students.map((student) => student.category).filter(Boolean))],
      subcategories: [...new Set(students.map((student) => student.subcategory).filter(Boolean))],
    }), [students])

    const filteredStudents = useMemo(() => {
      const searchValue = search.trim().toLowerCase()
      return students.filter((student) => {
        const matchesSearch = !searchValue || [student.name, student.email, student.contact, student.phone]
          .some((value) => String(value || '').toLowerCase().includes(searchValue))
        return matchesSearch &&
          (!filterProgram || student.program === filterProgram) &&
          (!filterBatch || student.batch === filterBatch) &&
          (!filterCategory || student.category === filterCategory) &&
          (!filterSubcategory || student.subcategory === filterSubcategory)
      })
    }, [students, search, filterProgram, filterBatch, filterCategory, filterSubcategory])

    const getStudentAttendance = (student) => attendance.find(
      (record) => record.studentId === student.id && record.date === selectedDate,
    )

    const saveAttendance = async (student, status) => {
      const existing = getStudentAttendance(student)
      const record = {
        studentId: student.id,
        student: student.name,
        date: selectedDate,
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
        } else {
          setAttendance((current) => existing
            ? current.map((item) => item.id === existing.id ? { ...item, ...record } : item)
            : [{ id: `AT-${Date.now()}`, ...record }, ...current])
        }
        setMessage(`Attendance saved for ${student.name}.`)
      } catch (error) {
        setMessage(`Attendance could not be saved: ${error.message}`)
      }
    }

    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <h2>Attendance</h2>
            <p>Find students by program, batch, school/category, subcategory, or search.</p>
          </div>
        </div>

        <div className="panel-card">
          <div className="filter-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <label>
              Date
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </label>
            <label>
              Search student
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or phone" />
            </label>
            <label>
              Program
              <select value={filterProgram} onChange={(event) => setFilterProgram(event.target.value)}>
                <option value="">All programs</option>
                {options.programs.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Batch
              <select value={filterBatch} onChange={(event) => setFilterBatch(event.target.value)}>
                <option value="">All batches</option>
                {options.batches.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              School / category
              <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
                <option value="">All categories</option>
                {options.categories.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Subcategory
              <select value={filterSubcategory} onChange={(event) => setFilterSubcategory(event.target.value)}>
                <option value="">All subcategories</option>
                {options.subcategories.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3>Students</h3>
            <span>{loading ? 'Loading...' : `${filteredStudents.length} student(s)`}</span>
          </div>
          <div className="students-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th><th>Program</th><th>Batch</th><th>Category</th><th>Subcategory</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const record = getStudentAttendance(student)
                  return (
                    <tr key={student.id}>
                      <td>{student.name}<br /><small>{student.contact || student.phone || student.email || '—'}</small></td>
                      <td>{student.program || '—'}</td>
                      <td>{student.batch || '—'}</td>
                      <td>{student.category || '—'}</td>
                      <td>{student.subcategory || '—'}</td>
                      <td>{record?.status || 'Not marked'}</td>
                      <td>
                        <button
                          className="button-secondary small"
                          type="button"
                          onClick={() => saveAttendance(student, record?.status === 'Present' ? 'Not Present' : 'Present')}
                        >
                          {record?.status === 'Present' ? 'Mark not present' : 'Mark present'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {message && <p className="form-note">{message}</p>}
        </div>
      </div>
    )
}
