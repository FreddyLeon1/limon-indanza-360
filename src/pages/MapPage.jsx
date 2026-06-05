import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet'
import { useState, useEffect } from 'react'
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

  const [busqueda, setBusqueda] = useState('')
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)

  const [info, setInfo] = useState(null)
  const navigate = useNavigate()
  const [miUbicacion, setMiUbicacion] = useState(null)

  const [watchId, setWatchId] = useState(null)

  const detectarUbicacion = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización')
      return
    }

    // Si ya está activo, desactivar
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
      setMiUbicacion(null)
      setRuta([])
      return
    }

    // Activar tracking en tiempo real
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const ubicacion = {
          id: 'yo',
          nombre: 'Mi ubicación',
          coordenadas: [pos.coords.latitude, pos.coords.longitude],
          parking: null,
          categoria: 'yo'
        }
        setMiUbicacion(ubicacion)
        // Solo actualiza origen si ya estaba usando mi ubicación
        setRuta(rutaActual => {
          if (rutaActual.length === 0 || rutaActual[0].id === 'yo') {
            return rutaActual.length === 2
              ? [ubicacion, rutaActual[1]]
              : [ubicacion]
          }
          return rutaActual
        })
      },
      () => alert('⚠️ No se pudo obtener tu ubicación. Activa el GPS.'),
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    )
    setWatchId(id)
  }

  const agregarPunto = (lugar) => {
    if (ruta.length >= 2) return
    if (ruta.length === 1 && ruta[0].id === lugar.id) {
      alert('⚠️ El destino debe ser diferente al origen. Selecciona otro lugar.')
      return
    }
    setRuta([...ruta, lugar])
  }

const [rutaLinea, setRutaLinea] = useState([])
const [rutaPie, setRutaPie] = useState([])

const calcularRuta = async (lugarOrigen, lugarDestino) => {
  try {
    const apiKey = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImJlNjMxMGY4OGUzMTQ0ZjVhNWQ4YmFiNGU2NDg1MTc4IiwiaCI6Im11cm11cjY0In0='

    const puntoOrigen = lugarOrigen.parking || lugarOrigen.coordenadas
    const puntoDestino = lugarDestino.parking || lugarDestino.coordenadas

    // Ruta en auto
    const urlAuto = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${puntoOrigen[1]},${puntoOrigen[0]}&end=${puntoDestino[1]},${puntoDestino[0]}`
    const resAuto = await fetch(urlAuto)
    const dataAuto = await resAuto.json()
    const coords = dataAuto.features[0].geometry.coordinates.map(c => [c[1], c[0]])
    const distKm = (dataAuto.features[0].properties.segments[0].distance / 1000).toFixed(2)
    const enAuto = Math.round((distKm / 30) * 60)

    // Ruta a pie por sendero si tiene parking
    let caminando = 0
    let distPie = 0
    let coordsPie = []

    if (lugarDestino.parking) {
      const urlPie = `https://api.openrouteservice.org/v2/directions/foot-hiking?api_key=${apiKey}&start=${lugarDestino.parking[1]},${lugarDestino.parking[0]}&end=${lugarDestino.coordenadas[1]},${lugarDestino.coordenadas[0]}`
      const resPie = await fetch(urlPie)
      const dataPie = await resPie.json()
      coordsPie = dataPie.features[0].geometry.coordinates.map(c => [c[1], c[0]])
      distPie = (dataPie.features[0].properties.segments[0].distance / 1000).toFixed(2)
      caminando = Math.round((distPie / 4) * 60)
    }

    setRutaLinea(coords)
    setRutaPie(coordsPie)
    return { distKm, enAuto, caminando, distPie, tieneCamino: !!lugarDestino.parking }

  } catch (error) {
    console.error('Error calculando ruta:', error)
    return null
  }
}


  const [tiempo, setTiempo] = useState(null)

useEffect(() => {
  if (ruta.length === 2) {
    calcularRuta(ruta[0], ruta[1]).then(t => setTiempo(t))
  } else {
    setTiempo(null)
    setRutaLinea([])
    setRutaPie([])
  }
}, [ruta])

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '50px',
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold'
            }}
          >
            ← Inicio
          </button>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>Limón Indanza 360°</h1>
            <p style={{ fontSize: '12px', opacity: 0.8 }}>Amazonía Ecuatoriana • Morona Santiago</p>
          </div>
          
          <button
            onClick={detectarUbicacion}
            style={{
              background: miUbicacion ? '#16a34a' : '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              padding: '8px 18px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginLeft: 'auto',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {watchId ? '🔴 Detener GPS' : miUbicacion ? '✅ Ubicado' : '🎯 ¿Dónde estoy?'}
          </button>

        </div>
      </div>

{/* Buscador */}
      <div style={{ position: 'relative', padding: '8px 16px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <input
          type="text"
          placeholder="🔍 Buscar destino..."
          value={busqueda}
          onChange={e => {
            setBusqueda(e.target.value)
            setMostrarSugerencias(true)
          }}
          style={{
            width: '100%',
            padding: '8px 14px',
            borderRadius: '50px',
            border: '2px solid #16a34a',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        {mostrarSugerencias && busqueda.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '16px',
            right: '16px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 1000,
            overflow: 'hidden'
          }}>
            {lugares
              .filter(l => l.nombre.toLowerCase().includes(busqueda.toLowerCase()))
              .map(lugar => (
                <div
                  key={lugar.id}
                  onClick={() => {
                    agregarPunto(lugar)
                    setBusqueda('')
                    setMostrarSugerencias(false)
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '14px'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#f0fdf4'}
                  onMouseOut={e => e.currentTarget.style.background = 'white'}
                >
                  <span>{iconos[lugar.categoria]}</span>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{lugar.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{lugar.descripcion}</div>
                  </div>
                </div>
              ))
            }
            {lugares.filter(l => l.nombre.toLowerCase().includes(busqueda.toLowerCase())).length === 0 && (
              <div style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '14px' }}>
                No se encontraron lugares
              </div>
            )}
          </div>
        )}
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
            <span>📏 {tiempo.distKm} km en auto</span>
            <span>🚗 {tiempo.enAuto} min en auto</span>
            {tiempo.tieneCamino && (
              <span style={{ color: '#166534', fontWeight: 'bold' }}>
                🥾 +{tiempo.distPie} km caminando ({tiempo.caminando} min a pie)
              </span>
            )}
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
        {rutaLinea.length > 0 && (
          <Polyline
            positions={rutaLinea}
            color="#16a34a"
            weight={4}
          />
        )}
        {rutaPie.length > 0 && (
          <Polyline
            positions={rutaPie}
            color="#f97316"
            weight={3}
            dashArray="8, 6"
          />
        )}

        {miUbicacion && (
          <Marker
            position={miUbicacion.coordenadas}
            icon={L.divIcon({
              html: `<div style="
                background: #f97316;
                border: 3px solid white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                box-shadow: 0 0 0 4px rgba(249,115,22,0.4);
                animation: pulse 1.5s infinite;
              "></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
              className: ''
            })}
          >
            <Popup>
              <strong>🎯 Estás aquí</strong>
            </Popup>
          </Marker>
        )}

        {lugares.map(lugar => (
          <Marker key={lugar.id} position={lugar.coordenadas}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <span>{iconos[lugar.categoria]} <strong>{lugar.nombre}</strong></span>
            </Tooltip>
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