import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const PASOS_EMBUDO = [
  { tipos: ['sesion_iniciada'],                 label: '1. Entró a la app' },
  { tipos: ['clic_ir_mapa', 'clic_ir_galeria'],  label: '2. Exploró mapa o portal 360°' },
  { tipos: ['ver_ficha_lugar', 'vista_lugar'],   label: '3. Vio un lugar' },
  { tipos: ['like_lugar'],                       label: '4. Le gustó el lugar' },
  { tipos: ['clic_como_llegar'],                 label: '5. Pidió cómo llegar' },
  { tipos: ['iniciar_navegacion'],               label: '6. Inició navegación' },
  { tipos: ['clic_contacto'],                    label: '7. Contactó por WhatsApp' },
]

const RANGOS = [
  { key: 'hoy', label: 'Hoy' },
  { key: '7d', label: 'Últimos 7 días' },
  { key: '30d', label: 'Últimos 30 días' },
  { key: 'todo', label: 'Todo' },
  { key: 'custom', label: 'Personalizado' },
]

function calcularFechas(rango, desde, hasta) {
  const ahora = new Date()
  const fin = new Date(ahora)
  fin.setHours(23, 59, 59, 999)

  if (rango === 'hoy') {
    const inicio = new Date(ahora)
    inicio.setHours(0, 0, 0, 0)
    return { desde: inicio.toISOString(), hasta: fin.toISOString() }
  }
  if (rango === '7d') {
    const inicio = new Date(ahora)
    inicio.setDate(inicio.getDate() - 7)
    inicio.setHours(0, 0, 0, 0)
    return { desde: inicio.toISOString(), hasta: fin.toISOString() }
  }
  if (rango === '30d') {
    const inicio = new Date(ahora)
    inicio.setDate(inicio.getDate() - 30)
    inicio.setHours(0, 0, 0, 0)
    return { desde: inicio.toISOString(), hasta: fin.toISOString() }
  }
  if (rango === 'custom') {
    return {
      desde: desde ? new Date(desde + 'T00:00:00').toISOString() : null,
      hasta: hasta ? new Date(hasta + 'T23:59:59').toISOString() : null
    }
  }
  // 'todo'
  return { desde: null, hasta: null }
}

