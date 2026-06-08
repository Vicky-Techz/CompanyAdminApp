import { useEffect, useState } from 'react'
import { fetchCollection, subscribeCollection } from '../services/firestoreService'
import { isFirebaseEnabled } from '../firebaseConfig'

const fallbackPrograms = [
  { id: 'P001', name: 'Robotics Fundamentals', type: 'Program' },
  { id: 'B001', name: 'Batch Spring 2025', type: 'Batch' },
  { id: 'C001', name: 'Category A', type: 'Category' },
]

export default function Programs() {
  const [programItems, setProgramItems] = useState(fallbackPrograms)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseEnabled) {
      setLoading(false)
      return
    }

    fetchCollection('programs').then((items) => {
      if (items.length) {
        setProgramItems(items)
      }
      setLoading(false)
    })

    const unsubscribe = subscribeCollection('programs', (items) => {
      if (items.length) {
        setProgramItems(items)
      }
    })

    return unsubscribe
  }, [])

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Programs / Batch / Category</h2>
          <p>Manage program hierarchy and batch categories.</p>
        </div>
      </div>
      <div className="panel-card">
        <div className="panel-header">
          <h3>Program hierarchy</h3>
          <span>{loading ? 'Loading...' : `${programItems.length} entries`}</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {programItems.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
