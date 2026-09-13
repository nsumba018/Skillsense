import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/dashboard/Dashboard'
import SkillsForecast from './pages/dashboard/SkillsForecast'
import Employability from './pages/dashboard/Employability'
import Sectors from './pages/dashboard/Sectors'
import Geography from './pages/dashboard/Geography'
import Reports from './pages/dashboard/Reports'
import Settings from './pages/dashboard/Settings'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/skills-forecast" element={<SkillsForecast />} />
        <Route path="/dashboard/employability" element={<Employability />} />
        <Route path="/dashboard/sectors" element={<Sectors />} />
        <Route path="/dashboard/geography" element={<Geography />} />
        <Route path="/dashboard/reports" element={<Reports />} />
        <Route path="/dashboard/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
