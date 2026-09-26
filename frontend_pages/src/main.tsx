import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/dashboard/Dashboard'
import RoleForecast from './pages/dashboard/RoleForecast'
import Employability from './pages/dashboard/Employability'
import Sectors from './pages/dashboard/Sectors'
import Geography from './pages/dashboard/Geography'
import Reports from './pages/dashboard/Reports'
import Taxonomy from './pages/dashboard/Taxonomy'
import CareerGuidance from './pages/dashboard/CareerGuidance'
import Education from './pages/dashboard/Education'
import PolicyPlanning from './pages/dashboard/PolicyPlanning'
import DataUpload from './pages/dashboard/DataUpload'
import UserManagement from './pages/dashboard/UserManagement'
import Settings from './pages/dashboard/Settings'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

/** A dashboard page, only for the roles listed for that path in auth/access.ts. */
const guard = (path: string, el: React.ReactNode) => <ProtectedRoute path={path}>{el}</ProtectedRoute>

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/dashboard" element={guard('/dashboard', <Dashboard />)} />
            <Route path="/dashboard/forecast" element={guard('/dashboard/forecast', <RoleForecast />)} />
            <Route path="/dashboard/skills-forecast" element={<Navigate to="/dashboard/forecast" replace />} />
            <Route path="/dashboard/employability" element={guard('/dashboard/employability', <Employability />)} />
            <Route path="/dashboard/career" element={guard('/dashboard/career', <CareerGuidance />)} />
            <Route path="/dashboard/education" element={guard('/dashboard/education', <Education />)} />
            <Route path="/dashboard/sectors" element={guard('/dashboard/sectors', <Sectors />)} />
            <Route path="/dashboard/geography" element={guard('/dashboard/geography', <Geography />)} />
            <Route path="/dashboard/planning" element={guard('/dashboard/planning', <PolicyPlanning />)} />
            <Route path="/dashboard/taxonomy" element={guard('/dashboard/taxonomy', <Taxonomy />)} />
            <Route path="/dashboard/reports" element={guard('/dashboard/reports', <Reports />)} />
            <Route path="/dashboard/uploads" element={guard('/dashboard/uploads', <DataUpload />)} />
            <Route path="/dashboard/users" element={guard('/dashboard/users', <UserManagement />)} />
            <Route path="/dashboard/settings" element={guard('/dashboard/settings', <Settings />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
