import { useEffect, useState } from 'react'
import { fetchCollection, subscribeCollection } from '../../services/firestoreService'
import { isFirebaseEnabled, FIRESTORE_SEED_DATA } from '../../config'

const fallbackPrograms = FIRESTORE_SEED_DATA.programs

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
