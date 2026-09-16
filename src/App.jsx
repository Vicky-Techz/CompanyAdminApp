import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Students from './pages/students/Students'
import StudentProfile from './pages/students/StudentProfile'
import Certificates from './pages/certificates/Certificates'
import Staff from './pages/admin/Staff'
import Programs from './pages/admin/Programs'
import Reports from './pages/admin/Reports'
import Payments from './pages/admin/Payments'
import Settings from './pages/admin/Settings'
import Tools from './pages/admin/Tools'
import BulkOperations from './pages/admin/BulkOperations'
import Syllabus from './pages/admin/Syllabus'
import NotFound from './pages/NotFound'
import './App.css'

function RoleProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="page-loader">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function MainLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-view">
        <TopBar />
        <div className="page-shell">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentProfile />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="staff" element={<RoleProtectedRoute allowedRoles={['super_admin']}><Staff /></RoleProtectedRoute>} />
            <Route path="programs" element={<RoleProtectedRoute allowedRoles={['super_admin']}><Programs /></RoleProtectedRoute>} />
            <Route path="attendance" element={<RoleProtectedRoute allowedRoles={['super_admin']}><BulkOperations /></RoleProtectedRoute>} />
            <Route path="bulk" element={<Navigate to="/attendance" replace />} />
            <Route path="syllabus" element={<RoleProtectedRoute allowedRoles={['super_admin']}><Syllabus /></RoleProtectedRoute>} />
            <Route path="reports" element={<RoleProtectedRoute allowedRoles={['super_admin']}><Reports /></RoleProtectedRoute>} />
            <Route path="payments" element={<RoleProtectedRoute allowedRoles={['super_admin']}><Payments /></RoleProtectedRoute>} />
            <Route path="settings" element={<RoleProtectedRoute allowedRoles={['super_admin']}><Settings /></RoleProtectedRoute>} />
            <Route path="tools" element={<RoleProtectedRoute allowedRoles={['super_admin']}><Tools /></RoleProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
