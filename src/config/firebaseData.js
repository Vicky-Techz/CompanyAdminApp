/**
 * Centralized Firebase data, seed values, and implementation defaults.
 *
 * Use this file to update Firebase-related data in one place when switching
 * the app from demo or sample data to a real client implementation.
 */

export const FIREBASE_ADMIN_USER = {
  email: 'evolveroboticsclt@gmail.com',
  role: 'super_admin',
  displayName: 'Evolve Robotics Admin',
}

export const INVITE_TOKENS = ['EVOLVE-ADMIN', 'EVOLVE-INVITE']

export const FIRESTORE_COLLECTIONS = {
  STUDENTS: 'students',
  STAFF: 'staff',
  PROGRAMS: 'programs',
  RECEIPTS: 'receipts',
  CERTIFICATES: 'certificates',
  ATTENDANCE: 'attendance',
  ASSESSMENTS: 'assessments',
  SYLLABUSES: 'syllabuses',
}

export const DEFAULT_CERTIFICATE_TEMPLATE = {
  title: 'Certificate of Completion',
  subtitle: 'This certificate is awarded to',
  footer: 'Evolve Robotics Academy',
}

export const DEFAULT_CATEGORIES = ['School', 'College', 'Office']

export const FIRESTORE_SEED_DATA = {
  students: [
    { id: 'S001', name: 'Jahn Aknih', email: 'evolve@gmail.com', batch: '2023', category: 'Mechatronics', status: 'Active' },
    { id: 'S002', name: 'James Kanchar', email: 'evolve@abc.com', batch: '2024', category: 'Robotics', status: 'Active' },
    { id: 'S003', name: 'Jonas Math', email: 'evolve@gmail.com', batch: '2024', category: 'AI', status: 'Active' },
  ],
  staff: [
    { id: 'ST001', name: 'Sanathbir Smith', role: 'Administrator', status: 'Active' },
    { id: 'ST002', name: 'Madhan Smith', role: 'Instructor', status: 'Pending Approval' },
    { id: 'ST003', name: 'Raman Murri', role: 'Support', status: 'Approved' },
  ],
  programs: [
    { id: 'P001', name: 'Robotics Fundamentals', type: 'Program' },
    { id: 'B001', name: 'Batch Spring 2025', type: 'Batch' },
    { id: 'C001', name: 'Category A', type: 'Category' },
  ],
  receipts: [
    { id: 'R-1023', student: 'Jahn Aknih', amount: '₹11,750' },
    { id: 'R-1042', student: 'James Kanchar', amount: '₹9,500' },
  ],
  attendance: [
    { id: 'A001', date: '2025-04-10', student: 'Jahn Aknih', status: 'Present' },
    { id: 'A002', date: '2025-04-10', student: 'James Kanchar', status: 'Absent' },
    { id: 'A003', date: '2025-04-10', student: 'Jonas Math', status: 'Present' },
  ],
  assessments: [
    { id: 'AS001', student: 'Jahn Aknih', subject: 'Electronics', score: 92, status: 'Completed' },
    { id: 'AS002', student: 'James Kanchar', subject: 'Robotics', score: 76, status: 'Pending' },
    { id: 'AS003', student: 'Jonas Math', subject: 'AI', score: 88, status: 'Completed' },
  ],
  certificates: [
    { id: 'C-001', name: 'Evolve Robotics Scholarship', description: 'Completion of Robotics Program' },
  ],
  categories: [
    { id: 'CAT001', name: 'School', isDefault: true },
    { id: 'CAT002', name: 'College', isDefault: true },
    { id: 'CAT003', name: 'Office', isDefault: true },
  ],
  syllabuses: [],
}

export const DASHBOARD_DEFAULTS = {
  stats: [
    { label: 'Total Students', value: 153, icon: '👨‍🎓' },
    { label: 'Active Batches', value: 17, icon: '📦' },
    { label: 'Pending Approvals', value: 9, icon: '🕒' },
    { label: 'Certificates Issued', value: 24, icon: '🎓' },
  ],
  recentStudents: [
    { id: 'S001', name: 'Jahn Aknih', email: 'evolve@gmail.com', batch: '2023-2024', status: 'Active' },
    { id: 'S002', name: 'James Kanchar', email: 'evolve@abc.com', batch: '2023-2024', status: 'Pending' },
    { id: 'S003', name: 'Jonas Math', email: 'evolve@gmail.com', batch: '2024-2025', status: 'Active' },
  ],
}

export default {
  FIREBASE_ADMIN_USER,
  INVITE_TOKENS,
  FIRESTORE_COLLECTIONS,
  DEFAULT_CERTIFICATE_TEMPLATE,
  FIRESTORE_SEED_DATA,
  DASHBOARD_DEFAULTS,
}
