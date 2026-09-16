import { useEffect, useMemo, useState } from 'react'
import { read, utils } from 'xlsx'
import { addCollectionItem, subscribeCollection } from '../services/firestoreService'
import { isFirebaseEnabled } from '../firebaseConfig'

const initialStudents = [
  { id: 'S001', name: 'Jahn Aknih', email: 'evolve@gmail.com', batch: '2023', category: 'Mechatronics' },
  { id: 'S002', name: 'James Kanchar', email: 'evolve@abc.com', batch: '2024', category: 'Robotics' },
  { id: 'S003', name: 'Jonas Math', email: 'evolve@gmail.com', batch: '2024', category: 'AI' },
]

export default function Students() {
  const [students, setStudents] = useState(initialStudents)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', email: '', batch: '', category: '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(!isFirebaseEnabled)

  useEffect(() => {
    if (!isFirebaseEnabled) return

    const unsubscribe = subscribeCollection(
      'students',
      (items) => {
        setStudents(items)
        setLoading(false)
      },
      () => setLoading(false),
    )

    return unsubscribe
  }, [])

  const filteredStudents = useMemo(() => {
    return students.filter((student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase()) ||
      student.batch.toLowerCase().includes(search.toLowerCase()),
    )
  }, [students, search])

  const handleAddStudent = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email) {
      setMessage('Name and email are required.')
      return
    }

    const newStudent = {
      name: form.name,
      email: form.email,
      batch: form.batch || 'Unassigned',
      category: form.category || 'General',
    }

    if (isFirebaseEnabled) {
      await addCollectionItem('students', newStudent)
      setMessage('Student creation requested. Firestore will sync shortly.')
    } else {
      const localStudent = {
        id: `S${String(students.length + 1).padStart(3, '0')}`,
        ...newStudent,
      }
      setStudents((current) => [localStudent, ...current])
      setMessage('Student added locally in demo mode.')
    }

    setForm({ name: '', email: '', batch: '', category: '' })
  }

  const handleFile = async (event) => {
    const [file] = event.target.files
    if (!file) return

    const data = await file.arrayBuffer()
    const workbook = read(data)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const imported = utils.sheet_to_json(sheet)

    const parsed = imported.map((item, index) => ({
      id: `XLS${Date.now()}-${index}`,
      name: item.Name || item.name || `Student ${index + 1}`,
      email: item.Email || item.email || '',
      batch: item.Batch || item.batch || 'N/A',
      category: item.Category || item.category || 'General',
    }))

    if (isFirebaseEnabled) {
      await Promise.all(parsed.map((student) => addCollectionItem('students', {
        name: student.name,
        email: student.email,
        batch: student.batch,
        category: student.category,
      })))
      setMessage(`${parsed.length} students imported to Firestore.`)
    } else {
      setStudents((current) => [...parsed, ...current])
      setMessage(`${parsed.length} students imported from Excel.`)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Students</h2>
          <p>Manage student profiles, import data, and access IDs.</p>
        </div>
        <div className="page-actions">
          <label className="button-secondary file-upload">
            Import Students (Excel)
            <input type="file" accept=".xlsx,.xls" onChange={handleFile} hidden />
          </label>
        </div>
      </div>

      <div className="panel split-panels">
        <div className="panel-card">
          <h3>Add student manually</h3>
          <form onSubmit={handleAddStudent} className="small-form">
            <label>
              Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Email
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" required />
            </label>
            <label>
              Batch
              <input value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} />
            </label>
            <label>
              Category
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </label>
            <button type="submit" className="button-primary">Add student</button>
            {message && <p className="form-note">{message}</p>}
          </form>
        </div>

        <div className="panel-card">
          <h3>Student list</h3>
          <div className="table-toolbar">
            <input
              type="search"
              placeholder="Search students"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {loading ? (
            <p>Loading students...</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Batch</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.batch}</td>
                    <td>{student.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
