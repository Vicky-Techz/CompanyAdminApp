import { useEffect, useMemo, useState } from 'react'
import { read, utils } from 'xlsx'
import { addCollectionItem, subscribeCollection } from '../../services/firestoreService'
import { isFirebaseEnabled, FIRESTORE_SEED_DATA } from '../../config'

const initialStudents = FIRESTORE_SEED_DATA.students

export default function Students() {
  const [students, setStudents] = useState(initialStudents)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    name: '',
    parentName: '',
    age: '',
    dob: '',
    gender: '',
    contact: '',
    email: '',
    batch: '',
    category: '',
    completionDate: '',
    notes: '',
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseEnabled) {
      setLoading(false)
      return
    }

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

  const computeAge = (student) => {
    // Prefer DOB if available, otherwise use provided age
    if (student?.dob) {
      try {
        const dob = new Date(student.dob)
        if (!isNaN(dob)) {
          const diff = Date.now() - dob.getTime()
          const ageDt = new Date(diff)
          return Math.abs(ageDt.getUTCFullYear() - 1970)
        }
      } catch (e) {
        // fall through
      }
    }
    return student?.age || '—'
  }

  const handleAddStudent = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email) {
      setMessage('Name and email are required.')
      return
    }

    const newStudent = {
      name: form.name,
      parentName: form.parentName,
      age: form.age,
      dob: form.dob,
      gender: form.gender,
      contact: form.contact,
      email: form.email,
      batch: form.batch || 'Unassigned',
      category: form.category || 'General',
      joiningDate: new Date().toISOString().slice(0, 10),
      completionDate: form.completionDate || '',
      notes: form.notes,
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

    setForm({
      name: '',
      parentName: '',
      age: '',
      dob: '',
      gender: '',
      contact: '',
      email: '',
      batch: '',
      category: '',
      completionDate: '',
      notes: '',
    })
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
      joiningDate: item.JoiningDate || item.joiningDate || new Date().toISOString().slice(0, 10),
      completionDate: item.CompletionDate || item.completionDate || '',
    }))

    if (isFirebaseEnabled) {
      await Promise.all(parsed.map((student) => addCollectionItem('students', {
        name: student.name,
        email: student.email,
        batch: student.batch,
        category: student.category,
        joiningDate: student.joiningDate,
        completionDate: student.completionDate,
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
              Parent / Guardian
              <input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
            </label>
            <div className="form-grid-two">
              <label>
                Age
                <input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} type="number" min="1" />
              </label>
              <label>
                Date of birth
                <input value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} type="date" />
              </label>
            </div>
            <div className="form-grid-two">
              <label>
                Gender
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </label>
              <label>
                Contact number
                <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} type="tel" />
              </label>
            </div>
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
            <label>
              Completion date
              <input value={form.completionDate} onChange={(e) => setForm({ ...form, completionDate: e.target.value })} type="date" />
            </label>
            <label>
              Notes / other details
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows="3" />
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
              onChange={(e) => setSearch(e.target.value)}
            />
            <small>{filteredStudents.length} result(s)</small>
          </div>

          {loading ? (
            <p>Loading students...</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Parent</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Batch</th>
                  <th>Category</th>
                  <th>Joining</th>
                  <th>Completion</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>{student.name}</td>
                    <td>{student.parentName || '—'}</td>
                    <td>{student.email}</td>
                    <td>{student.contact || '—'}</td>
                    <td>{student.batch}</td>
                    <td>{student.category}</td>
                    <td>{student.joiningDate || '—'}</td>
                    <td>{student.completionDate || '—'}</td>
                    <td>{computeAge(student)}</td>
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