export default function Dashboard() {
    const navigate = useNavigate()
    const [rango, setRango] = useState('7d')
    const [desde, setDesde] = useState('')
    const [hasta, setHasta] = useState('')
    const [eventos, setEventos] = useState([])
    const [lugaresMap, setLugaresMap] = useState({})
    const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      const { desde: d, hasta: h } = calcularFechas(rango, desde, hasta)

      let query = supabase.from('eventos').select('*').order('fecha', { ascending: true })
      if (d) query = query.gte('fecha', d)
      if (h) query = query.lte('fecha', h)

      const { data, error } = await query
      if (error) console.error('Error cargando eventos:', error)
      else setEventos(data || [])

      const { data: lugares } = await supabase.from('lugares').select('id, nombre')
      const mapa = {}
      ;(lugares || []).forEach(l => { mapa[l.id] = l.nombre })
      setLugaresMap(mapa)

      setCargando(false)
    }
    cargar()
  }, [rango, desde, hasta])

  // --- Datos del embudo ---
  const datosEmbudo = useMemo(() => {
    return PASOS_EMBUDO.map(paso => {
      const sesiones = new Set(
        eventos.filter(e => paso.tipos.includes(e.tipo)).map(e => e.session_id)
      )
      return { label: paso.label, sesiones: sesiones.size }
    })
  }, [eventos])

  // --- Sesiones por día (línea de tiempo) ---
  const datosPorDia = useMemo(() => {
    const porDia = {}
    eventos
      .filter(e => e.tipo === 'sesion_iniciada')
      .forEach(e => {
        const dia = e.fecha.slice(0, 10)
        if (!porDia[dia]) porDia[dia] = new Set()
        porDia[dia].add(e.session_id)
      })
    return Object.entries(porDia)
      .map(([dia, sesiones]) => ({ dia, sesiones: sesiones.size }))
      .sort((a, b) => a.dia.localeCompare(b.dia))
  }, [eventos])

  // --- Origen (UTM) ---
  const datosOrigen = useMemo(() => {
    const porOrigen = {}
    eventos
      .filter(e => e.tipo === 'sesion_iniciada')
      .forEach(e => {
        const origen = e.utm_source || 'directo / sin utm'
        if (!porOrigen[origen]) porOrigen[origen] = new Set()
        porOrigen[origen].add(e.session_id)
      })
    return Object.entries(porOrigen)
      .map(([origen, sesiones]) => ({ origen, sesiones: sesiones.size }))
      .sort((a, b) => b.sesiones - a.sesiones)
  }, [eventos])

  // --- Puerta de entrada: mapa vs portal 360°, y cuál convierte mejor ---
  const datosPuertaEntrada = useMemo(() => {
    const primeraPuerta = {}
    eventos.forEach(e => {
      if (primeraPuerta[e.session_id]) return
      if (e.tipo === 'clic_ir_mapa') primeraPuerta[e.session_id] = 'mapa'
      else if (e.tipo === 'clic_ir_galeria') primeraPuerta[e.session_id] = 'portal'
    })

    const sesionesConContacto = new Set(
      eventos.filter(e => e.tipo === 'clic_contacto').map(e => e.session_id)
    )

    const grupos = { mapa: { total: 0, contacto: 0 }, portal: { total: 0, contacto: 0 } }
    Object.entries(primeraPuerta).forEach(([sessionId, puerta]) => {
      grupos[puerta].total++
      if (sesionesConContacto.has(sessionId)) grupos[puerta].contacto++
    })

    const calcular = (g) => ({
      ...g,
      tasa: g.total > 0 ? ((g.contacto / g.total) * 100).toFixed(1) : '0.0'
    })
    return { mapa: calcular(grupos.mapa), portal: calcular(grupos.portal) }
  }, [eventos])

  // --- Top lugares ---
  const topLugares = useMemo(() => {
    const porLugar = {}
    eventos
      .filter(e => e.lugar_id !== null)
      .forEach(e => {
        if (!porLugar[e.lugar_id]) {
          porLugar[e.lugar_id] = { vistas: 0, likes: 0, comoLlegar: 0, compartidoLugar: 0, compartidoRuta: 0 }
        }
        if (e.tipo === 'vista_lugar' || e.tipo === 'ver_ficha_lugar') porLugar[e.lugar_id].vistas++
        if (e.tipo === 'like_lugar') porLugar[e.lugar_id].likes++
        if (e.tipo === 'clic_como_llegar') porLugar[e.lugar_id].comoLlegar++
        if (e.tipo === 'clic_whatsapp') porLugar[e.lugar_id].compartidoLugar++
        if (e.tipo === 'compartir_ruta') porLugar[e.lugar_id].compartidoRuta++
      })
    return Object.entries(porLugar)
      .map(([id, datos]) => ({ nombre: lugaresMap[id] || `Lugar #${id}`, ...datos }))
      .sort((a, b) => b.vistas - a.vistas)
      .slice(0, 10)
  }, [eventos, lugaresMap])

  // --- KPIs generales ---
  const totalSesiones = new Set(
    eventos.filter(e => e.tipo === 'sesion_iniciada').map(e => e.session_id)
  ).size
  
  const totalContactos = new Set(
    eventos.filter(e => e.tipo === 'clic_contacto').map(e => e.session_id)
  ).size
  const tasaConversion = totalSesiones > 0
    ? ((totalContactos / totalSesiones) * 100).toFixed(1)
    : '0.0'

  // --- Descargar CSV ---
  const descargarCSV = () => {
    if (eventos.length === 0) return alert('No hay datos para descargar en este rango.')
    const columnas = ['id', 'tipo', 'lugar_id', 'valor', 'fecha', 'detalle', 'session_id', 'utm_source', 'utm_campaign', 'referrer']
    const filas = eventos.map(e => columnas.map(c => `"${(e[c] ?? '').toString().replace(/"/g, '""')}"`).join(','))
    const csv = [columnas.join(','), ...filas].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eventos_uumka_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '4px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a472a', marginBottom: '4px' }}>
            📊 Métricas — Uumka
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            Embudo de conversión y origen de visitantes
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/admin')} style={{
            background: '#1a472a', color: 'white', border: 'none',
            borderRadius: '50px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px'
          }}>⚙️ Panel Admin</button>
          <button onClick={() => navigate('/')} style={{
            background: '#6b7280', color: 'white', border: 'none',
            borderRadius: '50px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px'
          }}>🌐 Ver sitio</button>
        </div>
      </div>
      <div style={{ marginBottom: '20px' }} />

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        {RANGOS.map(r => (
          <button key={r.key} onClick={() => setRango(r.key)} style={{
            background: rango === r.key ? '#16a34a' : 'white',
            color: rango === r.key ? 'white' : '#374151',
            border: '1px solid #d1d5db', borderRadius: '50px',
            padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
          }}>{r.label}</button>
        ))}
        {rango === 'custom' && (
          <>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
            <span style={{ color: '#6b7280' }}>a</span>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
          </>
        )}
        <button onClick={descargarCSV} style={{
          marginLeft: 'auto', background: '#1a472a', color: 'white', border: 'none',
          borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
        }}>⬇ Descargar CSV</button>
      </div>

      {cargando ? (
        <p style={{ color: '#6b7280' }}>Cargando datos...</p>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Sesiones totales</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a472a' }}>{totalSesiones}</div>
            </div>
            
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Contactos por WhatsApp</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>{totalContactos}</div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Tasa de conversión total</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f97316' }}>{tasaConversion}%</div>
            </div>
          </div>

          {/* Embudo */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#1a472a' }}>Embudo de conversión</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={datosEmbudo} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="sesiones" fill="#16a34a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sesiones por día */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#1a472a' }}>Sesiones por día</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={datosPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="sesiones" stroke="#16a34a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Origen UTM */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#1a472a' }}>Origen de las sesiones</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={datosOrigen}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="origen" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="sesiones" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Puerta de entrada */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px', color: '#1a472a' }}>¿Por dónde entran primero?</h2>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>Solo cuenta la primera puerta que tocó cada sesión</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '12px' }}>
              <div style={{ background: '#fef3ec', borderRadius: '10px', padding: '14px', border: '1px solid #fdd8bf' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#C85A32', marginBottom: '6px' }}>🗺️ Rutas Maps</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a472a' }}>{datosPuertaEntrada.mapa.total}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>sesiones · {datosPuertaEntrada.mapa.tasa}% llegó a contacto</div>
              </div>
              <div style={{ background: '#eef3f6', borderRadius: '10px', padding: '14px', border: '1px solid #cddce4' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A6B82', marginBottom: '6px' }}>📸 Portal 360°</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a472a' }}>{datosPuertaEntrada.portal.total}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>sesiones · {datosPuertaEntrada.portal.tasa}% llegó a contacto</div>
              </div>
            </div>
          </div>

           {/* Top lugares */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#1a472a' }}>Lugares más vistos</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Lugar</th>
                  <th style={{ padding: '8px' }}>Vistas</th>
                  <th style={{ padding: '8px' }}>❤️ Me gusta</th>
                  <th style={{ padding: '8px' }}>Cómo llegar</th>
                  <th style={{ padding: '8px' }}>Compartir lugar</th>
                  <th style={{ padding: '8px' }}>Compartir ruta</th>
                </tr>
              </thead>
              <tbody>
                {topLugares.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '12px', color: '#9ca3af', textAlign: 'center' }}>Sin datos en este rango</td></tr>
                ) : topLugares.map((l, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{l.nombre}</td>
                    <td style={{ padding: '8px' }}>{l.vistas}</td>
                    <td style={{ padding: '8px' }}>{l.likes}</td>
                    <td style={{ padding: '8px' }}>{l.comoLlegar}</td>
                    <td style={{ padding: '8px' }}>{l.compartidoLugar}</td>
                    <td style={{ padding: '8px' }}>{l.compartidoRuta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}