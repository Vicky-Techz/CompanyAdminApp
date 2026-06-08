# Project Structure Documentation

## Overview
The Evolve Admin Dashboard project now features an organized, scalable directory structure with centralized configuration management.

## Directory Structure

```
EvolveApp/
├── src/
│   ├── config/                           # Centralized configuration files
│   │   ├── appConfig.js                  # App-wide settings, constants, feature flags
│   │   ├── firebaseConfig.js             # Firebase initialization and credentials
│   │   └── index.js                      # Config exports (single point of import)
│   │
│   ├── pages/                            # Organized feature-based pages
│   │   ├── auth/                         # Authentication pages
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── DemoAccess.jsx
│   │   │
│   │   ├── students/                     # Student management pages
│   │   │   ├── Students.jsx              # Student list & management
│   │   │   └── StudentProfile.jsx        # Individual student profile
│   │   │
│   │   ├── certificates/                 # Certificate management
│   │   │   └── Certificates.jsx          # Certificate generation & templates
│   │   │
│   │   ├── admin/                        # Admin & operational pages
│   │   │   ├── Staff.jsx                 # Staff & approval management
│   │   │   ├── Programs.jsx              # Program/Batch/Category hierarchy
│   │   │   ├── Reports.jsx               # Analytics & reports
│   │   │   ├── Payments.jsx              # Payment receipts & tracking
│   │   │   ├── Settings.jsx              # App configuration
│   │   │   ├── Tools.jsx                 # Data utilities & Firebase info
│   │   │   └── BulkOperations.jsx        # Bulk attendance & assessment
│   │   │
│   │   ├── Dashboard.jsx                 # Main dashboard (top level)
│   │   └── NotFound.jsx                  # 404 page (top level)
│   │
│   ├── context/                          # React Context for state management
│   │   └── AuthContext.jsx
│   │
│   ├── services/                         # Business logic & data services
│   │   └── firestoreService.js
│   │
│   ├── components/                       # Reusable UI components
│   │   ├── Sidebar.jsx
│   │   ├── TopBar.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   ├── App.jsx                           # Main app router
│   ├── main.jsx                          # Entry point
│   ├── App.css                           # Global styles
│   └── index.css                         # Base styles
│
├── .env                                  # Firebase credentials (local, not committed)
├── .env.example                          # Firebase credentials template
└── package.json                          # Dependencies
```

## Configuration Management

### Using Configuration

Import all configs from the centralized config/index.js:

```javascript
import { APP_CONFIG, isFirebaseEnabled, auth, db, storage } from '../config'

// Access app settings
const { PAGINATION, FILE_LIMITS, ROUTES } = APP_CONFIG

// Use Firebase
if (isFirebaseEnabled) {
  // Firebase is configured
}
```

### Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your Firebase credentials:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   ...
   ```
3. `.env` is excluded from Git (see `.gitignore`)

## Page Organization

### Auth Pages (`pages/auth/`)
Public pages for login, registration, and demo access.

### Student Pages (`pages/students/`)
Student management and profile viewing pages.

### Certificate Pages (`pages/certificates/`)
Certificate generation and template management.

### Admin Pages (`pages/admin/`)
Administrative functions including staff, programs, reports, payments, settings, tools, and bulk operations.

### Top-Level Pages
- `Dashboard.jsx` - Main dashboard
- `NotFound.jsx` - 404 error page

## Import Best Practices

### ✅ Do This
```javascript
// Import from config/index.js
import { APP_CONFIG, isFirebaseEnabled } from '../config'

// Import pages with correct paths
import Students from '../pages/students/Students'
import Login from '../pages/auth/Login'
```

### ❌ Don't Do This
```javascript
// Avoid direct firebaseConfig imports
import { auth } from '../firebaseConfig'

// This no longer works - use config/index.js instead
```

## Configuration Constants

### APP_CONFIG.FEATURES
Feature flags for enabling/disabling functionality:
- `DEMO_MODE` - Demo fallback mode
- `ENABLE_NOTIFICATIONS` - Notifications
- `ENABLE_LIVE_SEARCH` - Live search
- `ENABLE_BULK_OPERATIONS` - Bulk operations
- `ENABLE_REPORTS` - Reports
- `ENABLE_PAYMENTS` - Payments

### APP_CONFIG.PAGINATION
Limits for data display:
- `STUDENTS_PER_PAGE` - 10
- `STAFF_PER_PAGE` - 10
- `CERTIFICATES_PER_PAGE` - 20
- `SEARCH_RESULTS_LIMIT` - 50

### APP_CONFIG.FILE_LIMITS
File upload constraints:
- `MAX_FILE_SIZE_MB` - 10
- `EXCEL_FILE_SIZE_MB` - 5
- `PDF_FILE_SIZE_MB` - 10
- Allowed file extensions

### APP_CONFIG.ROUTES
Application route constants for navigation.

## Firebase Configuration

The `firebaseConfig.js` in the config folder:
- Loads credentials from environment variables
- Initializes Firebase services (Auth, Firestore, Storage)
- Exports auth, db, storage, and isFirebaseEnabled flag
- Falls back to demo mode if credentials are incomplete

## Old File Cleanup

The original page files in `src/pages/` have been reorganized into subdirectories. If old files still exist:
- `Login.jsx`, `Register.jsx`, `DemoAccess.jsx` → moved to `auth/`
- `Students.jsx`, `StudentProfile.jsx` → moved to `students/`
- `Certificates.jsx` → moved to `certificates/`
- `Staff.jsx`, `Programs.jsx`, `Reports.jsx`, `Payments.jsx`, `Settings.jsx`, `Tools.jsx`, `BulkOperations.jsx` → moved to `admin/`

These old files can be safely deleted after verifying the application works correctly with the new structure.
