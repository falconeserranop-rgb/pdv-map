import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MapPage } from './pages/MapPage'
import { PDVDetailPage } from './pages/PDVDetailPage'
import { LoginPage } from './pages/admin/LoginPage'
import { DashboardPage } from './pages/admin/DashboardPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/pdv/:slug" element={<PDVDetailPage />} />
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}
