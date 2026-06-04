import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MapPage from './pages/MapPage'
import Viewer360 from './pages/Viewer360'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/ver360/:id" element={<Viewer360 />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App