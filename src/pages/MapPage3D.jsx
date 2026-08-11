import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { supabase, registrarEvento } from '../supabase'
import BotonContacto from '../components/BotonContacto'
import isotipoUumka from '../assets/uumka-isotipo.png'
import { ArrowLeft, Compass, LocateFixed, Wifi, WifiOff, Globe2, Building2, Leaf, Heart, MapPin, CheckCircle2, ArrowRight, ArrowUp, ArrowDown, Ruler, Car, Footprints, Play, X, Phone, MessageCircle, Camera, Image as ImageIcon, Video, Clock, Wallet, Timer, Search, Flag, Undo2, RotateCw, Volume2, VolumeX } from 'lucide-react'
const API_KEY = 'c19afa1d-22b8-4219-9f95-375cb5de4358'
const NUMERO_WHATSAPP_NEGOCIO = '593989260119'
const MOSTRAR_ITINERARIO = false
const PARQUE_CENTRAL = {
  id: 'parque',
  nombre: 'Parque Central Limón Indanza',
  coordenadas_lat: -2.966448,
  coordenadas_lng: -78.430837,
  parking_lat: null,
  categorias: { icono: '🏛️' }
}
const traducirInstruccion = (texto) => {
  if (!texto) return ''
  const traducciones = [
    { en: /turn sharp left/i,      es: '↰ Giro cerrado a la izquierda ' },
    { en: /turn sharp right/i,     es: '↱ Giro cerrado a la derecha ' },
    { en: /turn slight left/i,     es: '↖ Gira levemente a la izquierda ' },
    { en: /turn slight right/i,    es: '↗ Gira levemente a la derecha ' },
    { en: /turn left/i,            es: '← Gira a la izquierda ' },
    { en: /turn right/i,           es: '→ Gira a la derecha ' },
    { en: /make a u-turn/i,        es: '↩ Da la vuelta ' },
    { en: /head north/i,           es: '↑ Dirígete hacia el norte ' },
    { en: /head south/i,           es: '↓ Dirígete hacia el sur ' },
    { en: /head east/i,            es: '→ Dirígete hacia el este ' },
    { en: /head west/i,            es: '← Dirígete hacia el oeste ' },
    { en: /head northeast/i,       es: '↗ Dirígete hacia el noreste ' },
    { en: /head northwest/i,       es: '↖ Dirígete hacia el noroeste ' },
    { en: /head southeast/i,       es: '↘ Dirígete hacia el sureste ' },
    { en: /head southwest/i,       es: '↙ Dirígete hacia el suroeste ' },
    { en: /continue straight/i,    es: '↑ Continúa recto ' },
    { en: /continue/i,             es: '↑ Continúa recto ' },
    { en: /keep left/i,            es: '↖ Mantente a la izquierda ' },
    { en: /keep right/i,           es: '↗ Mantente a la derecha ' },
    { en: /at the roundabout/i,    es: '🔄 En la rotonda ' },
    { en: /enter the roundabout/i, es: '🔄 Entra a la rotonda ' },
    { en: /exit the roundabout/i,  es: '🔄 Sal de la rotonda ' },
    { en: /you have arrived/i,     es: '🎯 ¡Has llegado a tu destino! ' },
    { en: /arrive at/i,            es: '🎯 Llegaste a ' },
    { en: /destination/i,          es: '🎯 Destino ' },
    { en: /onto /i,                es: 'hacia ' },
    { en: /on the left/i,          es: 'a tu izquierda ' },
    { en: /on the right/i,         es: 'a tu derecha ' },
  ]
  let resultado = texto
  for (const t of traducciones) {
    if (t.en.test(resultado)) {
      resultado = resultado.replace(t.en, t.es)
      break
    }
  }
  return resultado
}

