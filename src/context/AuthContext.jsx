import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db, isFirebaseEnabled, FIREBASE_ADMIN_USER } from '../config'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseEnabled) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const getFirebaseAuthErrorMessage = (error) => {
    if (!error || !error.code) {
      return error?.message || 'An unknown Firebase authentication error occurred.'
    }

    switch (error.code) {
      case 'auth/configuration-not-found':
        return 'Email/Password sign-in is not enabled in Firebase Authentication. Enable it under Authentication → Sign-in method.'
      case 'auth/operation-not-allowed':
        return 'Email/Password sign-in is disabled in Firebase Authentication. Enable it under Authentication → Sign-in method.'
      case 'auth/invalid-credential':
        return 'The sign-in credential is invalid. Check your email/password and confirm Firebase is configured correctly.'
      case 'auth/user-not-found':
        return 'No user found with that email address.'
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.'
      case 'auth/email-already-in-use':
        return 'That email is already registered. Please log in instead.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.'
      default:
        return error.message || 'Failed to authenticate with Firebase.'
    }
  }

  const login = async (email, password) => {
    if (!isFirebaseEnabled) {
      throw new Error('Firebase is not configured. Verify .env values and restart the dev server.')
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      setUser(result.user)
      return result
    } catch (err) {
      throw new Error(getFirebaseAuthErrorMessage(err))
    }
  }

  const createAccount = async (email, password) => {
    if (!isFirebaseEnabled) {
      throw new Error('Firebase is not configured. Verify .env values and restart the dev server.')
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const role = email.trim().toLowerCase() === FIREBASE_ADMIN_USER.email.toLowerCase() ? FIREBASE_ADMIN_USER.role : 'user'

      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        role,
        createdAt: new Date(),
      }, { merge: true })

      setUser(result.user)
      return result
    } catch (err) {
      throw new Error(getFirebaseAuthErrorMessage(err))
    }
  }

  const resetPassword = async (email) => {
    if (!isFirebaseEnabled) {
      throw new Error('Firebase is not configured. Verify .env values and restart the dev server.')
    }

    try {
      return await sendPasswordResetEmail(auth, email)
    } catch (err) {
      throw new Error(getFirebaseAuthErrorMessage(err))
    }
  }

  const logout = async () => {
    if (isFirebaseEnabled && auth) {
      await signOut(auth)
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, createAccount, resetPassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
