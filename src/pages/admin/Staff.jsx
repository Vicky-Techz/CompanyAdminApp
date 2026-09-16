import { useEffect, useState } from 'react'
import { fetchCollection, subscribeCollection, addCollectionItem } from '../../services/firestoreService'
import { auth, isFirebaseEnabled, FIRESTORE_SEED_DATA } from '../../config'
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'

const fallbackStaff = FIRESTORE_SEED_DATA.staff

export default function Staff() {
  const [staff, setStaff] = useState(fallbackStaff)
  const [form, setForm] = useState({
    name: '',
    email: '',
    contact: '',
    address: '',
    role: '',
    dob: '',
    gender: '',
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(!isFirebaseEnabled)

  useEffect(() => {
    if (!isFirebaseEnabled) return

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

  const generateTemporaryPassword = () => `Temp-${Math.random().toString(36).slice(2, 10)}!`

  const handleAddStaff = async (event) => {
    event.preventDefault()
    if (!form.name || !form.email || !form.role) {
      setMessage('Name, email and role are required.')
      return
    }

    const newStaff = {
      name: form.name,
      email: form.email,
      contact: form.contact,
      address: form.address,
      role: form.role,
      dob: form.dob,
      gender: form.gender,
      status: 'Pending Approval',
      createdAt: new Date().toISOString(),
    }

    if (isFirebaseEnabled) {
      try {
        const savedStaff = await addCollectionItem('staff', newStaff)
        setStaff((current) => [savedStaff, ...current])

        const temporaryPassword = generateTemporaryPassword()
        await createUserWithEmailAndPassword(auth, form.email.trim(), temporaryPassword)
        await sendPasswordResetEmail(auth, form.email.trim())
        setMessage('Staff added and reset email has been sent.')
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          try {
            await sendPasswordResetEmail(auth, form.email.trim())
            setMessage('Staff record created. Reset email has been sent to the existing auth account.')
          } catch (resetErr) {
            console.error('Password reset send failed', resetErr)
            setMessage('Staff record created, but reset email could not be sent. Please verify auth settings.')
          }
        } else {
          console.error('Staff creation error', err)
          setMessage(`Staff record saved, but the auth account could not be created: ${err.message}`)
        }
      }
    } else {
      const localStaff = {
        id: `ST${String(staff.length + 1).padStart(3, '0')}`,
        ...newStaff,
      }
      setStaff((current) => [localStaff, ...current])
      setMessage('Staff added locally in demo mode.')
    }

    setForm({
      name: '',
      email: '',
      contact: '',
      address: '',
      role: '',
      dob: '',
      gender: '',
    })
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Staff & Approval</h2>
          <p>Create, review, and manage staff approval flows.</p>
        </div>
      </div>
      <div className="panel-card">
        <h3>Add staff member</h3>
        <form onSubmit={handleAddStaff} className="small-form">
          <label>
            Name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              type="email"
              required
            />
          </label>
          <div className="form-grid-two">
            <label>
              Contact number
              <input
                value={form.contact}
                onChange={(event) => setForm({ ...form, contact: event.target.value })}
                type="tel"
              />
            </label>
            <label>
              Role
              <input
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
                required
              />
            </label>
          </div>
          <div className="form-grid-two">
            <label>
              Date of birth
              <input
                value={form.dob}
                onChange={(event) => setForm({ ...form, dob: event.target.value })}
                type="date"
              />
            </label>
            <label>
              Gender
              <select
                value={form.gender}
                onChange={(event) => setForm({ ...form, gender: event.target.value })}
              >
                <option value="">Select gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </label>
          </div>
          <label>
            Address
            <textarea
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              rows="3"
            />
          </label>
          <button type="submit" className="button-primary">
            Create staff
          </button>
          {message && <p className="form-note">{message}</p>}
        </form>
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
