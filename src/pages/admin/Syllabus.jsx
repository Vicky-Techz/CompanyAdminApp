import { useEffect, useState } from 'react'
import { addCollectionItem, fetchCollection, subscribeCollection } from '../../services/firestoreService'
import { isFirebaseEnabled } from '../../config'

const fallbackSyllabuses = []

export default function Syllabus() {
  const [syllabuses, setSyllabuses] = useState(fallbackSyllabuses)
  const [form, setForm] = useState({ courseName: '', syllabus: '' })
  const [fileName, setFileName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(!isFirebaseEnabled)

  useEffect(() => {
    if (!isFirebaseEnabled) return

    fetchCollection('syllabuses')
      .then((items) => setSyllabuses(items))
      .catch(() => {})
      .finally(() => setLoading(false))

    const unsubscribe = subscribeCollection('syllabuses', (items) => {
      setSyllabuses(items)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const handleUpload = async (event) => {
    const [file] = event.target.files
    if (!file) return

    try {
      const syllabus = await file.text()
      setForm((current) => ({ ...current, syllabus }))
      setFileName(file.name)
      setMessage('Syllabus loaded. Add a course name and save it.')
    } catch (error) {
      setMessage(`Syllabus could not be loaded: ${error.message}`)
    }
    event.target.value = ''
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!form.courseName.trim() || !form.syllabus.trim()) {
      setMessage('Course name and syllabus are required.')
      return
    }

    const syllabusRecord = {
      courseName: form.courseName.trim(),
      syllabus: form.syllabus.trim(),
      fileName: fileName || 'Manually entered syllabus',
    }

    try {
      if (isFirebaseEnabled) {
        const saved = await addCollectionItem('syllabuses', syllabusRecord)
        setSyllabuses((current) => [saved, ...current])
        setMessage('Syllabus saved to Firebase.')
      } else {
        setSyllabuses((current) => [{ id: `SY-${Date.now()}`, ...syllabusRecord }, ...current])
        setMessage('Syllabus added locally in demo mode.')
      }
      setForm({ courseName: '', syllabus: '' })
      setFileName('')
    } catch (error) {
      setMessage(`Syllabus could not be saved: ${error.message}`)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Syllabus</h2>
          <p>Upload course syllabuses and assign them while adding students.</p>
        </div>
      </div>

      <div className="panel-card">
        <h3>Add course syllabus</h3>
        <form onSubmit={handleSave} className="small-form">
          <label>
            Course or program name
            <input
              value={form.courseName}
              onChange={(event) => setForm({ ...form, courseName: event.target.value })}
              placeholder="Example: Robotics Fundamentals"
              required
            />
          </label>
          <label>
            Syllabus content
            <textarea
              value={form.syllabus}
              onChange={(event) => setForm({ ...form, syllabus: event.target.value })}
              rows="8"
              placeholder="Add one topic per line, or upload a text syllabus"
              required
            />
          </label>
          <label className="button-secondary file-upload syllabus-upload">
            Upload syllabus file
            <input type="file" accept=".txt,.md,.csv" onChange={handleUpload} hidden />
          </label>
          {fileName && <small className="form-note">Selected: {fileName}</small>}
          <button type="submit" className="button-primary">Save syllabus</button>
          {message && <p className="form-note">{message}</p>}
        </form>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <h3>Uploaded syllabuses</h3>
          <span>{loading ? 'Loading...' : `${syllabuses.length} courses`}</span>
        </div>
        {syllabuses.length === 0 ? (
          <p className="form-note">No syllabuses uploaded yet.</p>
        ) : (
          <div className="students-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>File</th>
                  <th>Topics</th>
                </tr>
              </thead>
              <tbody>
                {syllabuses.map((item) => (
                  <tr key={item.id}>
                    <td>{item.courseName}</td>
                    <td>{item.fileName || '—'}</td>
                    <td>{item.syllabus}</td>
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
