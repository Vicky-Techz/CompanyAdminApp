import { useEffect, useState } from 'react'
import { fetchCollection, subscribeCollection } from '../../services/firestoreService'
import { isFirebaseEnabled, FIRESTORE_SEED_DATA } from '../../config'

const fallbackReceipts = FIRESTORE_SEED_DATA.receipts

export default function Payments() {
  const [receipts, setReceipts] = useState(fallbackReceipts)

  useEffect(() => {
    if (!isFirebaseEnabled) {
      return
    }

    fetchCollection('receipts').then((items) => {
      if (items.length) {
        setReceipts(items)
      }
    })

    const unsubscribe = subscribeCollection('receipts', (items) => {
      if (items.length) {
        setReceipts(items)
      }
    })

    return unsubscribe
  }, [])

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Payments & Receipts</h2>
          <p>Receipt generation and payment tracking for student enrollments.</p>
        </div>
      </div>
      <div className="panel-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Receipt</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((receipt) => (
              <tr key={receipt.id}>
                <td>{receipt.student}</td>
                <td>{receipt.id}</td>
                <td>{receipt.amount}</td>
                <td><button className="button-secondary">Print</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
