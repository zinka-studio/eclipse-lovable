import { Routes, Route } from 'react-router-dom'
import LenisProvider from '@/components/ui/LenisProvider'
import Home from './pages/Home'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'

export default function App() {
  return (
    <LenisProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
      </Routes>
    </LenisProvider>
  )
}
