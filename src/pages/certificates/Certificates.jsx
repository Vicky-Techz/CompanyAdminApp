import { useEffect, useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import { fetchCollection } from '../../services/firestoreService'
import { isFirebaseEnabled, DEFAULT_CERTIFICATE_TEMPLATE } from '../../config'

export default function Certificates() {
  const [selected, setSelected] = useState([])
  const [template, setTemplate] = useState(DEFAULT_CERTIFICATE_TEMPLATE)
  const [message, setMessage] = useState('')
  const [students, setStudents] = useState([])

  useEffect(() => {
    if (!isFirebaseEnabled) {
      return
    }

    fetchCollection('students').then((items) => {
      const certificateStudents = items.map((item) => ({
          id: item.id,
          name: item.name || 'Unnamed Student',
          email: item.email || 'unknown@example.com',
          certificate: item.certificate || 'Program Completion',
        }))
        setStudents(certificateStudents)
    })
  }, [])

  const toggleSelection = (id) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const selectedStudents = useMemo(() => students.filter((student) => selected.includes(student.id)), [selected, students])

  const sampleTemplate = DEFAULT_CERTIFICATE_TEMPLATE

  const handleUploadTemplate = async (event) => {
    const [file] = event.target.files
    if (!file) return
    const text = await file.text()
    try {
      const json = JSON.parse(text)
      setTemplate((current) => ({ ...current, ...json }))
      setMessage('Certificate template loaded successfully.')
    } catch {
      setMessage('Invalid JSON template file.')
    }
  }

  const downloadSampleTemplate = () => {
    const blob = new Blob([JSON.stringify(sampleTemplate, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'certificate-template-sample.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const generatePdf = async () => {
    if (!selectedStudents.length) {
      setMessage('Select at least one student to generate certificates.')
      return
    }

    const doc = new jsPDF({ unit: 'px', format: 'a4' })
    selectedStudents.forEach((student, index) => {
      if (index > 0) doc.addPage()
      doc.setFontSize(22)
      doc.text(template.title, 80, 120)
      doc.setFontSize(16)
      doc.text(`This certifies that ${student.name}`, 80, 180)
      doc.text(`for completing ${student.certificate}`, 80, 220)
      doc.setFontSize(12)
      doc.text(template.footer, 80, 280)
    })
    doc.save('certificates.pdf')
    setMessage('PDF generated successfully.')
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Certificates</h2>
          <p>Generate single or bulk certificates with template support.</p>
        </div>
        <div className="page-actions">
          <label className="button-secondary file-upload">
            Upload JSON Template
            <input type="file" accept="application/json" onChange={handleUploadTemplate} hidden />
          </label>
          <button type="button" className="button-secondary" onClick={downloadSampleTemplate}>
            Download Sample Template
          </button>
          <button type="button" className="button-primary" onClick={generatePdf}>Bulk PDF Generation</button>
        </div>
      </div>

      <div className="panel-card">
        <div className="table-toolbar">
          <p>{selected.length} student(s) selected</p>
          <small>{message}</small>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Email</th>
              <th>Certificate</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(student.id)}
                    onChange={() => toggleSelection(student.id)}
                  />
                </td>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{student.certificate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
