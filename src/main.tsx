import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { PartnerLoginPage } from './pages/PartnerLoginPage'
import { PartnerDashboardPage } from './pages/PartnerDashboardPage'

// Forzar título en runtime para evitar caché de HTML antiguo
document.title = 'FLASH - Bons Plans Genève'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/partner/login" element={<PartnerLoginPage />} />
        <Route path="/partner/dashboard/:partnerId" element={<PartnerDashboardPage />} />
        <Route path="/partner/dashboard" element={<PartnerDashboardPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
