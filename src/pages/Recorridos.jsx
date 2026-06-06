import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const colores = {
  cascada: '#3b82f6',
  mirador: '#8b5cf6',
  río: '#06b6d4',
  pueblo: '#f59e0b',
  restaurante: '#ef4444',
  hotel: '#f97316',
  bar: '#eab308',
  tienda: '#84cc16',
  cultura: '#a855f7',
  salud: '#ec4899'
}

const dificultadColor = {
  'Fácil': '#16a34a',
  'Media': '#f59e0b',
  'Difícil': '#dc2626'
}

export default function Recorridos() {
  const navigate = useNavigate()
  const [lugares360, setLugares360] = useState([])
  const [cargando, setCargando] = useState(true)
  const [seleccionado, setSeleccionado] = useState(null)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    supabase
      .from('lugares')
      .select('*, categorias(nombre, icono, color)')
      .eq('activo', true)
      .then(({ data, error }) => {
        if (error) console.error('Error:', error)
        else setLugares360(data.map(l => ({
          id: l.id,
          nombre: l.nombre,
          descripcion: l.descripcion,
          categoria: l.categorias?.nombre?.toLowerCase() || 'pueblo',
          icono: l.categorias?.icono || '📍',
          foto: l.foto_principal,
          foto360: l.foto_360,
          video: l.video,
          dificultad: l.dificultad || 'Fácil',
          tiempo: l.tiempo_visita || '1 hora',
          costo: l.costo || 'Gratuito',
          horario: l.horario || 'Todo el día',
          telefono: l.telefono,
          coordenadas: [l.coordenadas_lat, l.coordenadas_lng]
        })))
        setCargando(false)
      })
  }, [])

  if (cargando) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌿</div>
        <p style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '18px' }}>Cargando lugares...</p>
      </div>
    </div>
  )

  const categorias = ['todos', ...new Set(lugares360.map(l => l.categoria))]
  const filtrados = filtro === 'todos' ? lugares360 : lugares360.filter(l => l.categoria === filtro)

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a472a, #2d6a4f)',
        color: 'white', padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <button onClick={() => navigate('/')} style={{
          background: 'rgba(255,255,255,0.2)', color: 'white',
          border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50px',
          padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
        }}>← Inicio</button>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>📸 Recorridos 360°</h1>
          <p style={{ fontSize: '11px', opacity: 0.8 }}>Limón Indanza — Amazonía Ecuatoriana</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        {categorias.map(cat => (
          <button key={cat} onClick={() => setFiltro(cat)} style={{
            background: filtro === cat ? '#1a472a' : '#f3f4f6',
            color: filtro === cat ? 'white' : '#374151',
            border: 'none', borderRadius: '50px',
            padding: '6px 16px', cursor: 'pointer',
            fontSize: '13px', fontWeight: 'bold',
            textTransform: 'capitalize'
          }}>
            {cat === 'todos' ? '🌿 Todos' : cat}
          </button>
        ))}
      </div>

      {/* Lista de lugares */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filtrados.map(lugar => (
          <div key={lugar.id} onClick={() => setSeleccionado(lugar)} style={{
            background: 'white', borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden', cursor: 'pointer',
            transition: 'transform 0.2s',
            border: `2px solid ${seleccionado?.id === lugar.id ? '#16a34a' : 'transparent'}`
          }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {/* Imagen o placeholder */}
            <div style={{
              height: '160px',
              background: lugar.foto
                ? `url(${lugar.foto}) center/cover`
                : `linear-gradient(135deg, ${colores[lugar.categoria] || '#16a34a'}33, ${colores[lugar.categoria] || '#16a34a'}66)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '64px', position: 'relative'
            }}>
              {!lugar.foto && lugar.icono}
              {lugar.foto360 && (
                <span style={{
                  position: 'absolute', top: '8px', right: '8px',
                  background: '#1a472a', color: 'white',
                  borderRadius: '50px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold'
                }}>360°</span>
              )}
              {lugar.video && (
                <span style={{
                  position: 'absolute', top: '8px', left: '8px',
                  background: '#dc2626', color: 'white',
                  borderRadius: '50px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold'
                }}>▶ Video</span>
              )}
            </div>

            {/* Info */}
            <div style={{ padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111' }}>{lugar.nombre}</h3>
                <span style={{
                  background: (dificultadColor[lugar.dificultad] || '#16a34a') + '22',
                  color: dificultadColor[lugar.dificultad] || '#16a34a',
                  borderRadius: '50px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold'
                }}>{lugar.dificultad}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', lineHeight: '1.4' }}>
                {lugar.descripcion}
              </p>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9ca3af', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span>⏱️ {lugar.tiempo}</span>
                <span>💰 {lugar.costo}</span>
                <span>🕐 {lugar.horario}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={e => { e.stopPropagation(); navigate('/mapa3d') }} style={{
                  flex: 1, background: '#16a34a', color: 'white', border: 'none',
                  borderRadius: '8px', padding: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                }}>🧭 Cómo llegar</button>
                {lugar.foto360 && (
                  <button onClick={e => { e.stopPropagation(); navigate(`/ver360/${lugar.id}`) }} style={{
                    flex: 1, background: '#1a472a', color: 'white', border: 'none',
                    borderRadius: '8px', padding: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                  }}>📸 Ver 360°</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}