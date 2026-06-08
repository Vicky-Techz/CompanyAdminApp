import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
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
import NotFound from './pages/NotFound'
import './App.css'

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
            <Route path="staff" element={<Staff />} />
            <Route path="programs" element={<Programs />} />
            <Route path="bulk" element={<BulkOperations />} />
            <Route path="reports" element={<Reports />} />
            <Route path="payments" element={<Payments />} />
            <Route path="settings" element={<Settings />} />
            <Route path="tools" element={<Tools />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
