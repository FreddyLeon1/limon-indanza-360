import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { ArrowLeft, Compass, Globe2, Building2, Leaf, Search, Camera, Video, Play, MapPin, Clock, Wallet, Timer, SearchX, Image as ImageIcon, Heart } from 'lucide-react'
import isotipoUumka from '../assets/uumka-isotipo.png'

function semillaDelDia() {
  const hoy = new Date()
  return hoy.getFullYear() * 10000 + (hoy.getMonth() + 1) * 100 + hoy.getDate()
}
function mezclarConSemilla(arr, semilla) {
  const array = [...arr]
  let s = semilla
  const random = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

const dificultadColor = {
  'Fácil': '#3A6B52',
  'Media': '#E0A138',
  'Difícil': '#C85A32'
}

export default function Recorridos() {
  const navigate = useNavigate()
  const [lugares, setLugares] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    supabase
      .from('lugares')
      .select('*, categorias(nombre, icono, color), fotos(url, tipo, es_360, es_portada)')
      .eq('activo', true)
      .then(({ data, error }) => {
        if (error) console.error('Error:', error)
        else setLugares(data || [])
        setCargando(false)
      })
  }, [])

  
  const categorias = ['todos', 'ciudad', 'naturaleza']

  const filtrados = useMemo(() => {
    const base = lugares
      .filter(l => filtro === 'todos' || l.tipo === filtro)
      .filter(l => l.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    // Solo mezclamos cuando no hay búsqueda activa — si alguien busca, quiere precisión, no descubrimiento
    return busqueda ? base : mezclarConSemilla(base, semillaDelDia())
  }, [lugares, filtro, busqueda])

  const destacados = useMemo(() => {
    return [...lugares].filter(l => l.likes_count > 0).sort((a, b) => b.likes_count - a.likes_count).slice(0, 6)
  }, [lugares])

  const lugarTop = destacados[0] || null

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{
        background: '#121D24',
        color: '#F4F1E8', padding: '14px 20px',
        display: 'flex', alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
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
          <div>
            <h1 style={{ fontSize: '16px', fontFamily: "'Outfit', sans-serif", fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
              Portal 360°
            </h1>
          </div>
        </div>

        {/* Derecha: espacio reservado (equilibra el layout) */}
        <div style={{ flex: 1 }} />
      </div>

      {/* Filtros + buscador */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', background: '#F4F1E8', borderBottom: '1px solid rgba(18,29,36,0.1)' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'todos', icon: Globe2, label: 'Todos' },
            { key: 'ciudad', icon: Building2, label: 'Ciudad' },
            { key: 'naturaleza', icon: Leaf, label: 'Naturaleza' }
          ].map(cat => (
            <button key={cat.key} onClick={() => setFiltro(cat.key)} style={{
              background: filtro === cat.key ? '#4A6B82' : 'white',
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
          <Search size={15} color="#4A6B82" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              width: '100%', padding: '7px 14px 7px 36px', borderRadius: '50px',
              border: '2px solid #4A6B82', fontSize: '13px', fontFamily: "'Inter', sans-serif",
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>
      </div>
      
      {/* Lista de lugares */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {cargando && [1, 2, 3, 4, 5, 6].map(n => (
          <div key={n} style={{
            background: 'white', borderRadius: '16px', overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
          }}>
            <div style={{ height: '160px', background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            <div style={{ padding: '14px' }}>
              <div style={{ height: '16px', width: '70%', background: '#e5e7eb', borderRadius: '4px', marginBottom: '10px', animation: 'shimmer 1.5s infinite' }} />
              <div style={{ height: '12px', width: '100%', background: '#e5e7eb', borderRadius: '4px', marginBottom: '6px', animation: 'shimmer 1.5s infinite' }} />
              <div style={{ height: '12px', width: '80%', background: '#e5e7eb', borderRadius: '4px', animation: 'shimmer 1.5s infinite' }} />
            </div>
          </div>
        ))}
        {filtrados.map(lugar => {
          const fotos = lugar.fotos || []
          const fotoPrincipal = (fotos.find(f => f.tipo === 'imagen' && f.es_portada) || fotos.find(f => f.tipo === 'imagen'))?.url
          const tiene360 = fotos.some(f => f.es_360 || f.tipo === 'imagen_360' || f.tipo === 'video_360')
          const tieneVideo = fotos.some(f => f.tipo === 'video' || f.tipo === 'video_360')
          const colorCategoria = lugar.categorias?.color || (lugar.tipo === 'ciudad' ? '#4A6B82' : '#3A6B52')
          const icono = lugar.categorias?.icono

          // Resumen de contenido — las fotos 360° se agrupan como "recorridos", no como fotos sueltas
          const totalFotosNormales = fotos.filter(f => f.tipo === 'imagen').length
          const totalRecorridos = new Set(fotos.filter(f => f.tipo === 'imagen_360').map(f => f.grupo_recorrido || 'principal')).size
          const totalVideos = fotos.filter(f => f.tipo === 'video' || f.tipo === 'video_360').length

          return (
            <div key={lugar.id} style={{
              background: 'white', borderRadius: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              transition: 'transform 0.2s',
              display: 'flex', flexDirection: 'column', height: '100%'
            }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {/* Imagen portada — clickeable, lleva al detalle 360° */}
              <div onClick={() => navigate(`/lugar/${lugar.id}`)} style={{
                height: '160px',
                background: fotoPrincipal
                  ? `url(${fotoPrincipal}) center/cover no-repeat`
                  : 'linear-gradient(135deg, #4A6B8233, #4A6B8299)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', borderRadius: '8px 8px 0 0', cursor: 'pointer'
              }}>

                {!fotoPrincipal && (
                  lugar.tipo === 'ciudad'
                    ? <Building2 size={40} color="white" strokeWidth={1.5} style={{ opacity: 0.85 }} />
                    : <Leaf size={40} color="white" strokeWidth={1.5} style={{ opacity: 0.85 }} />
                )}

                {/* Badge conteo de archivos */}
                {fotos.length > 0 && (
                  <span style={{
                    position: 'absolute', bottom: '8px', right: '8px',
                    background: 'rgba(18,29,36,0.75)', color: 'white',
                    borderRadius: '50px', padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    {totalRecorridos > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Camera size={11} /> {totalRecorridos}</span>}
                    {totalFotosNormales > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><ImageIcon size={11} /> {totalFotosNormales}</span>}
                    {totalVideos > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Video size={11} /> {totalVideos}</span>}
                    {lugar.likes_count > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Heart size={11} fill="#C85A32" color="#C85A32" /> {lugar.likes_count}</span>}
                  </span>
                )}

                {/* Indicador sutil de que la portada es clickeable */}
                <div className="uumka-overlay-hover" style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(18,29,36,0)', opacity: 0, transition: 'opacity 0.2s, background 0.2s'
                }}>
                  <Camera size={32} color="white" strokeWidth={1.5} />
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>

                {/* Contenido superior — crece libremente, empuja el botón hacia abajo */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px', gap: '8px' }}>
                    <h3 style={{
                      fontSize: '16px', fontFamily: "'Inter', sans-serif", fontWeight: 600, color: '#121D24', margin: 0,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>{lugar.nombre}</h3>
                    {lugar.dificultad && (
                      <span style={{
                        background: (dificultadColor[lugar.dificultad] || '#3A6B52') + '22',
                        color: dificultadColor[lugar.dificultad] || '#3A6B52',
                        borderRadius: '50px', padding: '2px 10px', fontSize: '11px', fontWeight: 600,
                        fontFamily: "'Inter', sans-serif",
                        whiteSpace: 'nowrap', flexShrink: 0
                      }}>{lugar.dificultad}</span>
                    )}
                  </div>

                  <p style={{
                    fontSize: '13px', color: '#6b7280', marginBottom: '10px', lineHeight: '1.4', fontFamily: "'Inter', sans-serif",
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {lugar.descripcion}
                  </p>

                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9ca3af', marginBottom: '12px', flexWrap: 'wrap', fontFamily: "'Inter', sans-serif" }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Timer size={12} /> {lugar.tiempo_visita || '1 hora'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Wallet size={12} /> {lugar.costo || 'Gratuito'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {lugar.horario || 'Todo el día'}</span>
                  </div>
                </div>

                {/* Botón único: Cómo llegar */}
                <button onClick={() => navigate('/rutasmaps', { state: { irADestino: lugar.id } })} style={{
                  width: '100%', background: '#C85A32', color: 'white', border: 'none',
                  borderRadius: '8px', padding: '9px', cursor: 'pointer', fontSize: '13px',
                  fontWeight: 700, fontFamily: "'Inter', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                  <Compass size={14} /> Cómo llegar
                </button>
              </div>

            </div>
          )
        })}

        {!cargando && filtrados.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 20px' }}>
            <SearchX size={44} strokeWidth={1.5} color="#4A6B82" style={{ marginBottom: '14px' }} />
            <p style={{ fontSize: '15px', fontFamily: "'Inter', sans-serif", fontWeight: 600, color: '#121D24', marginBottom: '4px' }}>
              {busqueda
                ? `Nada llamado "${busqueda}" por aquí todavía`
                : 'Aún no hay lugares en esta categoría'}
            </p>
            <p style={{ fontSize: '13px', fontFamily: "'Inter', sans-serif", color: '#6b7280' }}>
              {busqueda
                ? 'Prueba con otro nombre, o explora todos los rincones ocultos.'
                : 'Vuelve pronto — seguimos revelando nuevos senderos.'}
            </p>
          </div>
        )}

      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
    
  )
}