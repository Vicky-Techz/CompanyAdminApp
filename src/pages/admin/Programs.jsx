import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCollection, subscribeCollection, addCollectionItem, deleteDocument, setCollectionItem } from '../../services/firestoreService'
import { isFirebaseEnabled, FIRESTORE_SEED_DATA, DEFAULT_CATEGORIES } from '../../config'

const fallbackPrograms = FIRESTORE_SEED_DATA.programs.filter((item) => item.type !== 'Category')
const fallbackCategories = FIRESTORE_SEED_DATA.categories || []

const mergeWithDefaultCategories = (items = []) => {
  const normalized = Array.isArray(items) ? items : []
  const byName = new Map(normalized.map((item) => [(item.name || item), item]))

  const defaults = DEFAULT_CATEGORIES.map((name) =>
    byName.has(name)
      ? byName.get(name)
      : fallbackCategories.find((cat) => cat.name === name) || { id: `DEF-${name}`, name, isDefault: true },
  )

  const extras = normalized.filter((item) => !DEFAULT_CATEGORIES.includes(item.name || item))
  return [...defaults, ...extras]
}

export default function Programs() {
  const navigate = useNavigate()
  const [programItems, setProgramItems] = useState(fallbackPrograms)
  const [categoryItems, setCategoryItems] = useState(fallbackCategories)
  const [loading, setLoading] = useState(!isFirebaseEnabled)
  const [newItemName, setNewItemName] = useState('')
  const [newItemType, setNewItemType] = useState('Program')
  const [message, setMessage] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [expandedCategories, setExpandedCategories] = useState({})

  useEffect(() => {
    if (!isFirebaseEnabled) return

    const loadData = async () => {
      const programs = await fetchCollection('programs')
      if (programs.length) {
        setProgramItems(programs.filter((item) => item.type !== 'Category'))
      }
      setLoading(false)

      const categories = await fetchCollection('categories')
      console.log('[Programs loadData] Fetched categories:', categories)
      if (categories.length) {
        const existingNames = categories.map((item) => (item.name || item).toLowerCase())
        const missingDefaults = DEFAULT_CATEGORIES.filter((name) => !existingNames.includes(name.toLowerCase()))
        console.log('[Programs loadData] Missing defaults:', missingDefaults)

        const createdDefaults = missingDefaults.length
          ? await Promise.all(
              missingDefaults.map((name) => addCollectionItem('categories', { name, isDefault: true })),
            )
          : []

        const merged = mergeWithDefaultCategories([...categories, ...createdDefaults])
        console.log('[Programs loadData] Merged categories:', merged)
        setCategoryItems(merged)
      } else {
        console.log('[Programs loadData] No categories, seeding defaults')
        const createdDefaults = await Promise.all(
          DEFAULT_CATEGORIES.map((name) => addCollectionItem('categories', { name, isDefault: true })),
        )
        const merged = mergeWithDefaultCategories(createdDefaults)
        console.log('[Programs loadData] Merged after seeding:', merged)
        setCategoryItems(merged)
      }
    }

    loadData().catch(() => {
      setCategoryItems(fallbackCategories)
      setLoading(false)
    })

    const unsubscribePrograms = subscribeCollection('programs', (items) => {
      setProgramItems(items.filter((item) => item.type !== 'Category'))
    })
    const unsubscribeCategories = subscribeCollection('categories', (items) => {
      console.log('[Programs subscribe] Categories from Firestore:', items)
      const result = items.length ? mergeWithDefaultCategories(items) : fallbackCategories
      console.log('[Programs subscribe] Merged result:', result)
      setCategoryItems(result)
    })

    return () => {
      unsubscribePrograms?.()
      unsubscribeCategories?.()
    }
  }, [])

  const handleAddItem = async (e) => {
    e?.preventDefault()
    const name = newItemName.trim()
    if (!name) return

    if (newItemType === 'Category') {
      if (categoryItems.some((item) => (item.name || item).toLowerCase() === name.toLowerCase())) {
        setMessage(`Category "${name}" already exists.`)
        setNewItemName('')
        return
      }

      if (isFirebaseEnabled) {
        try {
          const newCategory = await addCollectionItem('categories', { name })
          setCategoryItems((items) => mergeWithDefaultCategories([newCategory, ...items]))
          setMessage(`Category "${name}" added.`)
        } catch (err) {
          setMessage(`Failed to add category: ${err.message}`)
        }
      } else {
        setCategoryItems((items) => [{ id: `CAT${Date.now()}`, name }, ...items])
        setMessage(`Category "${name}" added locally.`)
      }
    } else {
      if (programItems.some((item) => item.type === newItemType && item.name.toLowerCase() === name.toLowerCase())) {
        setMessage(`${newItemType} "${name}" already exists.`)
        setNewItemName('')
        return
      }

      const payload = { name, type: newItemType }
      if (isFirebaseEnabled) {
        try {
          await addCollectionItem('programs', payload)
          setMessage(`${newItemType} "${name}" added.`)
        } catch (err) {
          setMessage(`Failed to add ${newItemType.toLowerCase()}: ${err.message}`)
        }
      } else {
        setProgramItems((items) => [{ id: `PRG${Date.now()}`, ...payload }, ...items])
        setMessage(`${newItemType} "${name}" added locally.`)
      }
    }

    setNewItemName('')
  }

  const handleDeleteItem = async (type, name) => {
    if (type === 'Category' && DEFAULT_CATEGORIES.includes(name)) {
      setMessage(`Cannot delete default category "${name}". Default categories are protected.`)
      return
    }

    if (!confirm(`Delete ${type.toLowerCase()} "${name}"?`)) return

    if (type === 'Category') {
      if (isFirebaseEnabled) {
        try {
          const items = await fetchCollection('categories')
          const item = items.find((item) => (item.name || item).toLowerCase() === name.toLowerCase())
          if (item) {
            await deleteDocument('categories', item.id)
            setMessage(`Category "${name}" delete requested.`)
          } else {
            setMessage(`Category "${name}" not found.`)
          }
        } catch (err) {
          setMessage(`Failed to delete category: ${err.message}`)
        }
      } else {
        setCategoryItems((items) => items.filter((item) => (item.name || item).toLowerCase() !== name.toLowerCase()))
        setMessage(`Category "${name}" removed locally.`)
      }
      return
    }

    if (isFirebaseEnabled) {
      try {
        const items = await fetchCollection('programs')
        const item = items.find((item) => item.type === type && (item.name || item).toLowerCase() === name.toLowerCase())
        if (item) {
          await deleteDocument('programs', item.id)
          setMessage(`${type} "${name}" delete requested.`)
        } else {
          setMessage(`${type} "${name}" not found.`)
        }
      } catch (err) {
        setMessage(`Failed to delete ${type.toLowerCase()}: ${err.message}`)
      }
    } else {
      setProgramItems((items) => items.filter((item) => !(item.type === type && (item.name || item).toLowerCase() === name.toLowerCase())))
      setMessage(`${type} "${name}" removed locally.`)
    }
  }

  const handleAddSubcategory = async (e) => {
    e?.preventDefault()
    if (!selectedCategoryId || !newSubcategoryName.trim()) {
      setMessage('Please select a category and enter a subcategory name.')
      return
    }

    const subname = newSubcategoryName.trim()
    const category = categoryItems.find((item) => item.id === selectedCategoryId)
    if (!category) {
      setMessage('Category not found.')
      return
    }

    if ((category.subcategories || []).some((s) => s.toLowerCase() === subname.toLowerCase())) {
      setMessage(`Subcategory "${subname}" already exists in this category.`)
      setNewSubcategoryName('')
      return
    }

    const updated = {
      ...category,
      subcategories: [...(category.subcategories || []), subname],
    }

    if (isFirebaseEnabled) {
      try {
        await setCollectionItem('categories', selectedCategoryId, updated)
        setCategoryItems((items) =>
          items.map((item) =>
            item.id === selectedCategoryId ? updated : item,
          ),
        )
        setMessage(`Subcategory "${subname}" added.`)
      } catch (err) {
        setMessage(`Failed to add subcategory: ${err.message}`)
      }
    } else {
      setCategoryItems((items) =>
        items.map((item) =>
          item.id === selectedCategoryId
            ? { ...item, subcategories: [...(item.subcategories || []), subname] }
            : item,
        ),
      )
      setMessage(`Subcategory "${subname}" added locally.`)
    }

    setNewSubcategoryName('')
  }

  const handleDeleteSubcategory = async (categoryId, subcategoryName) => {
    if (!confirm(`Delete subcategory "${subcategoryName}"?`)) return

    const category = categoryItems.find((item) => item.id === categoryId)
    if (!category) {
      setMessage('Category not found.')
      return
    }

    const updated = {
      ...category,
      subcategories: (category.subcategories || []).filter((s) => s !== subcategoryName),
    }

    if (isFirebaseEnabled) {
      try {
        await setCollectionItem('categories', categoryId, updated)
        setMessage(`Subcategory "${subcategoryName}" delete requested.`)
      } catch (err) {
        setMessage(`Failed to delete subcategory: ${err.message}`)
      }
    } else {
      setCategoryItems((items) =>
        items.map((item) =>
          item.id === categoryId
            ? {
                ...item,
                subcategories: (item.subcategories || []).filter((s) => s !== subcategoryName),
              }
            : item,
        ),
      )
      setMessage(`Subcategory "${subcategoryName}" removed locally.`)
    }
  }

  const toggleCategoryExpanded = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  const handleSubcategoryClick = (categoryName, subcategoryName) => {
    navigate(`/students?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`)
  }

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
          <h3>Add new item</h3>
        </div>
        <div className="form-grid-three">
          <input
            type="text"
            placeholder="Name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <select value={newItemType} onChange={(e) => setNewItemType(e.target.value)}>
            <option value="Program">Program</option>
            <option value="Batch">Batch</option>
            <option value="Category">Category</option>
          </select>
          <button className="button-primary" onClick={handleAddItem}>Add</button>
        </div>
        {message && <p className="form-note">{message}</p>}
      </div>

      <div className="panel split-panels">
        <div className="panel-card">
          <div className="panel-header">
            <h3>Programs / Batches</h3>
            <span>{loading ? 'Loading...' : `${programItems.length} items`}</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {programItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.type}</td>
                  <td>
                    <button className="button-danger small" onClick={() => handleDeleteItem(item.type, item.name)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3>Categories & Subcategories</h3>
            <span>{loading ? 'Loading...' : `${categoryItems.length} categories`}</span>
          </div>

          <div className="form-grid-three" style={{ marginBottom: '1rem' }}>
            <select value={selectedCategoryId || ''} onChange={(e) => setSelectedCategoryId(e.target.value || null)}>
              <option value="">Select category for subcategory</option>
              {categoryItems.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Subcategory name"
              value={newSubcategoryName}
              onChange={(e) => setNewSubcategoryName(e.target.value)}
            />
            <button className="button-primary" onClick={handleAddSubcategory}>Add Subcategory</button>
          </div>

          <div className="list-items">
            {categoryItems.map((item) => {
              const isDefaultCategory = DEFAULT_CATEGORIES.includes(item.name || item)
              return (
                <div key={item.id ?? item}>
                  <div className="list-row" style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    <span onClick={() => toggleCategoryExpanded(item.id)} style={{ flex: 1 }}>
                      {expandedCategories[item.id] ? '▼' : '▶'} {item.name || item}
                      {isDefaultCategory && (
                        <span
                          style={{
                            marginLeft: '8px',
                            fontSize: '11px',
                            backgroundColor: '#8f5eff',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            display: 'inline-block',
                          }}
                        >
                          Default
                        </span>
                      )}
                    </span>
                    <button
                      className="button-danger small"
                      onClick={() => handleDeleteItem('Category', item.name || item)}
                      disabled={isDefaultCategory}
                      style={{ opacity: isDefaultCategory ? 0.5 : 1, cursor: isDefaultCategory ? 'not-allowed' : 'pointer' }}
                      title={isDefaultCategory ? 'Cannot delete default categories' : ''}
                    >
                      Delete
                    </button>
                  </div>

                  {expandedCategories[item.id] && (item.subcategories || []).length > 0 && (
                    <div style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                      {(item.subcategories || []).map((subcat, idx) => (
                      <div key={idx} className="list-row" style={{ padding: '0.5rem 0', cursor: 'pointer' }}>
                        <span style={{ fontSize: '0.9rem', color: '#0066cc' }} onClick={() => handleSubcategoryClick(item.name, subcat)}>
                          ├─ {subcat}
                        </span>
                        <button
                          className="button-danger small"
                          onClick={() => handleDeleteSubcategory(item.id, subcat)}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {expandedCategories[item.id] && (!item.subcategories || item.subcategories.length === 0) && (
                  <div style={{ marginLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                    No subcategories yet
                  </div>
                )}
              </div>
            )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
