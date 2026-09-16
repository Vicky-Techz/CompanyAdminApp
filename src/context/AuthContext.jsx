/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db, isFirebaseEnabled, FIREBASE_ADMIN_USER } from '../config'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const AuthContext = createContext()

const resolveRoleForEmail = (email) => {
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized) return 'user'
  return normalized === FIREBASE_ADMIN_USER.email.toLowerCase() ? FIREBASE_ADMIN_USER.role : 'user'
}

const loadUserProfile = async (currentUser) => {
  try {
    const profileSnap = await getDoc(doc(db, 'users', currentUser.uid))
    return profileSnap.exists() ? profileSnap.data() : {}
  } catch (error) {
    console.warn('Unable to load the Firestore user profile. Using the email-based role.', error)
    return {}
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!isFirebaseEnabled)

  useEffect(() => {
    if (!isFirebaseEnabled) return

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null)
        setLoading(false)
        return
      }

      const profile = await loadUserProfile(currentUser)
      const role = profile.role || resolveRoleForEmail(currentUser.email)

      setUser({ ...currentUser, role, displayName: currentUser.displayName || profile.displayName || currentUser.email.split('@')[0] })
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
      case 'auth/missing-email':
        return 'Please provide an email address to reset your password.'
      case 'auth/unauthorized-domain':
        return 'This web domain is not authorized in Firebase. Add your app domain to Firebase Authentication authorized domains.'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.'
      default:
        return error.message || 'Failed to authenticate with Firebase.'
    }
  }

  const login = async (email, password) => {
    const trimmedEmail = String(email || '').trim()

    if (!isFirebaseEnabled) {
      throw new Error('Firebase is not configured. Add the Firebase values to your .env file and restart the app.')
    }

    try {
      const result = await signInWithEmailAndPassword(auth, trimmedEmail, password)
      const role = resolveRoleForEmail(result.user.email)

      const userWithRole = {
        ...result.user,
        role,
        displayName: result.user.displayName || result.user.email.split('@')[0],
      }

      setUser(userWithRole)
      return userWithRole
    } catch (err) {
      throw Object.assign(new Error(getFirebaseAuthErrorMessage(err)), { cause: err })
    }
  }

  const createAccount = async (email, password) => {
    const trimmedEmail = String(email || '').trim()
    const resolvedRole = resolveRoleForEmail(trimmedEmail)

    if (!isFirebaseEnabled) {
      throw new Error('Firebase is not configured. Add the Firebase values to your .env file and restart the app.')
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, trimmedEmail, password)
      const role = resolvedRole

      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        role,
        displayName: result.user.email.split('@')[0],
        createdAt: new Date(),
      }, { merge: true })

      const userWithRole = {
        ...result.user,
        role,
        displayName: result.user.displayName || result.user.email.split('@')[0],
      }

      setUser(userWithRole)
      return userWithRole
    } catch (err) {
      throw Object.assign(new Error(getFirebaseAuthErrorMessage(err)), { cause: err })
    }
  }

  const resetPassword = async (email) => {
    const trimmedEmail = email?.trim()
    if (!trimmedEmail) {
      throw new Error('Please provide a valid email address.')
    }

    if (!isFirebaseEnabled) {
      throw new Error('Firebase is not configured. Add the Firebase values to your .env file and restart the app.')
    }

    try {
      const methods = await fetchSignInMethodsForEmail(auth, trimmedEmail)
      if (!methods || methods.length === 0) {
        throw new Error('No registered authentication account found for this email.')
      }
      return await sendPasswordResetEmail(auth, trimmedEmail)
    } catch (err) {
      throw Object.assign(new Error(getFirebaseAuthErrorMessage(err)), { cause: err })
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
