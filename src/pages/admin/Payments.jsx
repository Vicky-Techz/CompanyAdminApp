import { useEffect, useState } from 'react'
import { addCollectionItem, fetchCollection, fetchDocument, setCollectionItem, subscribeCollection } from '../../services/firestoreService'
import { isFirebaseEnabled } from '../../config'

const getToday = () => new Date().toISOString().slice(0, 10)

export default function Payments() {
  const [receipts, setReceipts] = useState([])
  const [students, setStudents] = useState([])
  const [studentSearch, setStudentSearch] = useState('')
  const [form, setForm] = useState({
    studentId: '',
    amount: '',
    paymentType: 'Installment',
    paymentDate: getToday(),
  })
  const [message, setMessage] = useState('')

  const matchingStudents = studentSearch.trim()
    ? students.filter((student) => {
      const searchValue = studentSearch.toLowerCase()
      return [student.name, student.email, student.batch, student.category]
        .some((value) => String(value || '').toLowerCase().includes(searchValue))
    }).slice(0, 8)
    : []

  useEffect(() => {
    if (!isFirebaseEnabled) {
      return
    }

    fetchCollection('receipts').then((items) => setReceipts(items)).catch(() => {})
    fetchCollection('students').then((items) => {
      if (items.length) setStudents(items)
    }).catch(() => {})

    const unsubscribe = subscribeCollection('receipts', (items) => {
      setReceipts(items)
    })
    const unsubscribeStudents = subscribeCollection('students', (items) => {
      setStudents(items)
    })

    return () => {
      unsubscribe?.()
      unsubscribeStudents?.()
    }
  }, [])

  const handleAddPayment = async (event) => {
    event.preventDefault()
    const selectedStudent = students.find((student) => student.id === form.studentId)
    const amount = Number(form.amount)

    if (!selectedStudent || !amount || amount <= 0 || !form.paymentDate) {
      setMessage('Select a student and enter a valid amount and date.')
      return
    }

    const payment = {
      studentId: selectedStudent.id,
      student: selectedStudent.name,
      amount,
      paymentType: form.paymentType,
      paymentDate: form.paymentDate,
    }

    try {
      if (isFirebaseEnabled) {
        const savedPayment = await addCollectionItem('receipts', payment)
        setReceipts((current) => [savedPayment, ...current])
        const latestStudent = await fetchDocument('students', selectedStudent.id)
        const paidFee = Number(latestStudent?.paidFee || selectedStudent.paidFee || 0) + amount
        await setCollectionItem('students', selectedStudent.id, {
          paidFee,
          lastPaymentDate: form.paymentDate,
        })
        setStudents((current) => current.map((student) => (
          student.id === selectedStudent.id
            ? { ...student, paidFee, lastPaymentDate: form.paymentDate }
            : student
        )))
        setMessage('Payment and paid fee saved to Firebase.')
      } else {
        const paidFee = Number(selectedStudent.paidFee || 0) + amount
        setReceipts((current) => [{ id: `R-${Date.now()}`, ...payment }, ...current])
        setStudents((current) => current.map((student) => (
          student.id === selectedStudent.id ? { ...student, paidFee, lastPaymentDate: form.paymentDate } : student
        )))
        setMessage('Payment added locally in demo mode.')
      }

      setForm((current) => ({ ...current, amount: '', paymentDate: getToday() }))
      setStudentSearch('')
    } catch (error) {
      setMessage(`Payment could not be saved: ${error.message}`)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Payments & Receipts</h2>
          <p>Receipt generation and payment tracking for student enrollments.</p>
        </div>
      </div>
      <div className="panel-card">
        <h3>Add payment</h3>
        <form onSubmit={handleAddPayment} className="small-form">
          <div className="form-grid-two">
            <div className="payment-student-search">
              <label htmlFor="payment-student-search">Student</label>
              <input
                id="payment-student-search"
                value={studentSearch}
                onChange={(event) => {
                  setStudentSearch(event.target.value)
                  setForm((current) => ({ ...current, studentId: '' }))
                }}
                placeholder="Search by name, email, batch..."
                autoComplete="off"
                required={!form.studentId}
              />
              {matchingStudents.length > 0 && (
                <div className="payment-student-suggestions">
                  {matchingStudents.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      className="payment-student-suggestion"
                      onClick={() => {
                        setStudentSearch(student.name)
                        setForm((current) => ({ ...current, studentId: student.id }))
                      }}
                    >
                      <strong>{student.name}</strong>
                      <span>{student.email || 'No email'} · {student.batch || 'No batch'}</span>
                    </button>
                  ))}
                </div>
              )}
              {form.studentId && <small className="selected-student-note">Student selected</small>}
            </div>
            <label>
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                placeholder="Enter amount"
                required
              />
            </label>
          </div>
          <div className="form-grid-two">
            <label>
              Payment type
              <select
                value={form.paymentType}
                onChange={(event) => setForm({ ...form, paymentType: event.target.value })}
              >
                <option value="Installment">Installment</option>
                <option value="Bulk">Bulk payment</option>
              </select>
            </label>
            <label>
              Payment date
              <input
                type="date"
                value={form.paymentDate}
                onChange={(event) => setForm({ ...form, paymentDate: event.target.value })}
                required
              />
            </label>
          </div>
          <button type="submit" className="button-primary">Save payment</button>
          {message && <p className="form-note">{message}</p>}
        </form>
      </div>
      <div className="panel-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Receipt</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((receipt) => (
              <tr key={receipt.id}>
                <td>{receipt.student}</td>
                <td>{receipt.id}</td>
                <td>{receipt.amount}</td>
                <td>{receipt.paymentType || '—'}</td>
                <td>{receipt.paymentDate || '—'}</td>
                <td><button className="button-secondary">Print</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
