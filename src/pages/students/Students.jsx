import { startTransition, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { read, utils } from 'xlsx'
import { addCollectionItem, subscribeCollection, fetchCollection, setCollectionItem, deleteDocument } from '../../services/firestoreService'
import { isFirebaseEnabled, FIRESTORE_SEED_DATA, DEFAULT_CATEGORIES } from '../../config'

const initialStudents = []
const fallbackCategories = []
const fallbackSyllabuses = []

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

export default function Students() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [students, setStudents] = useState(initialStudents)
  const [search, setSearch] = useState('')
  const editStudentId = searchParams.get('edit')
  const filterCategory = searchParams.get('category')
  const filterSubcategory = searchParams.get('subcategory')
  const [filterBatch, setFilterBatch] = useState('')
  const [filterProgram, setFilterProgram] = useState('')
  const [form, setForm] = useState({
    name: '',
    parentName: '',
    age: '',
    dob: '',
    gender: '',
    contact: '',
    email: '',
    batch: '',
    program: '',
    syllabusId: '',
    syllabusName: '',
    syllabusContent: '',
    totalCourseFee: '',
    category: '',
    subcategory: '',
    completionDate: '',
    notes: '',
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(!isFirebaseEnabled)
  const [categoryObjects, setCategoryObjects] = useState(FIRESTORE_SEED_DATA.categories || [])
  const [categories, setCategories] = useState((FIRESTORE_SEED_DATA.categories || []).map((c) => c.name))
  const initialPrograms = FIRESTORE_SEED_DATA.programs?.filter((p) => p.type === 'Program').map((p) => p.name) || []
  const initialBatches = FIRESTORE_SEED_DATA.programs?.filter((p) => p.type === 'Batch').map((p) => p.name) || []
  const [programs, setPrograms] = useState(initialPrograms)
  const [batches, setBatches] = useState(initialBatches)
  const [syllabuses, setSyllabuses] = useState(fallbackSyllabuses)
  const [editingId, setEditingId] = useState(null)
  const [newOptionNames, setNewOptionNames] = useState({ category: '', subcategory: '', program: '', batch: '' })
  const [activeAddOption, setActiveAddOption] = useState('')

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

  useEffect(() => {
    if (!isFirebaseEnabled) return

    // initial fetch
    fetchCollection('categories')
      .then((items) => {
        if (items && items.length) {
          const merged = mergeWithDefaultCategories(items)
          setCategoryObjects(merged)
          setCategories(merged.map((c) => c.name || c))
        }
      })
      .catch(() => {
        setCategoryObjects(fallbackCategories)
        setCategories(fallbackCategories.map((c) => c.name))
      })

    // fetch programs/batches collection if present
    fetchCollection('programs')
      .then((items) => {
        if (items && items.length) {
          setPrograms(items.filter((it) => it.type === 'Program').map((p) => p.name || p))
          setBatches(items.filter((it) => it.type === 'Batch').map((p) => p.name || p))
        }
      })
      .catch(() => {})

    // realtime updates
    const unsubCats = subscribeCollection('categories', (items) => {
      if (items && items.length) {
        const merged = mergeWithDefaultCategories(items)
        setCategoryObjects(merged)
        setCategories(merged.map((c) => c.name || c))
      }
    })
    const unsubPrograms = subscribeCollection('programs', (items) => {
      if (items && items.length) {
        setPrograms(items.filter((it) => it.type === 'Program').map((p) => p.name || p))
        setBatches(items.filter((it) => it.type === 'Batch').map((p) => p.name || p))
      }
    })
    const unsubSyllabuses = subscribeCollection('syllabuses', (items) => {
      setSyllabuses(items)
    })
    fetchCollection('syllabuses')
      .then((items) => setSyllabuses(items))
      .catch(() => {})

    return () => {
      unsubCats?.()
      unsubPrograms?.()
      unsubSyllabuses?.()
    }
  }, [])

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Check search filter
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase()) ||
        student.batch.toLowerCase().includes(search.toLowerCase())

      // Check category filter
      const matchesCategory = !filterCategory || student.category === filterCategory

      // Check subcategory filter
      const matchesSubcategory = !filterSubcategory || student.subcategory === filterSubcategory

      // Check batch filter
      const matchesBatch = !filterBatch || student.batch === filterBatch

      // Check program filter
      const matchesProgram = !filterProgram || student.program === filterProgram

      return matchesSearch && matchesCategory && matchesSubcategory && matchesBatch && matchesProgram
    })
  }, [students, search, filterCategory, filterSubcategory, filterBatch, filterProgram])

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
      program: form.program || '',
      syllabusId: form.syllabusId || '',
      syllabusName: form.syllabusName || '',
      syllabusContent: form.syllabusContent || '',
      totalCourseFee: form.totalCourseFee ? Number(form.totalCourseFee) : 0,
      category: form.category || 'General',
      subcategory: form.subcategory || '',
      joiningDate: new Date().toISOString().slice(0, 10),
      completionDate: form.completionDate || '',
      paidFee: 0,
      notes: form.notes,
    }

    // If editing, update existing document
    if (editingId) {
      if (isFirebaseEnabled) {
        await setCollectionItem('students', editingId, newStudent)
        setMessage('Student updated. Firestore will sync shortly.')
      } else {
        setStudents((current) => current.map((s) => (s.id === editingId ? { ...s, ...newStudent } : s)))
        setMessage('Student updated locally.')
      }
      setEditingId(null)
    } else {
      if (isFirebaseEnabled) {
        try {
          await addCollectionItem('students', newStudent)
          const savedStudents = await fetchCollection('students')
          setStudents(savedStudents)
          setMessage('Student saved to Firebase Firestore.')
        } catch (err) {
          console.error('Student save failed', err)
          setMessage(`Student was not saved to Firebase: ${err.message}`)
          return
        }
      } else {
        const localStudent = {
          id: `S${String(students.length + 1).padStart(3, '0')}`,
          ...newStudent,
        }
        setStudents((current) => [localStudent, ...current])
        setMessage('Student added locally in demo mode.')
      }
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
      program: '',
      syllabusId: '',
      syllabusName: '',
      syllabusContent: '',
      totalCourseFee: '',
      category: '',
      completionDate: '',
      notes: '',
    })
  }

  const handleEdit = (student) => {
    setEditingId(student.id)
    setForm({
      name: student.name || '',
      parentName: student.parentName || '',
      age: student.age || '',
      dob: student.dob || '',
      gender: student.gender || '',
      contact: student.contact || '',
      email: student.email || '',
      batch: student.batch || '',
      program: student.program || '',
      syllabusId: student.syllabusId || '',
      syllabusName: student.syllabusName || '',
      syllabusContent: student.syllabusContent || '',
      totalCourseFee: student.totalCourseFee ?? '',
      category: student.category || '',
      subcategory: student.subcategory || '',
      completionDate: student.completionDate || '',
      notes: student.notes || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!editStudentId) return
    const studentToEdit = students.find((student) => student.id === editStudentId)
    if (studentToEdit && editingId !== editStudentId) {
      startTransition(() => handleEdit(studentToEdit))
    }
  }, [students, editStudentId, editingId])

  const handleDelete = async (id) => {
    if (!confirm('Delete this student? This cannot be undone.')) return
    if (isFirebaseEnabled) {
      try {
        await deleteDocument('students', id)
        setMessage('Student delete requested.')
      } catch (err) {
        setMessage(`Failed to delete: ${err.message}`)
      }
    } else {
      setStudents((current) => current.filter((s) => s.id !== id))
      setMessage('Student removed locally.')
    }
  }

  const handleAddOption = async (type) => {
    const name = newOptionNames[type].trim()
    if (!name) return

    try {
      if (type === 'category') {
        if (categories.some((category) => category.toLowerCase() === name.toLowerCase())) {
          setMessage(`Category "${name}" already exists.`)
          return
        }

        const category = isFirebaseEnabled
          ? await addCollectionItem('categories', { name, isDefault: false, subcategories: [] })
          : { id: `CAT${Date.now()}`, name, isDefault: false, subcategories: [] }
        setCategoryObjects((items) => [...items, category])
        setCategories((items) => [...items, name])
        setForm((current) => ({ ...current, category: name, subcategory: '' }))
      } else if (type === 'subcategory') {
        if (!form.category) {
          setMessage('Select a category before adding a subcategory.')
          return
        }

        const category = categoryObjects.find((item) => item.name === form.category)
        const subcategories = category?.subcategories || []
        if (subcategories.some((subcategory) => subcategory.toLowerCase() === name.toLowerCase())) {
          setMessage(`Subcategory "${name}" already exists.`)
          return
        }

        const updatedCategory = { ...category, name: form.category, subcategories: [...subcategories, name] }
        if (isFirebaseEnabled) {
          if (category?.id && !String(category.id).startsWith('DEF-')) {
            await setCollectionItem('categories', category.id, updatedCategory)
          } else {
            const savedCategory = await addCollectionItem('categories', { name: form.category, subcategories: [name] })
            updatedCategory.id = savedCategory.id
          }
        }
        setCategoryObjects((items) => items.map((item) => item.name === form.category ? updatedCategory : item))
        setForm((current) => ({ ...current, subcategory: name }))
      } else {
        const collectionItem = { name, type: type === 'program' ? 'Program' : 'Batch' }
        const existingItems = type === 'program' ? programs : batches
        if (existingItems.some((item) => (typeof item === 'string' ? item : item.name).toLowerCase() === name.toLowerCase())) {
          setMessage(`${collectionItem.type} "${name}" already exists.`)
          return
        }

        const savedItem = isFirebaseEnabled
          ? await addCollectionItem('programs', collectionItem)
          : { id: `PRG${Date.now()}`, ...collectionItem }
        if (type === 'program') {
          setPrograms((items) => [...items, savedItem])
          setForm((current) => ({ ...current, program: name }))
        } else {
          setBatches((items) => [...items, savedItem])
          setForm((current) => ({ ...current, batch: name }))
        }
      }

      setNewOptionNames((current) => ({ ...current, [type]: '' }))
      setActiveAddOption('')
      setMessage(`${type === 'subcategory' ? 'Subcategory' : type[0].toUpperCase() + type.slice(1)} "${name}" added.`)
    } catch (err) {
      console.error(`Failed to add ${type}`, err)
      setMessage(`Could not add ${type}: ${err.message}`)
    }
  }

  const handleOptionSelect = (type, value) => {
    if (value === `__add_${type}__`) {
      setActiveAddOption(type)
      return
    }

    setActiveAddOption('')
    if (type === 'category') {
      setForm((current) => ({ ...current, category: value, subcategory: '' }))
    } else if (type === 'subcategory') {
      setForm((current) => ({ ...current, subcategory: value }))
    } else {
      setForm((current) => ({ ...current, [type]: value }))
    }
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
      category: item.Category || item.category || (categories[0] || 'General'),
      subcategory: item.Subcategory || item.subcategory || '',
      totalCourseFee: item.TotalCourseFee || item.totalCourseFee || 0,
      joiningDate: item.JoiningDate || item.joiningDate || new Date().toISOString().slice(0, 10),
      completionDate: item.CompletionDate || item.completionDate || '',
    }))

    if (isFirebaseEnabled) {
      await Promise.all(parsed.map((student) => addCollectionItem('students', {
        name: student.name,
        email: student.email,
        batch: student.batch,
        category: student.category,
        subcategory: student.subcategory,
        totalCourseFee: Number(student.totalCourseFee) || 0,
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
          <small className="import-format-note">Expected Excel columns: Name, Email, Batch, Category, Subcategory, TotalCourseFee, JoiningDate, CompletionDate</small>
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
              <select value={activeAddOption === 'batch' ? '__add_batch__' : form.batch} onChange={(e) => handleOptionSelect('batch', e.target.value)}>
                <option value="">Select batch</option>
                {batches.map((b, idx) => (
                  <option key={idx} value={typeof b === 'string' ? b : b.name}>{typeof b === 'string' ? b : b.name}</option>
                ))}
                <option value="__add_batch__">+ Add new batch...</option>
              </select>
              {activeAddOption === 'batch' && <div className="inline-add-control">
                <input
                  value={newOptionNames.batch}
                  onChange={(e) => setNewOptionNames({ ...newOptionNames, batch: e.target.value })}
                  placeholder="New batch"
                />
                <button type="button" className="button-secondary" onClick={() => handleAddOption('batch')}>Add</button>
              </div>}
            </label>
            <label>
              Program
              <select value={activeAddOption === 'program' ? '__add_program__' : form.program} onChange={(e) => handleOptionSelect('program', e.target.value)}>
                <option value="">Select program</option>
                {programs.map((p, idx) => (
                  <option key={idx} value={typeof p === 'string' ? p : p.name}>{typeof p === 'string' ? p : p.name}</option>
                ))}
                <option value="__add_program__">+ Add new program...</option>
              </select>
              {activeAddOption === 'program' && <div className="inline-add-control">
                <input
                  value={newOptionNames.program}
                  onChange={(e) => setNewOptionNames({ ...newOptionNames, program: e.target.value })}
                  placeholder="New program"
                />
                <button type="button" className="button-secondary" onClick={() => handleAddOption('program')}>Add</button>
              </div>}
            </label>
            <label>
              Course syllabus
              <select
                value={form.syllabusId}
                onChange={(e) => {
                  const selectedSyllabus = syllabuses.find((item) => item.id === e.target.value)
                  setForm({
                    ...form,
                    syllabusId: e.target.value,
                    syllabusName: selectedSyllabus?.courseName || '',
                    syllabusContent: selectedSyllabus?.syllabus || '',
                  })
                }}
              >
                <option value="">Select uploaded syllabus</option>
                {syllabuses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.courseName} {item.fileName ? `- ${item.fileName}` : ''}
                  </option>
                ))}
              </select>
              {form.syllabusName && <small className="form-note">Selected: {form.syllabusName}</small>}
            </label>
            <label>
              Total course fee
              <input
                value={form.totalCourseFee}
                onChange={(e) => setForm({ ...form, totalCourseFee: e.target.value })}
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter total course fee"
              />
            </label>
            <label>
              Category
              <select value={activeAddOption === 'category' ? '__add_category__' : form.category} onChange={(e) => handleOptionSelect('category', e.target.value)}>
                <option value="">Select category</option>
                {categories.map((c, idx) => (
                  <option key={idx} value={typeof c === 'string' ? c : c.name}>{typeof c === 'string' ? c : c.name}</option>
                ))}
                <option value="__add_category__">+ Add new category...</option>
              </select>
              {activeAddOption === 'category' && <div className="inline-add-control">
                <input
                  value={newOptionNames.category}
                  onChange={(e) => setNewOptionNames({ ...newOptionNames, category: e.target.value })}
                  placeholder="New category"
                />
                <button type="button" className="button-secondary" onClick={() => handleAddOption('category')}>Add</button>
              </div>}
            </label>
            {form.category && (
              <label>
                Subcategory
                <select value={activeAddOption === 'subcategory' ? '__add_subcategory__' : form.subcategory} onChange={(e) => handleOptionSelect('subcategory', e.target.value)}>
                  <option value="">Select subcategory</option>
                  {categoryObjects
                    .find((cat) => cat.name === form.category)
                    ?.subcategories?.map((sub, idx) => (
                      <option key={idx} value={sub}>{sub}</option>
                    )) || []}
                  <option value="__add_subcategory__">+ Add new subcategory...</option>
                </select>
                {activeAddOption === 'subcategory' && <div className="inline-add-control">
                  <input
                    value={newOptionNames.subcategory}
                    onChange={(e) => setNewOptionNames({ ...newOptionNames, subcategory: e.target.value })}
                    placeholder="New subcategory"
                  />
                  <button type="button" className="button-secondary" onClick={() => handleAddOption('subcategory')}>Add</button>
                </div>}
              </label>
            )}
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
            {(filterCategory || filterSubcategory) && (
              <button
                className="button-secondary small"
                onClick={() => setSearchParams({})}
                style={{ marginLeft: 'auto' }}
              >
                Clear filter: {filterCategory} {filterSubcategory && `/ ${filterSubcategory}`}
              </button>
            )}
          </div>

          <div className="filter-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#b9a7ff', display: 'block', marginBottom: '4px' }}>
                Filter by Batch
              </label>
              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">All batches</option>
                {batches.map((b, idx) => (
                  <option key={idx} value={typeof b === 'string' ? b : b.name}>
                    {typeof b === 'string' ? b : b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#b9a7ff', display: 'block', marginBottom: '4px' }}>
                Filter by Program
              </label>
              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">All programs</option>
                {programs.map((p, idx) => (
                  <option key={idx} value={typeof p === 'string' ? p : p.name}>
                    {typeof p === 'string' ? p : p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#b9a7ff', display: 'block', marginBottom: '4px' }}>
                Filter by Category
              </label>
              <select
                value={filterCategory || ''}
                onChange={(e) => setSearchParams(e.target.value ? { category: e.target.value } : {})}
                style={{ width: '100%' }}
              >
                <option value="">All categories</option>
                {categories.map((c, idx) => (
                  <option key={idx} value={typeof c === 'string' ? c : c.name}>
                    {typeof c === 'string' ? c : c.name}
                  </option>
                ))}
              </select>
            </div>

            {filterCategory && (
              <div>
                <label style={{ fontSize: '12px', color: '#b9a7ff', display: 'block', marginBottom: '4px' }}>
                  Filter by Subcategory
                </label>
                <select
                  value={filterSubcategory || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSearchParams({ category: filterCategory, subcategory: e.target.value })
                    } else {
                      setSearchParams({ category: filterCategory })
                    }
                  }}
                  style={{ width: '100%' }}
                >
                  <option value="">All subcategories</option>
                  {categoryObjects
                    .find((cat) => cat.name === filterCategory)
                    ?.subcategories?.map((sub, idx) => (
                      <option key={idx} value={sub}>
                        {sub}
                      </option>
                    )) || []}
                </select>
              </div>
            )}

            {(filterBatch || filterProgram || filterCategory || filterSubcategory) && (
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  className="button-secondary small"
                  onClick={() => {
                    setFilterBatch('')
                    setFilterProgram('')
                    setSearchParams({})
                  }}
                  style={{ width: '100%' }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <p>Loading students...</p>
          ) : (
            <div className="students-table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Parent</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Batch</th>
                    <th>Total fee</th>
                    <th>Paid fee</th>
                    <th>Category</th>
                    <th>Subcategory</th>
                    <th>Joining</th>
                    <th>Completion</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td>{student.name}</td>
                      <td>{student.parentName || '—'}</td>
                      <td>{student.email}</td>
                      <td>{student.contact || '—'}</td>
                      <td>{student.batch}</td>
                      <td>{student.totalCourseFee ? student.totalCourseFee : '—'}</td>
                      <td>{student.paidFee ? student.paidFee : '—'}</td>
                      <td>{student.category}</td>
                      <td>{student.subcategory || '—'}</td>
                      <td>{student.joiningDate || '—'}</td>
                      <td>{student.completionDate || '—'}</td>
                      <td>
                        <button className="button-secondary" onClick={() => handleEdit(student)}>Edit</button>
                        <button className="button-danger" onClick={() => handleDelete(student.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
