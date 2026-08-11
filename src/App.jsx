import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import MapPage3D from './pages/MapPage3D'
//import Viewer360 from './pages/Viewer360'
import Recorridos from './pages/Recorridos'
import DetalleLugar from './pages/DetalleLugar'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import ProtegerAdmin from './pages/ProtegerAdmin'
import { registrarEvento } from './supabase'
import './App.css'


function RegistroSesion() {
  const location = useLocation()
  useEffect(() => {
    if (!sessionStorage.getItem('sesion-registrada')) {
      registrarEvento('sesion_iniciada', null, location.pathname)
      sessionStorage.setItem('sesion-registrada', 'true')
    }
  }, [])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <RegistroSesion />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rutasmaps" element={<MapPage3D />} />
        {/* <Route path="/ver360/:id" element={<Viewer360 />} /> */}
        <Route path="/portal360" element={<Recorridos />} />
        <Route path="/lugar/:id" element={<DetalleLugar />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/metricas" element={<ProtegerAdmin><Dashboard /></ProtegerAdmin>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App