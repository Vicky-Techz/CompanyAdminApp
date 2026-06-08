/**
 * Centralized Configuration Export
 * All app configurations are exported from here
 */

export { default as APP_CONFIG } from './appConfig.js'
export { auth, db, storage, isFirebaseEnabled } from './firebaseConfig.js'
export * from './firebaseData.js'
