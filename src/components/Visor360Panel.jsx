import { useEffect, useRef } from 'react'
import { Viewer } from '@photo-sphere-viewer/core'
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin'
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'

import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/virtual-tour-plugin/index.css'
import '@photo-sphere-viewer/markers-plugin/index.css'

// Calcula el rumbo real (en grados, 0 = Norte) desde un punto GPS hacia otro
function calcularRumbo(lat1, lng1, lat2, lng2) {
  const toRad = d => (d * Math.PI) / 180
  const toDeg = r => (r * 180) / Math.PI
  const φ1 = toRad(lat1), φ2 = toRad(lat2)
  const Δλ = toRad(lng2 - lng1)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  const θ = Math.atan2(y, x)
  return (toDeg(θ) + 360) % 360
}
function calcularDistanciaMetros(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = d => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
export default function Visor360Panel({ fotos360, nombreLugar, fullScreen = false }) {
  const contenedorRef = useRef(null)
  const viewerRef = useRef(null)

  useEffect(() => {
    if (!contenedorRef.current || fotos360.length === 0) return
    // Inyecta el estilo de hover una sola vez (si no existe ya)
    if (!document.getElementById('estilo-hotspot-recorrido')) {
      const estilo = document.createElement('style')
      estilo.id = 'estilo-hotspot-recorrido'
      estilo.textContent = `
        .hotspot-btn {
          position: relative;
          width: 44px; height: 44px;
          border-radius: 50%;
          background: rgba(74,107,130,0.55);
          backdrop-filter: blur(4px);
          border: 2px solid rgba(244,241,232,0.85);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(0,0,0,0.35);
          transform: scaleY(0.4);
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .hotspot-btn svg {
          transform: scaleY(2.5);
        }
        .hotspot-ring {
          position: absolute;
          left: 50%; top: 50%;
          width: 60px; height: 60px;
          margin-left: -30px; margin-top: -30px;
          border-radius: 50%;
          border: 2px solid rgba(244,241,232,0.75);
          opacity: 0;
          animation: hotspot-pulso 2.2s ease-out infinite;
        }
        @keyframes hotspot-pulso {
          0% { transform: scaleY(0.4) scale(1); opacity: 0.8; }
          100% { transform: scaleY(0.4) scale(1.9); opacity: 0; }
        }
        .hotspot-wrap:hover .hotspot-btn {
          transform: scaleY(0.4) scale(1.1);
          background: rgba(74,107,130,0.8);
        }
          .psv-tooltip {
          font-family: 'Inter', sans-serif !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          background: rgba(18,29,36,0.92) !important;
          color: #F4F1E8 !important;
          border-radius: 8px !important;
          padding: 6px 12px !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.35) !important;
        }
      `
      document.head.appendChild(estilo)
    }
    // Ya NO incluimos "links" aquí — nosotros dibujamos las flechas a mano abajo
    const nodes = fotos360.map(foto => ({
      id: String(foto.id),
      panorama: foto.url,
      name: foto.nombre_escena ? `${foto.orden}. ${foto.nombre_escena}` : `Punto ${foto.orden}`,
      gps: [foto.lng, foto.lat, 0],
      sphereCorrection: { pan: `${foto.north_offset || 0}deg` },
    }))

    const viewer = new Viewer({
      container: contenedorRef.current,
      panorama: nodes[0].panorama,
      touchmoveTwoFingers: false,
      mousewheelCtrlKey: false,
      navbar: ['zoom', 'fullscreen'],
      plugins: [
        MarkersPlugin,
        [
          VirtualTourPlugin,
          {
            positionMode: 'gps',
            renderMode: '3d',
            nodes,
            startNodeId: nodes[0].id,
          },
        ],
      ],
    })
    // Precarga en segundo plano el resto de fotos del recorrido, sin bloquear la primera
      fotos360.slice(1).forEach(foto => {
        const img = new Image()
        img.src = foto.url
      })
    viewerRef.current = viewer

    const virtualTour = viewer.getPlugin(VirtualTourPlugin)
    const markers = viewer.getPlugin(MarkersPlugin)

    const dibujarMarcadores = () => {
      markers.clearMarkers()

      // Marcador de Norte - Flecha direccional
      markers.addMarker({
        id: 'norte',
        position: { yaw: 0, pitch: 0 },
        html: `
          <div style="
            display:flex;
            flex-direction:column;
            align-items:center;
            opacity:0.7;
            transition: opacity 0.3s ease;
            cursor: default;
          ">
            <svg width="28" height="32" viewBox="0 0 28 32" fill="none" style="display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
              <!-- Flecha apuntando al norte -->
              <path d="M14 2L2 24L14 16L26 24L14 2Z" 
                fill="rgba(244,241,232,0.5)"
                stroke="rgba(244,241,232,0.3)"
                stroke-width="1.5"
                stroke-linejoin="round"
              />
              <!-- Punto central -->
              <circle cx="14" cy="10" r="3" fill="rgba(244,241,232,0.4)" />
            </svg>
            <span style="
              font-family: 'Inter', sans-serif;
              font-size: 10px;
              font-weight: 600;
              color: rgba(244,241,232,0.5);
              margin-top: -3px;
              letter-spacing: 1px;
            ">N</span>
          </div>
        `,
      })

      // Encuentra la foto actual (la que se está mostrando ahora)
      const idActual = virtualTour.getCurrentNode()?.id
      const fotoActual = fotos360.find(f => String(f.id) === String(idActual))
      if (!fotoActual) return

      const hotspots = fotoActual.hotspots || []
      hotspots.forEach(h => {
        const fotoDestino = fotos360.find(f => String(f.id) === String(h.target))
        if (!fotoDestino || !fotoDestino.lat || !fotoDestino.lng) return

        const rumbo = calcularRumbo(fotoActual.lat, fotoActual.lng, fotoDestino.lat, fotoDestino.lng)
        const rumboAjustado = rumbo - (fotoActual.north_offset || 0)

        const distancia = calcularDistanciaMetros(fotoActual.lat, fotoActual.lng, fotoDestino.lat, fotoDestino.lng)
        const alturaCamara = 1.7
        // Multiplicamos la altura para exagerar el ángulo hacia abajo (más cerca del piso real)
        const pitchPiso = -(Math.atan2(alturaCamara * 1.8, distancia) * 180 / Math.PI)

        // Puntos más lejanos se ven más chicos, como en la realidad
        const escalaDistancia = Math.max(0.6, Math.min(1.3, 10 / distancia))

        markers.addMarker({
          id: `link-${fotoDestino.id}`,
          position: { yaw: `${rumbo}deg`, pitch: `${pitchPiso}deg` },
          tooltip: h.label || 'Continuar',
          html: `
            <div class="hotspot-wrap" style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;transform:scale(${escalaDistancia});">
              <div class="hotspot-ring"></div>
              <div class="hotspot-btn">
      <div style="
        width: 12px; 
        height: 12px; 
        border-radius: 50%; 
        background: #F4F1E8;
        box-shadow: 0 0 12px rgba(244,241,232,0.6);
        animation: punto-pulso 1.8s ease-in-out infinite;
      "></div>
    </div>
  </div>
          `,
          data: { targetId: String(fotoDestino.id), rumbo },
        })
      })
    }

    markers.addEventListener('select-marker', async ({ marker }) => {
      if (marker.data?.targetId) {
        await viewer.animate({ zoom: 100, speed: '20rpm' })
        await virtualTour.setCurrentNode(marker.data.targetId, { transition: false, zoomTo: 50 })
      }
    })

    virtualTour.addEventListener('node-changed', dibujarMarcadores)
    viewer.addEventListener('ready', dibujarMarcadores)

    return () => {
      viewer.destroy()
      viewerRef.current = null
    }
  }, [fotos360.map(f => f.id).join(',')])

  if (fotos360.length === 0) {
    return (
      <div style={{
        height: '100%', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#121D24', textAlign: 'center', padding: '0 20px'
      }}>
        <p style={{ fontSize: '14px', fontFamily: "'Inter', sans-serif", fontWeight: 500, color: '#F4F1E8', opacity: 0.7, margin: 0, maxWidth: '260px' }}>
          Este rincón todavía guarda su recorrido 360° en secreto.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={contenedorRef}
      style={{
        position: 'relative', width: '100%',
        height: fullScreen ? '100%' : '60vh',
        minHeight: fullScreen ? undefined : '320px',
        borderRadius: fullScreen ? 0 : '12px',
        overflow: 'hidden', background: '#121D24',
      }}
    />
  )
}