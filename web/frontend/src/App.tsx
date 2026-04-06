import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import LoginPage from '@/pages/LoginPage'
import ChatPage from '@/pages/ChatPage'
import DashboardLayout from '@/pages/dashboard/DashboardLayout'
import StudentsSection from '@/pages/dashboard/StudentsSection'
import AppsSection from '@/pages/dashboard/AppsSection'
import FlagsSection from '@/pages/dashboard/FlagsSection'
import DistrictsSection from '@/pages/dashboard/DistrictsSection'
import MarketplaceSection from '@/pages/dashboard/MarketplaceSection'
import HealthSection from '@/pages/dashboard/HealthSection'
import CostsSection from '@/pages/dashboard/CostsSection'
import TeachersSection from '@/pages/dashboard/TeachersSection'
import ClassroomsSection from '@/pages/dashboard/ClassroomsSection'
import MarketplaceBrowsePage from '@/pages/marketplace/MarketplaceBrowsePage'
import MarketplaceDetailPage from '@/pages/marketplace/MarketplaceDetailPage'
import MarketplaceSubmitPage from '@/pages/marketplace/MarketplaceSubmitPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireRole({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400">Loading...</div>
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

function DashboardRedirect() {
  const { user } = useAuth()
  if (user?.role === 'admin' || user?.role === 'district_admin') {
    return <Navigate to="/dashboard/teachers" replace />
  }
  return <Navigate to="/dashboard/students" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RequireGuest>
            <LoginPage />
          </RequireGuest>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <ChatPage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireRole roles={['teacher', 'admin', 'district_admin']}>
            <DashboardLayout />
          </RequireRole>
        }
      >
        <Route index element={<DashboardRedirect />} />
        {/* Teacher-only routes */}
        <Route path="students" element={<RequireRole roles={['teacher']}><StudentsSection /></RequireRole>} />
        <Route path="apps" element={<RequireRole roles={['teacher']}><AppsSection /></RequireRole>} />
        <Route path="classrooms" element={<RequireRole roles={['teacher']}><ClassroomsSection /></RequireRole>} />
        <Route path="flags" element={<RequireRole roles={['teacher']}><FlagsSection /></RequireRole>} />
        {/* Admin-only routes */}
        <Route path="teachers" element={<RequireRole roles={['admin', 'district_admin']}><TeachersSection /></RequireRole>} />
        <Route path="districts" element={<RequireRole roles={['admin', 'district_admin']}><DistrictsSection /></RequireRole>} />
        <Route path="marketplace" element={<RequireRole roles={['admin', 'district_admin']}><MarketplaceSection /></RequireRole>} />
        <Route path="health" element={<RequireRole roles={['admin', 'district_admin']}><HealthSection /></RequireRole>} />
        <Route path="costs" element={<RequireRole roles={['admin', 'district_admin']}><CostsSection /></RequireRole>} />
      </Route>
      <Route path="/marketplace" element={<RequireAuth><MarketplaceBrowsePage /></RequireAuth>} />
      <Route path="/marketplace/submit" element={<MarketplaceSubmitPage />} />
      <Route path="/marketplace/:appId" element={<RequireAuth><MarketplaceDetailPage /></RequireAuth>} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
