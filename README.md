# Evolve Robotics Admin Dashboard

This project is a React + Vite admin dashboard for Evolve Robotics with Firebase-ready authentication, student management, certificates, staff/approval management, program/batch pages, reports, payments, settings, and data tools.

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` (or the port shown in terminal)

## Available Scripts

- `npm install` — install dependencies
- `npm run dev` — start the development server
- `npm run build` — build the production bundle

## Firebase Configuration

Copy `.env.example` to `.env` and fill in your Firebase configuration values:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Firebase must be configured before signing in or saving persistent data.

## Project Structure

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed information.

```
src/
├── config/              # Centralized configuration
│   ├── appConfig.js     # App settings, constants, feature flags
│   ├── firebaseConfig.js # Firebase initialization
│   ├── firebaseData.js   # Central admin credentials, collection info, and seed data
│   └── index.js         # Config exports (single import point)
├── pages/               # Feature-organized pages
│   ├── auth/            # Login, Register, DemoAccess
│   ├── students/        # Student management & profiles
│   ├── certificates/    # Certificate generation
│   ├── admin/           # Staff, Programs, Reports, Payments, Settings, Tools, BulkOperations
│   ├── Dashboard.jsx    # Main dashboard
│   └── NotFound.jsx     # 404 page
├── context/             # React Context (AuthContext)
├── services/            # Business logic (firestoreService)
├── components/          # Reusable UI (Sidebar, TopBar, ProtectedRoute)
├── App.jsx              # Main router
└── App.css              # Styles
```

## Configuration

### Using App Configuration

```javascript
import { APP_CONFIG, isFirebaseEnabled } from '../config'

// Access settings
const { PAGINATION, FILE_LIMITS, ROUTES } = APP_CONFIG
```

### Key Features

- Authentication with Firebase
- Student management (manual add, Excel import)
- Certificate generation with custom templates
- Staff approval workflow
- Bulk attendance & assessment operations
- Reports and analytics
- Payment receipts
- Configurable settings and utilities

## Development

The project uses:
- **React 19** with Vite
- **Firebase** (Auth, Firestore, Storage)
- **React Router** for navigation
- **xlsx** for Excel import
- **jsPDF** for PDF generation
- **html2canvas** for screenshot/export

## Notes

- `.env` file is excluded from Git for security
- Configuration is centralized in `src/config/` for easy maintenance
- Pages are organized by feature for better scalability

