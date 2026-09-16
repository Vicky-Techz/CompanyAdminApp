import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

/**
 * Firebase Configuration
 * Loads credentials from environment variables
 * Firebase is required for authentication and persistent data storage.
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

const firebaseAvailable = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.appId,
)

let app
if (firebaseAvailable) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
} else {
  console.warn('Firebase config is incomplete. Add the values from your Firebase web app to .env.')
}

export const auth = firebaseAvailable ? getAuth(app) : null
export const db = firebaseAvailable ? getFirestore(app) : null
export const storage = firebaseAvailable ? getStorage(app) : null
export const isFirebaseEnabled = firebaseAvailable

export default app
