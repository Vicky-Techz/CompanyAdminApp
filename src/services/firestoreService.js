import { db, isFirebaseEnabled } from '../config'
import {
  collection,
  getDocs,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore'

const getCollectionRef = (collectionName) => {
  if (!db) {
    throw new Error('Firestore is not initialized.')
  }
  return collection(db, collectionName)
}

const getDocumentRef = (collectionName, id) => {
  if (!db) {
    throw new Error('Firestore is not initialized.')
  }
  return doc(db, collectionName, id)
}

export const fetchCollection = async (collectionName) => {
  if (!isFirebaseEnabled) {
    return []
  }

  const collectionRef = getCollectionRef(collectionName)
  const snapshot = await getDocs(query(collectionRef, orderBy('createdAt', 'desc')))

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }))
}

export const fetchDocument = async (collectionName, id) => {
  if (!isFirebaseEnabled) {
    return null
  }

  const docRef = getDocumentRef(collectionName, id)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

export const subscribeCollection = (collectionName, onUpdate, onError) => {
  if (!isFirebaseEnabled) {
    return () => {}
  }

  const collectionRef = getCollectionRef(collectionName)
  const q = query(collectionRef, orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }))
      onUpdate(items)
    },
    (error) => {
      console.warn('Error syncing collection', collectionName, error)
      onError?.(error)
    },
  )
}

export const addCollectionItem = async (collectionName, item) => {
  if (!isFirebaseEnabled) {
    return {
      id: `demo-${Date.now()}`,
      ...item,
      createdAt: new Date(),
    }
  }

  const collectionRef = getCollectionRef(collectionName)
  const createdAt = new Date()
  const docRef = await addDoc(collectionRef, { ...item, createdAt })

  return {
    id: docRef.id,
    ...item,
    createdAt,
  }
}

export const setCollectionItem = async (collectionName, id, data) => {
  if (!isFirebaseEnabled) {
    return { id, ...data }
  }

  const docRef = doc(db, collectionName, id)
  await setDoc(docRef, { ...data }, { merge: true })

  return { id, ...data }
}
