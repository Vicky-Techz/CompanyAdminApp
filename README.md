# Evolve Robotics Admin Dashboard

Evolve Robotics is a React and Firebase administration dashboard for managing students, programs, staff, payments, attendance, syllabuses, class assessments, and certificates.

The application uses Firebase Authentication for access control and Cloud Firestore for persistent data. The active application does not display sample records when Firebase collections are empty.

## Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Firebase setup](#firebase-setup)
- [How to use](#how-to-use)
- [Firestore collections](#firestore-collections)
- [Commands](#commands)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## Features

### Authentication and access

- Firebase email/password sign-in, registration, and password reset.
- Protected application routes.
- Admin-only access for staff, programs, attendance, syllabus, reports, payments, settings, and tools.
- Admin label beside the profile icon for the configured super administrator.
- Logout from the profile menu.

### Dashboard

- Live counts for students, batches, approvals, and certificates from Firestore.
- Course/category analytics based on stored students.
- Quick links to common management pages.
- Top search box with live student search by name, email, contact, or phone number.
- Clicking a search result opens the student profile.

### Student management

- Add and edit student records.
- Store name, parent/guardian, age, date of birth, gender, contact, email, batch, program, category, subcategory, notes, joining date, and completion date.
- Store total course fee and cumulative paid fee.
- Import students from Excel (`.xlsx` or `.xls`).
- Search and filter by name, email, batch, program, category, and subcategory.
- Student list has a horizontal scrollbar for wide data.
- Displayed row numbers are simple sequential numbers; Firestore document IDs remain internal.
- Student profile shows complete student information, attendance, payments, and class history.

### Payments

- Search for a student by name, email, batch, or category.
- Add bulk payments or installment payments.
- Record amount and payment date.
- Store each receipt in Firestore.
- Automatically update the student’s `paidFee` and `lastPaymentDate` fields.
- Display payment history with student, amount, type, and date.

### Attendance

- Attendance page replaces the old Bulk Operations label.
- Filter students by date, name, phone, program, batch, category, and subcategory.
- Mark attendance with one toggle button:
	- `Mark present`
	- `Mark not present`
- Save one attendance record per student and date.
- Add or update attendance from an individual student profile.

### Syllabus and class assessments

- Upload or enter a syllabus for a course/program.
- Supported syllabus upload formats: `.txt`, `.md`, and `.csv`.
- Save uploaded syllabuses to the Firestore `syllabuses` collection.
- Select an uploaded syllabus while adding or editing a student.
- Add class assessment records for an individual student with:
	- Class date
	- Staff member who taught the class
	- Topics covered
	- Student syllabus
	- Remaining syllabus
- Remaining syllabus is calculated from syllabus topics and topics covered.
- View class assessment history for each student.

### Staff and programs

- Create staff records and show approval status.
- Staff members are available in the class assessment staff dropdown.
- Manage programs, batches, categories, and subcategories.
- Use program and category data in student and attendance filters.

### Certificates, reports, settings, and tools

- Select Firestore students and generate PDF certificates.
- Upload a JSON certificate template and download a sample template.
- View live student, assessment, and certificate report counts.
- View Firebase connection and collection summary information.
- Access general, notification, and security settings panels.

## Requirements

- Node.js 18 or newer recommended.
- npm.
- A Firebase project with:
	- Email/password Authentication enabled.
	- A Firestore database named `(default)`.
	- A registered Firebase Web app.
	- Firestore rules allowing authenticated application users.

## Installation

From the project directory:

```bash
npm install
```

Copy the environment template:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux, use:

```bash
cp .env.example .env
```

Fill in `.env` with the Firebase Web app configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Restart Vite after changing `.env` because environment variables are loaded when the development server starts.

## Firebase setup

### 1. Create the Firebase project

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Create or select the project for this application.
3. Add a Web app and copy its configuration into `.env`.

### 2. Enable Authentication

Open **Build → Authentication → Sign-in method**, enable **Email/Password**, and create the admin user under the **Users** tab.

Update the configured admin email in `src/config/firebaseData.js`:

```js
export const FIREBASE_ADMIN_USER = {
	email: 'admin@example.com',
	role: 'super_admin',
	displayName: 'Evolve Robotics Admin',
}
```

### 3. Create Firestore

Open **Build → Firestore Database**, create the database, and make sure its name is exactly `(default)`.

For local authenticated use, rules can be:

```js
rules_version = '2';

service cloud.firestore {
	match /databases/{database}/documents {
		match /{document=**} {
			allow read, write: if request.auth != null;
		}
	}
}
```

Publish the rules. For production, use more restrictive per-collection rules and admin checks.

### 4. Add authorized domains

In **Authentication → Settings → Authorized domains**, add the domains used by the app, such as:

```text
localhost
127.0.0.1
```

## How to use

### Start the application

```bash
npm run dev
```

Open the URL shown by Vite, normally:


http://localhost:5173
```

### Add a student

1. Sign in as an admin.
2. Open **Students**.
3. Enter the student details.
4. Enter the total course fee.
5. Select an uploaded course syllabus if one exists.
6. Click **Add student**.
7. Confirm the record in Firestore under `students`.

### Add a course syllabus

1. Open **Syllabus**.
2. Enter a course/program name.
3. Upload a text syllabus or type topics manually.
4. Click **Save syllabus**.
5. Select this syllabus later from the student form.

### Record a payment

1. Open **Payments**.
2. Search for and select a student.
3. Enter the amount.
4. Choose **Installment** or **Bulk payment**.
5. Select the payment date.
6. Click **Save payment**.

The receipt is saved and the student’s `paidFee` is increased automatically.

### Record a class assessment

1. Open the student profile.
2. Select the class date and staff member.
3. Enter topics covered.
4. Review or upload the syllabus if needed.
5. Click **Save class assessment**.

Remaining syllabus is calculated from the syllabus content and topics covered.

### Mark attendance

From the **Attendance** page:

1. Select a date.
2. Use search or filters to find students.
3. Click **Mark present**.
4. Click the same button again to change the result to **Not Present**.

Attendance can also be marked from an individual student profile.

## Firestore collections

| Collection | Purpose |
| --- | --- |
| `users` | User profiles and roles |
| `students` | Student profiles, course fees, and selected syllabuses |
| `staff` | Staff records and approval status |
| `programs` | Programs and batches |
| `categories` | Categories and subcategories |
| `syllabuses` | Uploaded or entered course syllabuses |
| `receipts` | Bulk and installment payment records |
| `attendance` | Student attendance by date |
| `assessments` | Class history, staff, topics, and remaining syllabus |
| `certificates` | Certificate records and reporting data |
| `notifications` | Optional live notifications |

Important student fields include:

```js
{
	totalCourseFee,
	paidFee,
	lastPaymentDate,
	syllabusId,
	syllabusName,
	syllabusContent
}
```

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start the Vite development server
npm run build     # Create a production build
npm run lint      # Run ESLint
npm run preview   # Preview the production build locally
```

## Project structure

```text
src/
├── components/       # Sidebar, top bar, protected routes
├── config/           # App and Firebase configuration
├── context/          # Authentication context
├── pages/
│   ├── auth/         # Login, registration, password reset
│   ├── admin/        # Staff, programs, attendance, syllabus, payments, reports
│   ├── students/     # Student list and profile
│   └── certificates/ # Certificate generation
├── services/         # Firestore access helpers
├── App.jsx           # Routes and protected layout
├── App.css           # Application styles
└── index.css         # Base styles
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for additional file organization notes.

## Troubleshooting

### Firestore says `Database '(default)' not found`

Create the default Firestore database in the same Firebase project whose ID is in `.env`.

### Firestore says `Missing or insufficient permissions`

Check that the user is signed in and publish Firestore rules that allow authenticated users to read/write the required collections.

### Firebase changes are not loaded

Restart the development server after changing `.env`:

```bash
npm run dev
```

### The app shows no records

This is expected when the corresponding Firestore collection is empty or unavailable. Create records through the app or verify the Firebase project, database name, authentication session, and rules.

## Security notes

- Never commit `.env` to Git.
- Firebase Web configuration values are client-side identifiers; Firestore rules and Authentication protect the data.
- Do not put Firebase Admin SDK service-account credentials in this frontend project.
- Use stricter production Firestore rules than the simple authenticated-user example above.