// Íconos en SVG crudo — necesarios porque los popups del mapa son HTML en texto plano,
// no JSX, así que no podemos usar componentes de Lucide directamente ahí.
const svgCompass = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`
const svgInfo = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
const svgHeartOutline = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
const svgHeartFilled = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
const svgCamera360 = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`
const svgBuilding = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`
const svgBuildingPin = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C85A32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`
const svgLeafPin = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C85A32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`

export default function MapaUnificado() {
  const horaActualGlobal = new Date().getHours()
  const modoNocturno = horaActualGlobal < 6 || horaActualGlobal >= 18

  const mapContainer = useRef(null)
  const map = useRef(null)
  const watchIdRef = useRef(null)
  const miMarkerRef = useRef(null)
  const marcadoresRef = useRef([])
  const navigate = useNavigate()
  const location = useLocation()
  const destinoInicialProcesado = useRef(false)

  const [todosLugares, setTodosLugares] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [ruta, setRuta] = useState([])
  const [tiempo, setTiempo] = useState(null)
  const [navegando, setNavegando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [miUbicacion, setMiUbicacion] = useState(null)
  const [instruccion, setInstruccion] = useState('')
  const [recalculando, setRecalculando] = useState(false)
  const [mapaListo, setMapaListo] = useState(false)
  const [lugarSeleccionado, setLugarSeleccionado] = useState(null)
  const [audioActivo, setAudioActivo] = useState(true)
  const [progresoRuta, setProgresoRuta] = useState(null)
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem('favoritos-limon')
    return guardados ? JSON.parse(guardados) : []
  })
  const [mostrarItinerario, setMostrarItinerario] = useState(false)
  const [calidadConexion, setCalidadConexion] = useState(navigator.onLine ? 'buena' : 'offline')
  const [verHint, setVerHint] = useState(() => !localStorage.getItem('mapa-hint-visto'))
  const cerrarHint = () => {
    setVerHint(false)
    localStorage.setItem('mapa-hint-visto', '1')
  }
  const audioActivoRef = useRef(true)
  const coordsRutaRef = useRef([])
  const destinoRef = useRef(null)
  const ultimoRecalculoRef = useRef(0)
  const miUbicacionEstado = useRef(null)
  const ultimaInstruccionRef = useRef('')

  const hablar = (texto) => {
    if (!texto || !audioActivoRef.current) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(texto)
    utterance.lang = 'es-ES'
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.volume = 1
    window.speechSynthesis.speak(utterance)
  }

  const esFavorito = (id) => favoritos.some(f => f.id === id)
  const tiene360Lugar = (lugar) => (lugar.fotos || []).some(f => f.es_360 || f.tipo === 'imagen_360' || f.tipo === 'video_360')
  const tieneVideoLugar = (lugar) => (lugar.fotos || []).some(f => f.tipo === 'video' || f.tipo === 'video_360')

  const toggleFavorito = (lugar) => {
    setFavoritos(prev => {
      const existe = prev.find(f => f.id === lugar.id)
      const nuevos = existe
        ? prev.filter(f => f.id !== lugar.id)
        : [...prev, {
            id: lugar.id,
            nombre: lugar.nombre,
            categorias: lugar.categorias,
            tipo: lugar.tipo,
            coordenadas_lat: lugar.coordenadas_lat,
            coordenadas_lng: lugar.coordenadas_lng
          }]
      localStorage.setItem('favoritos-limon', JSON.stringify(nuevos))

      // Solo registramos el evento cuando se AGREGA (no cuando se quita)
      if (!existe) registrarEvento('agregar_itinerario', lugar.id)

      return nuevos
    })
  }
  const armarMensajeItinerario = () => {
  const lista = favoritos.map(l => `• ${l.nombre}`).join('\n')
  const texto = `Hola! Quiero cotizar un tour personalizado con estos lugares:\n\n${lista}\n\n¿Me pueden ayudar con información de precio y disponibilidad?`
  return encodeURIComponent(texto)
}
  const limpiarTodo = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    window.speechSynthesis.cancel()
    if (map.current?.getSource('ruta-auto')) {
      map.current.getSource('ruta-auto').setData({ type: 'FeatureCollection', features: [] })
    }
    if (map.current?.getSource('ruta-pie')) {
      map.current.getSource('ruta-pie').setData({ type: 'FeatureCollection', features: [] })
    }
    if (map.current?.getSource('usuario')) {
      map.current.getSource('usuario').setData({ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] } })
    }
    setRuta([])
    setNavegando(false)
    setInstruccion('')
    setTiempo(null)
    setProgresoRuta(null)
    coordsRutaRef.current = []
    destinoRef.current = null
    map.current?.easeTo({ pitch: 0, bearing: 0, zoom: 13 })
  }

  useEffect(() => {
    supabase
    .from('lugares')
    .select('*, categorias(nombre, icono, color), fotos(tipo, es_360)')
    .eq('activo', true)
      .then(({ data, error }) => {
        if (error) console.error('Error:', error)
        else setTodosLugares(data || [])
      })
  }, [])

  // Si venimos de "Cómo llegar" desde Portal 360° o Detalle de lugar, trazamos la ruta automáticamente
  useEffect(() => {
    if (!mapaListo || todosLugares.length === 0 || destinoInicialProcesado.current) return
    const idDestino = location.state?.irADestino
    if (!idDestino) return

    const lugarDestino = todosLugares.find(l => l.id === idDestino)
    if (lugarDestino) {
      destinoInicialProcesado.current = true
      registrarEvento('clic_como_llegar', lugarDestino.id)
      setRuta([PARQUE_CENTRAL, lugarDestino])
      map.current.flyTo({ center: [PARQUE_CENTRAL.coordenadas_lng, PARQUE_CENTRAL.coordenadas_lat], zoom: 14 })
    }
  }, [mapaListo, todosLugares, location.state])

  useEffect(() => {
    miUbicacionEstado.current = miUbicacion
  }, [miUbicacion])

  useEffect(() => {
    const evaluarConexion = () => {
      if (!navigator.onLine) { setCalidadConexion('offline'); return }
      const tipo = navigator.connection?.effectiveType
      if (tipo === '2g' || tipo === 'slow-2g') setCalidadConexion('lenta')
      else setCalidadConexion('buena')
    }
    evaluarConexion()
    navigator.connection?.addEventListener('change', evaluarConexion)

    const sinInternet = () => {
      const rutaGuardada = localStorage.getItem('ultima-ruta')
      if (rutaGuardada) {
        const datos = JSON.parse(rutaGuardada)
        if (Date.now() - datos.timestamp < 86400000) {
          dibujarRuta('ruta-auto', datos.coordsAuto, '#C85A32', 5, false)
          coordsRutaRef.current = datos.coordsAuto
          setInstruccion('📵 Sin internet — usando ruta guardada')
          hablar('Sin internet, usando ruta guardada')
        }
      }
    }
    window.addEventListener('offline', sinInternet)
    window.addEventListener('offline', evaluarConexion)
    window.addEventListener('online', () => {
      setInstruccion('✅ Conexión restaurada')
      hablar('Conexión restaurada')
      evaluarConexion()
    })
    return () => {
      window.removeEventListener('offline', sinInternet)
      window.removeEventListener('offline', evaluarConexion)
      window.removeEventListener('online', () => {})
      navigator.connection?.removeEventListener('change', evaluarConexion)
    }
  }, [])

  useEffect(() => {
    if (map.current) return
    const horaActual = new Date().getHours()
    const esDeNoche = horaActual < 6 || horaActual >= 18
    const estiloMapa = esDeNoche
      ? 'https://tiles.openfreemap.org/styles/dark'
      : 'https://tiles.openfreemap.org/styles/positron'

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: estiloMapa,
      center: [-78.4308, -2.9664],
      zoom: 13,
      pitch: 0,
      bearing: 0
    })

    map.current.on('load', () => {
      const arrowImg = new Image(20, 20)
      arrowImg.onload = () => {
        if (!map.current.hasImage('arrow')) map.current.addImage('arrow', arrowImg)
      }
      arrowImg.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
          <polygon points="10,2 18,18 10,13 2,18" fill="white" opacity="0.9"/>
        </svg>
      `)}`
      setMapaListo(true)
      })

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
      if (miMarkerRef.current) miMarkerRef.current.remove()
    }
  }, [])

  const lugaresFiltrados = filtro === 'todos'
    ? todosLugares
    : filtro === 'favoritos'
    ? todosLugares.filter(l => esFavorito(l.id))
    : todosLugares.filter(l => l.tipo === filtro)

  useEffect(() => {
    if (!mapaListo) return
    marcadoresRef.current.forEach(m => m.remove())
    marcadoresRef.current = []

    // Parque Central
    const parqueEl = document.createElement('div')
    parqueEl.innerHTML = `<div style="
      background: #6b7280;
      border: 2px solid white; border-radius: 50%;
      width: 32px; height: 32px; display: flex; align-items: center;
      justify-content: center; cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${svgBuilding}</div>`
    const parquePopup = new maplibregl.Popup({ offset: 25 }).setHTML(`
      <div style="min-width:160px; font-family:'Inter',sans-serif; ${modoNocturno ? 'background:#121D24;color:#F4F1E8;margin:-10px;padding:10px;border-radius:8px;' : ''}">
        <h3 style="margin:0 0 4px; display:flex; align-items:center; gap:6px; ${modoNocturno ? 'color:#F4F1E8;' : 'color:#121D24;'}">${svgBuilding.replace('white','#6b7280').replace(/width="16" height="16"/, 'width="14" height="14"')} Parque Central</h3>
        <p style="font-size:12px; color:${modoNocturno ? '#9ca3af' : '#555'}; margin:0">Punto de referencia principal del cantón</p>
      </div>
    `)
    const parqueMarker = new maplibregl.Marker({ element: parqueEl })
      .setLngLat([PARQUE_CENTRAL.coordenadas_lng, PARQUE_CENTRAL.coordenadas_lat])
      .setPopup(parquePopup)
      .addTo(map.current)
    marcadoresRef.current.push(parqueMarker)

    lugaresFiltrados.forEach(lugar => {
      const icono = lugar.tipo === 'ciudad' ? svgBuildingPin : svgLeafPin
      const esFav = esFavorito(lugar.id)

      const el = document.createElement('div')
      el.innerHTML = `<div style="position:relative;">
        <div style="
          background: ${modoNocturno ? '#1f2937' : 'white'};
          border: 2px solid ${esFav ? '#dc2626' : '#C85A32'}; border-radius: 50%;
          width: 36px; height: 36px; display: flex; align-items: center;
          justify-content: center; cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,${modoNocturno ? '0.6' : '0.3'});">${icono}</div>
      </div>`

      el.style.cursor = 'pointer'
      el.addEventListener('click', () => window.__abrirFicha(lugar.id))

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lugar.coordenadas_lng, lugar.coordenadas_lat])
        .addTo(map.current)
      marcadoresRef.current.push(marker)
    })
  }, [mapaListo, lugaresFiltrados, favoritos])

  useEffect(() => {
    window.__abrirFicha = (id) => {
      const lugar = todosLugares.find(l => l.id === id)
      if (lugar) {
        registrarEvento('ver_ficha_lugar', id)
        setLugarSeleccionado(lugar)
        setMostrarItinerario(false)
      }
    }
    window.__comoLlegar = (id) => {
      const lugar = todosLugares.find(l => l.id === id)
      if (!lugar) return
      registrarEvento('clic_como_llegar', id)
      const ubicacionActual = miUbicacionEstado.current
      const origen = ubicacionActual
        ? { id: 'yo', nombre: 'Mi ubicación', coordenadas_lat: ubicacionActual[0], coordenadas_lng: ubicacionActual[1], parking_lat: null }
        : PARQUE_CENTRAL
      setRuta([origen, lugar])
      setLugarSeleccionado(null)
      map.current.flyTo({ center: [origen.coordenadas_lng, origen.coordenadas_lat], zoom: 14 })
    }
    window.__toggleFavorito = (id) => {
      const lugar = todosLugares.find(l => l.id === id)
      if (lugar) toggleFavorito(lugar)
    }
    return () => {
      delete window.__abrirFicha
      delete window.__comoLlegar
      delete window.__toggleFavorito
    }
  }, [todosLugares])

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
      const puntoOrigen = origen.parking_lat
        ? [origen.parking_lat, origen.parking_lng]
        : [origen.coordenadas_lat, origen.coordenadas_lng]
      const puntoDestino = destino.parking_lat
        ? [destino.parking_lat, destino.parking_lng]
        : [destino.coordenadas_lat, destino.coordenadas_lng]
      const resAuto = await fetch(
        `https://ntiyaqjwhwqcjfcurxmf.supabase.co/functions/v1/quick-function?perfil=driving-car&start=${puntoOrigen[1]},${puntoOrigen[0]}&end=${puntoDestino[1]},${puntoDestino[0]}`,
        { headers: { 'apikey': 'sb_publishable__MLQNOEjw7nBkkSUJ0JGMA_t0pFrOT7' } }
      )
      
      const dataAuto = await resAuto.json()
      const coordsAuto = dataAuto.features[0].geometry.coordinates
      const distKm = (dataAuto.features[0].properties.segments[0].distance / 1000).toFixed(2)
      const enAuto = Math.round((distKm / 30) * 60)
      const pasos = dataAuto.features[0].properties.segments[0].steps

      dibujarRuta('ruta-auto', coordsAuto, '#C85A32', 5, false)
      coordsRutaRef.current = coordsAuto

      let distPie = 0, caminando = 0
      if (destino.parking_lat) {
        const resPie = await fetch(
          `https://ntiyaqjwhwqcjfcurxmf.supabase.co/functions/v1/quick-function?perfil=foot-hiking&start=${destino.parking_lng},${destino.parking_lat}&end=${destino.coordenadas_lng},${destino.coordenadas_lat}`,
          { headers: { 'apikey': 'sb_publishable__MLQNOEjw7nBkkSUJ0JGMA_t0pFrOT7' } }
        )
        const dataPie = await resPie.json()
        const coordsPie = dataPie.features[0].geometry.coordinates
        distPie = (dataPie.features[0].properties.segments[0].distance / 1000).toFixed(2)
        caminando = Math.round((distPie / 4) * 60)
        dibujarRuta('ruta-pie', coordsPie, '#3A6B52', 4, true)
      }

      setTiempo({ distKm, enAuto, distPie, caminando, tieneCamino: !!destino.parking_lat, pasos })
      destinoRef.current = destino

      const bounds = coordsAuto.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(coordsAuto[0], coordsAuto[0])
      )
      map.current.fitBounds(bounds, { padding: 60 })

      localStorage.setItem('ultima-ruta', JSON.stringify({
        coordsAuto,
        origen: { lat: puntoOrigen[0], lng: puntoOrigen[1] },
        destino: { lat: puntoDestino[0], lng: puntoDestino[1] },
        distKm, enAuto, timestamp: Date.now()
      }))
    } catch (err) {
      console.error('Error ruta:', err)
    }
  }

  const dibujarRuta = (id, coords, color, width, dashed) => {
    if (!map.current.getSource(id)) {
      map.current.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.current.addLayer({
        id, type: 'line', source: id,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': color, 'line-width': width, ...(dashed ? { 'line-dasharray': [2, 2] } : {}) }
      })
      if (!dashed) {
        map.current.addLayer({
          id: `${id}-flechas`, type: 'symbol', source: id,
          layout: {
            'symbol-placement': 'line', 'symbol-spacing': 80,
            'icon-image': 'arrow', 'icon-size': 0.7,
            'icon-rotate': 90, 'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true, 'icon-ignore-placement': true
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
    if (miUbicacion) {
      if (miMarkerRef.current) { miMarkerRef.current.remove(); miMarkerRef.current = null }
      setMiUbicacion(null)
      setRuta([])
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setMiUbicacion([lat, lng])
        if (miMarkerRef.current) miMarkerRef.current.remove()
        const el = document.createElement('div')
        el.style.cssText = `width:20px;height:20px;background:#f97316;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(249,115,22,0.4);`
        miMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat]).addTo(map.current)
        map.current.flyTo({ center: [lng, lat], zoom: 15 })
      },
      () => alert('⚠️ No se pudo obtener tu ubicación.')
    )
  }

  const iniciarNavegacion = () => {
    if (!navigator.geolocation) return alert('GPS no disponible')
    if (typeof ruta[1]?.id === 'number') {
      registrarEvento('iniciar_navegacion', ruta[1].id)
    }
    setNavegando(true)
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, heading } = pos.coords
        setMiUbicacion([lat, lng])
        let latSnap = lat, lngSnap = lng
        const coords = coordsRutaRef.current

        if (coords.length > 0) {
          let minDist = Infinity, closest = coords[0]
          coords.forEach(coord => {
            const d = Math.sqrt((coord[1] - lat) ** 2 + (coord[0] - lng) ** 2)
            if (d < minDist) { minDist = d; closest = coord }
          })
          lngSnap = closest[0]; latSnap = closest[1]
          const distMetros = minDist * 111000
          const ahora = Date.now()
          if (distMetros > 30 && ahora - ultimoRecalculoRef.current > 5000 && destinoRef.current) {
            ultimoRecalculoRef.current = ahora
            setRecalculando(true)
            setInstruccion('🔄 Recalculando ruta...')
            hablar('Recalculando ruta')
            await calcularRuta(
              { id: 'yo', nombre: 'Mi ubicación', coordenadas_lat: lat, coordenadas_lng: lng, parking_lat: null },
              destinoRef.current
            )
            setRecalculando(false)
            setInstruccion('✅ Ruta actualizada')
            hablar('Ruta actualizada, continúa')
            setTimeout(() => setInstruccion(''), 3000)
          }

          let indiceCercano = 0, minDistIndice = Infinity
          coords.forEach((coord, idx) => {
            const d = Math.sqrt((coord[1] - latSnap) ** 2 + (coord[0] - lngSnap) ** 2)
            if (d < minDistIndice) { minDistIndice = d; indiceCercano = idx }
          })

          let distanciaRestanteM = 0
          for (let i = indiceCercano; i < coords.length - 1; i++) {
            const [lng1, lat1] = coords[i]
            const [lng2, lat2] = coords[i + 1]
            const dLat = (lat2 - lat1) * 111000
            const dLng = (lng2 - lng1) * 111000 * Math.cos(lat1 * Math.PI / 180)
            distanciaRestanteM += Math.sqrt(dLat * dLat + dLng * dLng)
          }

          const distanciaRestanteKm = (distanciaRestanteM / 1000).toFixed(1)
          const minutosRestantes = Math.round((distanciaRestanteKm / 30) * 60)
          const ahoraFecha = new Date()
          ahoraFecha.setMinutes(ahoraFecha.getMinutes() + minutosRestantes)
          const horaLlegada = ahoraFecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
          setProgresoRuta({ distanciaRestanteKm, minutosRestantes, horaLlegada })
        }

        if (!map.current.getSource('usuario')) {
          map.current.addSource('usuario', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: [lngSnap, latSnap] } } })
          map.current.addLayer({ id: 'usuario-pulso', type: 'circle', source: 'usuario', paint: { 'circle-radius': 18, 'circle-color': '#3b82f6', 'circle-opacity': 0.3 } })
          map.current.addLayer({ id: 'usuario', type: 'circle', source: 'usuario', paint: { 'circle-radius': 10, 'circle-color': '#2563eb', 'circle-stroke-width': 3, 'circle-stroke-color': 'white' } })
        } else {
          map.current.getSource('usuario').setData({ type: 'Feature', geometry: { type: 'Point', coordinates: [lngSnap, latSnap] } })
        }
        map.current.easeTo({ center: [lngSnap, latSnap], bearing: heading || 0, pitch: 60, zoom: 16, duration: 500 })

        if (tiempo?.pasos) {
          const instruccionTraducida = traducirInstruccion(tiempo.pasos[0]?.instruction || '')
          setInstruccion(instruccionTraducida)
          if (instruccionTraducida !== ultimaInstruccionRef.current) {
            ultimaInstruccionRef.current = instruccionTraducida
            hablar(instruccionTraducida)
          }
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
    setProgresoRuta(null)
    map.current.easeTo({ pitch: 0, bearing: 0, zoom: 13 })
  }

  const lugaresBusqueda = busqueda.length > 0
    ? todosLugares.filter(l => l.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : []

  const iconoInstruccion = instruccion.startsWith('←') ? '←' :
    instruccion.startsWith('→') ? '→' :
    instruccion.startsWith('↑') ? '↑' :
    instruccion.startsWith('↓') ? '↓' :
    instruccion.startsWith('🎯') ? '🎯' :
    instruccion.startsWith('🔄') ? '🔄' :
    instruccion.startsWith('↩') ? '↩' : '↑'

  const IconoInstruccion = () => {
    const props = { size: 28, strokeWidth: 2.5, color: '#F4F1E8' }
    if (iconoInstruccion === '←') return <ArrowLeft {...props} />
    if (iconoInstruccion === '→') return <ArrowRight {...props} />
    if (iconoInstruccion === '↓') return <ArrowDown {...props} />
    if (iconoInstruccion === '🎯') return <Flag {...props} fill="#F4F1E8" />
    if (iconoInstruccion === '🔄') return <RotateCw {...props} />
    if (iconoInstruccion === '↩') return <Undo2 {...props} />
    return <ArrowUp {...props} />
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {!navegando && !lugarSeleccionado && <BotonContacto />}

      {/* MODO NAVEGACIÓN — estilo Waze */}
      {navegando && (
        <>
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            background: recalculando ? '#C85A32' : '#121D24',
            color: '#F4F1E8', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: '12px',
            fontFamily: "'Inter', sans-serif",
            zIndex: 200, boxShadow: '0 2px 12px rgba(0,0,0,0.4)'
          }}>
            <IconoInstruccion />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>
                {instruccion.replace(/^[←→↑↓↰↱↖↗↘↙↩🎯🔄]\s*/, '')}
              </div>
              {progresoRuta && (
                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Ruler size={11} /> {progresoRuta.distanciaRestanteKm} km</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} /> {progresoRuta.minutosRestantes} min</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Flag size={11} /> {progresoRuta.horaLlegada}</span>
                </div>
              )}
            </div>
            <button onClick={detenerNavegacion} style={{
              background: recalculando ? '#121D24' : '#C85A32', color: 'white', border: 'none',
              borderRadius: '50px', padding: '6px 14px',
              cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: "'Inter', sans-serif",
              display: 'flex', alignItems: 'center', gap: '5px'
            }}><X size={13} /> Fin</button>
          </div>

          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'rgba(18,29,36,0.95)',
            backdropFilter: 'blur(10px)',
            color: '#F4F1E8', padding: '10px 16px',
            display: 'flex', gap: '10px',
            fontFamily: "'Inter', sans-serif",
            zIndex: 200, boxShadow: '0 -2px 12px rgba(0,0,0,0.4)'
          }}>
            <button onClick={() => {
              const nuevoEstado = !audioActivoRef.current
              audioActivoRef.current = nuevoEstado
              setAudioActivo(nuevoEstado)
              if (!nuevoEstado) window.speechSynthesis.cancel()
            }} style={{
              flex: 1, background: audioActivo ? '#D89D34' : 'rgba(244,241,232,0.15)',
              color: audioActivo ? '#121D24' : '#F4F1E8',
              border: audioActivo ? 'none' : '1px solid rgba(244,241,232,0.25)',
              borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '13px',
              fontWeight: 700, fontFamily: "'Inter', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
              {audioActivo ? <Volume2 size={15} /> : <VolumeX size={15} />} {audioActivo ? 'Silenciar' : 'Audio'}
            </button>
            <button onClick={limpiarTodo} style={{
              flex: 1, background: 'rgba(244,241,232,0.15)', color: '#F4F1E8',
              border: '1px solid rgba(244,241,232,0.25)',
              borderRadius: '8px', padding: '10px', cursor: 'pointer',
              fontSize: '13px', fontWeight: 700, fontFamily: "'Inter', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}><X size={15} /> Cancelar ruta</button>
          </div>
        </>
      )}

      {/* INTERFAZ NORMAL */}
      {!navegando && (
        <>
          <div style={{
            background: '#121D24',
            color: '#F4F1E8', padding: '10px 16px',
            display: 'flex', alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 10
          }}>
            {/* Izquierda: volver */}
            <div style={{ flex: 1, display: 'flex' }}>
              <button onClick={() => navigate('/')} style={{
                background: 'rgba(244,241,232,0.15)', color: '#F4F1E8',
                border: '1px solid rgba(244,241,232,0.25)', borderRadius: '50px',
                padding: '6px 14px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                fontWeight: 500, fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <ArrowLeft size={14} strokeWidth={2} /> Inicio
              </button>
            </div>

            {/* Centro: identidad */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <img src={isotipoUumka} alt="Uumka" style={{ width: '26px', height: '26px' }} />
              <h1 style={{ fontSize: '16px', fontFamily: "'Outfit', sans-serif", fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
                Rutas Maps
              </h1>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                {calidadConexion === 'offline' && <><WifiOff size={18} color="#C85A32" /><span style={{ color: '#C85A32' }}>Sin conexión</span></>}
                {calidadConexion === 'lenta' && <><Wifi size={18} color="#D89D34" /><span style={{ color: '#D89D34' }}>Conexión lenta</span></>}
                {calidadConexion === 'buena' && <Wifi size={18} color="#3A6B52" />}
              </span>
              <button onClick={detectarUbicacion} style={{
                background: miUbicacion ? '#3A6B52' : '#D89D34',
                color: miUbicacion ? '#F4F1E8' : '#121D24',
                border: 'none', borderRadius: '50px',
                padding: '8px 16px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                fontWeight: 700, fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <LocateFixed size={15} strokeWidth={2} />
                {miUbicacion ? 'GPS activo' : '¿Dónde estoy?'}
              </button>
            </div>
          </div>

          <div style={{ padding: '12px 16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', background: '#F4F1E8', borderBottom: '1px solid rgba(18,29,36,0.1)' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { key: 'todos', icon: Globe2, label: 'Todos' },
                { key: 'ciudad', icon: Building2, label: 'Ciudad' },
                { key: 'naturaleza', icon: Leaf, label: 'Naturaleza' }
              ].map(cat => (
                <button key={cat.key} onClick={() => setFiltro(cat.key)} style={{
                  background: filtro === cat.key ? '#C85A32' : 'white',
                  color: filtro === cat.key ? 'white' : '#374151',
                  border: filtro === cat.key ? 'none' : '1px solid rgba(18,29,36,0.1)',
                  borderRadius: '50px',
                  padding: '7px 16px', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <cat.icon size={14} strokeWidth={2} />
                  {cat.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={15} color="#C85A32" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Buscar cualquier lugar..."
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setMostrarSugerencias(true) }}
                onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                style={{
                  width: '100%', padding: '7px 14px 7px 36px', borderRadius: '50px',
                  border: '2px solid #C85A32', fontSize: '13px', fontFamily: "'Inter', sans-serif",
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
              {mostrarSugerencias && lugaresBusqueda.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                  background: 'white', borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden'
                }}>
                  {lugaresBusqueda.map(lugar => (
                    <div key={lugar.id} onClick={() => {
                      window.__comoLlegar(lugar.id)
                      map.current.flyTo({ center: [lugar.coordenadas_lng, lugar.coordenadas_lat], zoom: 15 })
                      setBusqueda('')
                      setMostrarSugerencias(false)
                    }} style={{
                      padding: '10px 16px', cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px'
                    }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(200,90,50,0.06)'}
                      onMouseOut={e => e.currentTarget.style.background = 'white'}
                    >
                    {lugar.tipo === 'ciudad'
                    ? <Building2 size={16} color="#C85A32" strokeWidth={2} />
                    : <Leaf size={16} color="#C85A32" strokeWidth={2} />
                  }
                  <div>
                    <div style={{ fontWeight: 600, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {lugar.nombre}
                    </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'Inter', sans-serif" }}>
                        {lugar.tipo === 'ciudad' ? <><Building2 size={11} color="#4A6B82" /> Ciudad</> : <><Leaf size={11} color="#3A6B52" /> Naturaleza</>}
                      </div>
                    </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ background: '#F4F1E8', padding: '8px 16px', borderBottom: '1px solid rgba(18,29,36,0.1)', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>
            {ruta.length === 0 && filtro !== 'favoritos' && verHint && (
              <p style={{ color: '#555', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#C85A32" /> Toca un lugar en el mapa para ver información y trazar una ruta.
                </span>
                <button onClick={cerrarHint} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af',
                  padding: '2px', display: 'flex', flexShrink: 0
                }}><X size={14} /></button>
              </p>
            )}
            {ruta.length === 0 && filtro === 'favoritos' && favoritos.length === 0 && (
              <p style={{ color: '#555', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Heart size={14} color="#9ca3af" /> Aún no tienes favoritos — toca el corazón en cualquier lugar para guardarlo.
              </p>
            )}
            {ruta.length === 1 && (
              <p style={{ color: '#3A6B52', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} /> Origen: <strong>{ruta[0].nombre}</strong> — Selecciona el destino.
              </p>
            )}
            {ruta.length === 2 && tiempo && (
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#3A6B52" /> <strong>{ruta[0].nombre}</strong>
                  <ArrowRight size={13} color="#6b7280" />
                  <MapPin size={14} color="#C85A32" /> <strong>{ruta[1].nombre}</strong>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Ruler size={13} /> {tiempo.distKm} km
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Car size={14} /> {tiempo.enAuto} min
                </span>
                {tiempo.tieneCamino && (
                  <span style={{ color: '#3A6B52', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Footprints size={14} /> +{tiempo.distPie} km ({tiempo.caminando} min a pie)
                  </span>
                )}
                <button onClick={iniciarNavegacion} style={{
                  background: '#C85A32', color: 'white', border: 'none',
                  borderRadius: '6px', padding: '6px 14px',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: "'Inter', sans-serif",
                  display: 'flex', alignItems: 'center', gap: '5px'
                }}><Play size={13} fill="white" /> Navegar</button>
                <button onClick={limpiarTodo} style={{
                  background: '#6b7280', color: 'white', border: 'none',
                  borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                  display: 'flex', alignItems: 'center', gap: '5px'
                }}><X size={13} /> Limpiar</button>
                <a href={`https://wa.me/?text=Mira esta ruta hacia ${ruta[1].nombre} en Uumka`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => registrarEvento('compartir_ruta', ruta[1].id)}
                  style={{
                    background: '#25d366', color: 'white', border: 'none',
                    borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px',
                    fontWeight: 700, fontFamily: "'Inter', sans-serif", textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: '5px'
                  }}><MessageCircle size={13} /> Compartir ruta</a>
              </div>
            )}
            {ruta.length === 2 && tiempo && (
              <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '11px', color: '#6b7280' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '14px', height: '3px', background: '#C85A32', borderRadius: '2px', display: 'inline-block' }} /> En auto
                </span>
                {tiempo.tieneCamino && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '14px', height: '3px', background: '#3A6B52', borderRadius: '2px', display: 'inline-block', backgroundImage: 'repeating-linear-gradient(90deg, #3A6B52 0 4px, transparent 4px 7px)' }} /> A pie
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Mapa */}
      <div ref={mapContainer} style={{ flex: 1 }} />

      {/* Ficha deslizable */}
      {lugarSeleccionado && (
        <>
          <div onClick={() => setLugarSeleccionado(null)} style={{
            position: 'fixed', inset: 0, zIndex: 99
          }} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'rgba(244,241,232,0.7)', backdropFilter: 'blur(3px)',
            borderRadius: '20px 20px 0 0',
            boxShadow: '0 -4px 30px rgba(0,0,0,0.2)',
            zIndex: 100, maxHeight: '70vh', overflowY: 'auto',
            animation: 'slideUp 0.3s ease-out',
            fontFamily: "'Inter', sans-serif"
          }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
            <div style={{ width: '40px', height: '4px', background: 'rgba(18,29,36,0.15)', borderRadius: '2px' }} />
          </div>
          <button onClick={() => setLugarSeleccionado(null)} style={{
            position: 'absolute', top: '12px', right: '16px',
            background: 'rgba(18,29,36,0.08)', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><X size={16} color="#121D24" /></button>
          <div style={{ padding: '8px 20px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              {lugarSeleccionado.tipo === 'ciudad'
                ? <Building2 size={30} color="#C85A32" strokeWidth={1.5} />
                : <Leaf size={30} color="#C85A32" strokeWidth={1.5} />
              }
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '24px', fontFamily: "'Inter', sans-serif", fontWeight: 600, letterSpacing: '0.5px', color: '#121D24', margin: 0 }}>
                  {lugarSeleccionado.nombre}
                </h2>
                <span style={{
                  fontSize: '12px', fontWeight: 600,
                  color: lugarSeleccionado.tipo === 'ciudad' ? '#4A6B82' : '#3A6B52',
                  display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px'
                }}>
                  {lugarSeleccionado.tipo === 'ciudad'
                    ? <><Building2 size={12} /> Ciudad</>
                    : <><Leaf size={12} /> Naturaleza</>
                  }
                </span>
              </div>
            </div>
            {lugarSeleccionado.descripcion && (
              <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6', marginBottom: '16px' }}>
                {lugarSeleccionado.descripcion}
              </p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {lugarSeleccionado.horario && (
                <div style={{ background: 'rgba(18,29,36,0.05)', borderRadius: '10px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '3px' }}>Horario</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={13} color="#4A6B82" /> {lugarSeleccionado.horario}
                  </div>
                </div>
              )}
              {lugarSeleccionado.costo && (
                <div style={{ background: 'rgba(18,29,36,0.05)', borderRadius: '10px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '3px' }}>Costo</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Wallet size={13} color="#D89D34" /> {lugarSeleccionado.costo}
                  </div>
                </div>
              )}
              {lugarSeleccionado.tiempo_visita && (
                <div style={{ background: 'rgba(18,29,36,0.05)', borderRadius: '10px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '3px' }}>Tiempo visita</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Timer size={13} color="#4A6B82" /> {lugarSeleccionado.tiempo_visita}
                  </div>
                </div>
              )}
              {lugarSeleccionado.dificultad && (
                <div style={{ background: 'rgba(18,29,36,0.05)', borderRadius: '10px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '3px' }}>Dificultad</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '9px', height: '9px', borderRadius: '50%', display: 'inline-block',
                      background: lugarSeleccionado.dificultad === 'Fácil' ? '#3A6B52' : lugarSeleccionado.dificultad === 'Media' ? '#E0A138' : '#C85A32'
                    }} />
                    {lugarSeleccionado.dificultad}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => {
                registrarEvento('clic_como_llegar', lugarSeleccionado.id)
                const ubicacionActual = miUbicacionEstado.current
                const origen = ubicacionActual
                  ? { id: 'yo', nombre: 'Mi ubicación', coordenadas_lat: ubicacionActual[0], coordenadas_lng: ubicacionActual[1], parking_lat: null }
                  : PARQUE_CENTRAL
                setRuta([origen, lugarSeleccionado])
                setLugarSeleccionado(null)
                map.current.flyTo({ center: [origen.coordenadas_lng, origen.coordenadas_lat], zoom: 14 })
              }} style={{
                background: '#C85A32', color: 'white', border: 'none',
                borderRadius: '10px', padding: '12px', cursor: 'pointer',
                fontSize: '14px', fontWeight: 700, fontFamily: "'Inter', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                <Compass size={16} /> Cómo llegar {miUbicacion ? '(desde mi ubicación)' : '(desde el Parque Central)'}
              </button>
              {lugarSeleccionado.telefono && (
                <a href={`tel:${lugarSeleccionado.telefono}`} style={{
                  background: '#D89D34', color: '#121D24', borderRadius: '10px', padding: '12px',
                  fontSize: '14px', fontWeight: 700, fontFamily: "'Inter', sans-serif",
                  textAlign: 'center', textDecoration: 'none', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}><Phone size={16} /> Llamar — {lugarSeleccionado.telefono}</a>
              )}
              
              <button onClick={() => navigate(`/lugar/${lugarSeleccionado.id}`)} style={{
                background: 'rgba(74,107,130,0.1)', color: '#4A6B82', border: '2px solid #4A6B82',
                borderRadius: '10px', padding: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
                fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                {tiene360Lugar(lugarSeleccionado)
                  ? <><Camera size={16} /> Ver recorrido 360°</>
                  : tieneVideoLugar(lugarSeleccionado)
                  ? <><Video size={16} /> Ver video 360°</>
                  : <><ImageIcon size={16} /> Ver fotos del lugar</>
                }
              </button>
            </div>
          </div>
        </div>
        </>
      )}
      

      {/* Panel de itinerario personalizado */}
      {MOSTRAR_ITINERARIO && mostrarItinerario && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'white', borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.2)',
          zIndex: 100, maxHeight: '70vh', overflowY: 'auto',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
            <div style={{ width: '40px', height: '4px', background: '#e5e7eb', borderRadius: '2px' }} />
          </div>
          <button onClick={() => setMostrarItinerario(false)} style={{
            position: 'absolute', top: '12px', right: '16px',
            background: '#f3f4f6', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px'
          }}>✕</button>

          <div style={{ padding: '16px 20px 30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a472a', marginBottom: '4px' }}>
              📋 Mi itinerario
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
              Estos son los lugares que te interesan. Cuando estés listo, solicita una cotización personalizada.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {favoritos.map(lugar => (
                <div key={lugar.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: '#f9fafb', borderRadius: '10px', padding: '10px 12px'
                }}>
                  <span style={{ fontSize: '22px' }}>{lugar.categorias?.icono || '📍'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{lugar.nombre}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      {lugar.tipo === 'ciudad' ? '🏙️ Ciudad' : '🌿 Naturaleza'}
                    </div>
                  </div>
                  <button onClick={() => toggleFavorito(lugar)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af'
                  }}>✕</button>
                </div>
              ))}
            </div>
            <a href={`https://wa.me/${NUMERO_WHATSAPP_NEGOCIO}?text=${armarMensajeItinerario()}`}
              target="_blank" rel="noopener noreferrer"
              onClick={() => favoritos.forEach(f => registrarEvento('solicitud_cotizacion', f.id))}
              style={{
                background: '#25d366', color: 'white', borderRadius: '10px', padding: '14px',
                fontSize: '15px', fontWeight: 'bold', textAlign: 'center',
                textDecoration: 'none', display: 'block'
              }}
            >
              💬 Solicitar cotización por WhatsApp
            </a>    
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}