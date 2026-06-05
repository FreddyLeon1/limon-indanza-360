import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { lugares } from '../data/lugares'

const iconos = {
  cascada: '💧',
  mirador: '🏔️',
  rio: '🌊',
  pueblo: '🏘️'
}

const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImJlNjMxMGY4OGUzMTQ0ZjVhNWQ4YmFiNGU2NDg1MTc4IiwiaCI6Im11cm11cjY0In0='

export default function MapPage3D() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const watchIdRef = useRef(null)
  const navigate = useNavigate()
  const [ruta, setRuta] = useState([])
  const [tiempo, setTiempo] = useState(null)
  const [navegando, setNavegando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [miUbicacion, setMiUbicacion] = useState(null)
  const miMarkerRef = useRef(null)
  const [instruccion, setInstruccion] = useState('')
  const miUbicacionRef = useRef(null)
  const coordsRutaRef = useRef([])
  const [recalculando, setRecalculando] = useState(false)
  const destinoRef = useRef(null)
  const ultimoRecalculoRef = useRef(0)

  useEffect(() => {
    if (map.current) return
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [-78.4183, -2.9769],
      zoom: 13,
      pitch: 0,
      bearing: 0
    })

    map.current.on('load', () => {
      // Cargar ícono de flecha
      const arrowImg = new Image(20, 20)
      arrowImg.onload = () => {
        if (!map.current.hasImage('arrow')) {
          map.current.addImage('arrow', arrowImg)
        }
      }
      arrowImg.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
          <polygon points="10,2 18,18 10,13 2,18" fill="white" opacity="0.9"/>
        </svg>
      `)}`

      // Agregar marcadores de lugares
      lugares.forEach(lugar => {
        const el = document.createElement('div')
        el.innerHTML = `<div style="
          background: white;
          border: 2px solid #16a34a;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">${iconos[lugar.categoria]}</div>`

        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div style="min-width:180px; font-family: sans-serif;">
            <h3 style="margin:0 0 4px">${iconos[lugar.categoria]} ${lugar.nombre}</h3>
            <p style="font-size:12px; color:#555; margin:0 0 8px">${lugar.descripcion}</p>
            <button onclick="window.__agregarPunto(${lugar.id})" style="
              background:#2d6a4f; color:white; border:none;
              border-radius:6px; padding:5px 10px; cursor:pointer; font-size:12px;
            ">📍 Agregar a ruta</button>
          </div>
        `)

        new maplibregl.Marker({ element: el })
          .setLngLat([lugar.coordenadas[1], lugar.coordenadas[0]])
          .setPopup(popup)
          .addTo(map.current)
      })
    })

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [])

  // Exponer función global para popups
  useEffect(() => {
    window.__agregarPunto = (id) => {
      const lugar = lugares.find(l => l.id === id)
      if (!lugar) return
      setRuta(rutaActual => {
        if (rutaActual.length >= 2) return rutaActual
        if (rutaActual.length === 1 && rutaActual[0].id === lugar.id) return rutaActual
        return [...rutaActual, lugar]
      })
    }
    return () => delete window.__agregarPunto
  }, [])

  // Calcular ruta cuando hay 2 puntos
  useEffect(() => {
    if (ruta.length === 2) calcularRuta(ruta[0], ruta[1])
    else {
      setTiempo(null)
      if (map.current?.getSource('ruta-auto')) {
        map.current.getSource('ruta-auto').setData({ type: 'FeatureCollection', features: [] })
      }
      if (map.current?.getSource('ruta-pie')) {
        map.current.getSource('ruta-pie').setData({ type: 'FeatureCollection', features: [] })
      }
    }
  }, [ruta])

  const calcularRuta = async (origen, destino) => {
    try {
      const puntoOrigen = origen.parking || origen.coordenadas
      const puntoDestino = destino.parking || destino.coordenadas

      const resAuto = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${API_KEY}&start=${puntoOrigen[1]},${puntoOrigen[0]}&end=${puntoDestino[1]},${puntoDestino[0]}`
      )
      const dataAuto = await resAuto.json()
      const coordsAuto = dataAuto.features[0].geometry.coordinates
      const distKm = (dataAuto.features[0].properties.segments[0].distance / 1000).toFixed(2)
      const enAuto = Math.round((distKm / 30) * 60)
      const pasos = dataAuto.features[0].properties.segments[0].steps

      dibujarRuta('ruta-auto', coordsAuto, '#16a34a', 5, false)
      coordsRutaRef.current = coordsAuto

      let distPie = 0
      let caminando = 0

      if (destino.parking) {
        const resPie = await fetch(
          `https://api.openrouteservice.org/v2/directions/foot-hiking?api_key=${API_KEY}&start=${destino.parking[1]},${destino.parking[0]}&end=${destino.coordenadas[1]},${destino.coordenadas[0]}`
        )
        const dataPie = await resPie.json()
        const coordsPie = dataPie.features[0].geometry.coordinates
        distPie = (dataPie.features[0].properties.segments[0].distance / 1000).toFixed(2)
        caminando = Math.round((distPie / 4) * 60)
        dibujarRuta('ruta-pie', coordsPie, '#f97316', 4, true)
      }

      setTiempo({ distKm, enAuto, distPie, caminando, tieneCamino: !!destino.parking, pasos })
      destinoRef.current = destino
      // Centrar mapa en la ruta
      const bounds = coordsAuto.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(coordsAuto[0], coordsAuto[0])
      )
      map.current.fitBounds(bounds, { padding: 60 })

    } catch (err) {
      console.error('Error ruta:', err)
    }
  }

  const dibujarRuta = (id, coords, color, width, dashed) => {
    if (!map.current.getSource(id)) {
      map.current.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.current.addLayer({
        id,
        type: 'line',
        source: id,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': color,
          'line-width': width,
          ...(dashed ? { 'line-dasharray': [2, 2] } : {})
        }
      })

      // Flechas de dirección solo para ruta en auto
      if (!dashed) {
        map.current.addLayer({
          id: `${id}-flechas`,
          type: 'symbol',
          source: id,
          layout: {
            'symbol-placement': 'line',
            'symbol-spacing': 80,
            'icon-image': 'arrow',
            'icon-size': 0.7,
            'icon-rotate': 90,
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          }
        })
      }
    }
    map.current.getSource(id).setData({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } }]
    })
  }

  const detectarUbicacion = () => {
    if (!navigator.geolocation) return alert('GPS no disponible')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords

        const ubicacion = {
          id: 'yo',
          nombre: 'Mi ubicación',
          coordenadas: [lat, lng],
          parking: null,
          categoria: 'yo'
        }

        setMiUbicacion([lat, lng])
        setRuta([ubicacion])

        // Marcador visual en el mapa
        if (miMarkerRef.current) miMarkerRef.current.remove()
        const el = document.createElement('div')
        el.style.cssText = `
          width: 20px; height: 20px;
          background: #f97316;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(249,115,22,0.4);
        `
        miMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current)

        // Volar a la ubicación
        map.current.flyTo({ center: [lng, lat], zoom: 15 })
      },
      () => alert('⚠️ No se pudo obtener tu ubicación. Activa el GPS.')
    )
  }
  const iniciarNavegacion = () => {
    if (!navigator.geolocation) return alert('GPS no disponible')

    setNavegando(true)

    // Saltar al inicio de la ruta al comenzar
    if (ruta.length >= 1) {
      const inicio = ruta[0].parking || ruta[0].coordenadas
      map.current.easeTo({
        center: [inicio[1], inicio[0]],
        pitch: 60,
        zoom: 16
      })
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, heading } = pos.coords

                let latSnap = lat
        let lngSnap = lng

        // Snap to route — pegar el punto a la línea de la ruta
        try {
          const coords = coordsRutaRef.current
          if (coords.length > 0) {
            let minDist = Infinity
            let closest = coords[0]
            coords.forEach(coord => {
              const dLat = coord[1] - lat
              const dLng = coord[0] - lng
              const dist = Math.sqrt(dLat * dLat + dLng * dLng)
              if (dist < minDist) {
                minDist = dist
                closest = coord
              }
            })
            lngSnap = closest[0]
            latSnap = closest[1]
          }
        } catch (e) {
          console.error('Snap error:', e)
        }
        // Verificar si el usuario se alejó de la ruta
        const coords = coordsRutaRef.current
        if (coords.length > 0) {
          let minDist = Infinity
          coords.forEach(coord => {
            const dLat = coord[1] - lat
            const dLng = coord[0] - lng
            const distMetros = Math.sqrt(dLat * dLat + dLng * dLng) * 111000
            if (distMetros < minDist) minDist = distMetros
          })

          const ahora = Date.now()
          // Si está a más de 50m de la ruta y han pasado 10 segundos desde el último recálculo
          if (minDist > 50 && ahora - ultimoRecalculoRef.current > 10000 && destinoRef.current) {
            ultimoRecalculoRef.current = ahora
            setRecalculando(true)
            setInstruccion('🔄 Recalculando ruta...')

            const nuevoPunto = {
              id: 'yo',
              nombre: 'Mi ubicación',
              coordenadas: [lat, lng],
              parking: null,
              categoria: 'yo'
            }

            calcularRuta(nuevoPunto, destinoRef.current).then(() => {
              setRecalculando(false)
              setInstruccion('✅ Ruta actualizada')
              setTimeout(() => setInstruccion(''), 3000)
            })
          }
        }
        miUbicacionRef.current = [lngSnap, latSnap]
        setMiUbicacion([latSnap, lngSnap])

        // Marcador azul pulsante para posición en tiempo real
        if (!map.current.getSource('usuario')) {
          map.current.addSource('usuario', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'Point', coordinates: [lngSnap, latSnap] } }
          })
          // Círculo exterior pulsante
          map.current.addLayer({
            id: 'usuario-pulso',
            type: 'circle',
            source: 'usuario',
            paint: {
              'circle-radius': 18,
              'circle-color': '#3b82f6',
              'circle-opacity': 0.3
            }
          })
          // Círculo interior sólido
          map.current.addLayer({
            id: 'usuario',
            type: 'circle',
            source: 'usuario',
            paint: {
              'circle-radius': 10,
              'circle-color': '#2563eb',
              'circle-stroke-width': 3,
              'circle-stroke-color': 'white'
            }
          })
        } else {
          map.current.getSource('usuario').setData({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lngSnap, latSnap] }
          })
        }

        // Rotar y seguir al usuario
        map.current.easeTo({
          center: [lngSnap, latSnap],
          bearing: heading || 0,
          pitch: 60,
          zoom: 16,
          duration: 500
        })

        // Mostrar instrucción del paso actual
        if (tiempo?.pasos) {
          setInstruccion(tiempo.pasos[0]?.instruction || '')
        }
      },
      () => alert('No se pudo obtener ubicación'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    )
  }

  const detenerNavegacion = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
    setNavegando(false)
    setInstruccion('')
    map.current.easeTo({ pitch: 0, bearing: 0, zoom: 13 })
  }

  const agregarPunto = (lugar) => {
    if (ruta.length >= 2) return
    if (ruta.length === 1 && ruta[0].id === lugar.id) {
      alert('⚠️ El destino debe ser diferente al origen.')
      return
    }
    setRuta([...ruta, lugar])
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

     {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a472a, #2d6a4f)',
        color: 'white', padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 10
      }}>
        <span style={{ fontSize: '24px' }}>🌿</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <button onClick={() => navigate('/')} style={{
            background: 'rgba(255,255,255,0.2)', color: 'white',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50px',
            padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
          }}>← Inicio</button>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 'bold' }}>Limón Indanza 360°</h1>
            <p style={{ fontSize: '11px', opacity: 0.8 }}>Amazonía Ecuatoriana</p>
          </div>
          <button
            onClick={detectarUbicacion}
            style={{
              background: miUbicacion ? '#16a34a' : '#f97316',
              color: 'white', border: 'none', borderRadius: '50px',
              padding: '8px 18px', cursor: 'pointer', fontSize: '13px',
              fontWeight: 'bold', marginLeft: 'auto',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            {miUbicacion ? '✅ Ubicado' : '🎯 ¿Dónde estoy?'}
          </button>
        </div>
      </div>
          {/* Instrucción de navegación */}
      {navegando && instruccion && (
        <div style={{
          background: recalculando ? '#dc2626' : '#1a472a',
          color: 'white', padding: '12px 16px', fontSize: '15px',
          fontWeight: 'bold', textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'background 0.3s'
        }}>
          {instruccion}
        </div>
      )}  
      {/* Buscador */}
      <div style={{ position: 'relative', padding: '8px 16px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <input
          type="text"
          placeholder="🔍 Buscar destino..."
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setMostrarSugerencias(true) }}
          style={{
            width: '100%', padding: '8px 14px', borderRadius: '50px',
            border: '2px solid #16a34a', fontSize: '14px',
            outline: 'none', boxSizing: 'border-box'
          }}
        />
        {mostrarSugerencias && busqueda.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: '16px', right: '16px',
            background: 'white', borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden'
          }}>
            {lugares.filter(l => l.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(lugar => (
              <div key={lugar.id} onClick={() => {
                agregarPunto(lugar)
                setBusqueda('')
                setMostrarSugerencias(false)
              }} style={{
                padding: '10px 16px', cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px'
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
            ))}
            {lugares.filter(l => l.nombre.toLowerCase().includes(busqueda.toLowerCase())).length === 0 && (
              <div style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '14px' }}>No se encontraron lugares</div>
            )}
          </div>
        )}
      </div>

      {/* Panel de ruta */}
      <div style={{
        background: '#f0fdf4', padding: '8px 16px',
        borderBottom: '1px solid #bbf7d0', fontSize: '13px'
      }}>
        {ruta.length === 0 && (
          <p style={{ color: '#555' }}>📍 Busca un destino o haz clic en un lugar del mapa.</p>
        )}
        {ruta.length === 1 && (
          <p style={{ color: '#166534' }}>✅ Origen: <strong>{ruta[0].nombre}</strong> — Selecciona el destino.</p>
        )}
        {ruta.length === 2 && tiempo && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>🟢 <strong>{ruta[0].nombre}</strong> → 🔴 <strong>{ruta[1].nombre}</strong></span>
            <span>📏 {tiempo.distKm} km</span>
            <span>🚗 {tiempo.enAuto} min</span>
            {tiempo.tieneCamino && (
              <span style={{ color: '#166534', fontWeight: 'bold' }}>
                🥾 +{tiempo.distPie} km ({tiempo.caminando} min a pie)
              </span>
            )}
            {!navegando ? (
              <button onClick={iniciarNavegacion} style={{
                background: '#16a34a', color: 'white', border: 'none',
                borderRadius: '6px', padding: '6px 14px',
                cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
              }}>▶ Iniciar navegación</button>
            ) : (
              <button onClick={detenerNavegacion} style={{
                background: '#dc2626', color: 'white', border: 'none',
                borderRadius: '6px', padding: '6px 14px',
                cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
              }}>⏹ Detener</button>
            )}
            <button onClick={() => { setRuta([]); setNavegando(false) }} style={{
              background: '#6b7280', color: 'white', border: 'none',
              borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px'
            }}>✖ Limpiar</button>
          </div>
        )}
      </div>

      {/* Mapa 3D */}
      <div ref={mapContainer} style={{ flex: 1 }} />

    </div>
  )
}