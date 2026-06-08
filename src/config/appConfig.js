/**
 * Application Configuration
 * Centralized app-wide settings, constants, and feature flags
 */

export const APP_CONFIG = {
  APP_NAME: 'Evolve Admin Dashboard',
  APP_VERSION: '1.0.0',
  
  // Feature Flags
  FEATURES: {
    DEMO_MODE: true,
    ENABLE_NOTIFICATIONS: true,
    ENABLE_LIVE_SEARCH: true,
    ENABLE_BULK_OPERATIONS: true,
    ENABLE_REPORTS: true,
    ENABLE_PAYMENTS: true,
  },

  // Pagination & Limits
  PAGINATION: {
    STUDENTS_PER_PAGE: 10,
    STAFF_PER_PAGE: 10,
    CERTIFICATES_PER_PAGE: 20,
    SEARCH_RESULTS_LIMIT: 50,
  },

  // File Upload Limits
  FILE_LIMITS: {
    MAX_FILE_SIZE_MB: 10,
    EXCEL_FILE_SIZE_MB: 5,
    PDF_FILE_SIZE_MB: 10,
    ALLOWED_EXCEL_TYPES: ['.xlsx', '.xls', '.csv'],
    ALLOWED_IMAGE_TYPES: ['.jpg', '.jpeg', '.png'],
  },

  // API & Routes
  ROUTES: {
    LOGIN: '/login',
    REGISTER: '/register',
    DEMO_ACCESS: '/demo',
    DASHBOARD: '/dashboard',
    STUDENTS: '/students',
    CERTIFICATES: '/certificates',
    STAFF: '/staff',
    PROGRAMS: '/programs',
    REPORTS: '/reports',
    PAYMENTS: '/payments',
    SETTINGS: '/settings',
    TOOLS: '/tools',
    BULK: '/bulk',
  },

  // Demo Data TTL (in milliseconds)
  DEMO_DATA_TTL: 24 * 60 * 60 * 1000, // 24 hours

  // Notification Settings
  NOTIFICATIONS: {
    TIMEOUT: 5000, // ms
    POSITION: 'top-right',
  },

  // Certificate Settings
  CERTIFICATE: {
    PAGE_SIZE: 'A4',
    TEMPLATE_FORMAT: 'pdf',
  },

  // Student Settings
  STUDENT: {
    ID_CARD_SIZE: '85x54mm', // Standard credit card size
    AUTO_GENERATE_ID: true,
  },
}

export default APP_CONFIG
