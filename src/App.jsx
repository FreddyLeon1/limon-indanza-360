import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import MapPage from './pages/MapPage'
import MapPage3D from './pages/MapPage3D'
import Viewer360 from './pages/Viewer360'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/mapa3d" element={<MapPage3D />} />
        <Route path="/ver360/:id" element={<Viewer360 />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App