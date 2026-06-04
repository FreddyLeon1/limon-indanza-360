import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { lugares } from '../data/lugares'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix icono de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const iconos = {
  cascada: '💧',
  mirador: '🏔️',
  rio: '🌊',
  pueblo: '🏘️'
}

export default function MapPage() {
  const [ruta, setRuta] = useState([])
  const [info, setInfo] = useState(null)
  const navigate = useNavigate()

  const agregarPunto = (lugar) => {
    if (ruta.length >= 2) return
    if (ruta.length === 1 && ruta[0].id === lugar.id) {
      alert('⚠️ El destino debe ser diferente al origen. Selecciona otro lugar.')
      return
    }
    setRuta([...ruta, lugar])
  }

  const calcularTiempo = () => {
    if (ruta.length < 2) return null
    const [a, b] = ruta
    const R = 6371
    const dLat = (b.coordenadas[0] - a.coordenadas[0]) * Math.PI / 180
    const dLon = (b.coordenadas[1] - a.coordenadas[1]) * Math.PI / 180
    const x = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(a.coordenadas[0] * Math.PI/180) * Math.cos(b.coordenadas[0] * Math.PI/180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const distKm = R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
    const caminando = Math.round(distKm / 4 * 60)
    const enAuto = Math.round(distKm / 30 * 60)
    return { distKm: distKm.toFixed(2), caminando, enAuto }
  }

  const tiempo = calcularTiempo()

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a472a, #2d6a4f)',
        color: 'white',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <span style={{ fontSize: '28px' }}>🌿</span>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>Limón Indanza 360°</h1>
          <p style={{ fontSize: '12px', opacity: 0.8 }}>Amazonía Ecuatoriana • Morona Santiago</p>
        </div>
      </div>

      {/* Panel de ruta */}
      <div style={{
        background: '#f0fdf4',
        padding: '10px 16px',
        borderBottom: '1px solid #bbf7d0',
        fontSize: '13px'
      }}>
        {ruta.length === 0 && (
          <p style={{ color: '#555' }}>📍 Haz clic en <strong>"Agregar a ruta"</strong> en dos lugares para calcular el tiempo de viaje.</p>
        )}
        {ruta.length === 1 && (
          <p style={{ color: '#166534' }}>✅ Origen: <strong>{ruta[0].nombre}</strong> — Ahora selecciona el destino.</p>
        )}
        {ruta.length === 2 && tiempo && (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>🟢 <strong>{ruta[0].nombre}</strong> → 🔴 <strong>{ruta[1].nombre}</strong></span>
            <span>📏 {tiempo.distKm} km</span>
            <span>🚶 {tiempo.caminando} min caminando</span>
            <span>🚗 {tiempo.enAuto} min en auto</span>
            <button onClick={() => setRuta([])} style={{
              background: '#dc2626', color: 'white', border: 'none',
              borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px'
            }}>Limpiar ruta</button>
          </div>
        )}
      </div>

      {/* Mapa */}
      <MapContainer
        center={[-2.9769, -78.4183]}
        zoom={13}
        style={{ flex: 1 }}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {ruta.length === 2 && (
          <Polyline
            positions={[ruta[0].coordenadas, ruta[1].coordenadas]}
            color="#16a34a"
            weight={4}
            dashArray="10, 6"
          />
        )}
        {lugares.map(lugar => (
          <Marker key={lugar.id} position={lugar.coordenadas}>
            <Popup>
              <div style={{ minWidth: '180px' }}>
                <h3 style={{ marginBottom: '4px' }}>
                  {iconos[lugar.categoria]} {lugar.nombre}
                </h3>
                <p style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>
                  {lugar.descripcion}
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {lugar.foto360 && (
                    <button onClick={() => navigate(`/ver360/${lugar.id}`)} style={{
                      background: '#1a472a', color: 'white', border: 'none',
                      borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px'
                    }}>📸 Ver 360°</button>
                  )}
                  <button onClick={() => agregarPunto(lugar)} style={{
                    background: ruta.length >= 2 ? '#9ca3af' : '#2d6a4f',
                    color: 'white', border: 'none',
                    borderRadius: '6px', padding: '5px 10px',
                    cursor: ruta.length >= 2 ? 'not-allowed' : 'pointer', fontSize: '12px'
                  }}>📍 Agregar a ruta</button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}