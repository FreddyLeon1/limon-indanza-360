import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, registrarEvento, darLike, quitarLike, yaDioLike } from '../supabase'
import Visor360Panel from '../components/Visor360Panel'
import VideoPanel360 from '../components/VideoPanel360'
import BotonContacto from '../components/BotonContacto'
import { ArrowLeft, Info, X, ChevronLeft, ChevronRight, Camera, Video, Image as ImageIcon, Compass, Share2, Heart, Leaf, UtensilsCrossed, BedDouble, Mountain, Backpack, Clock, Wallet } from 'lucide-react'
const TABS = [
  { key: 'recorrido', icon: Camera, label: 'Recorrido 360°' },
  { key: 'video', icon: Video, label: 'Video 360°' },
  { key: 'fotos', icon: ImageIcon, label: 'Fotos' },
]

const CATEGORIAS_FOTO = [
  { key: 'todas', icon: Leaf, label: 'Todas' },
  { key: 'comida', icon: UtensilsCrossed, label: 'Comida' },
  { key: 'habitacion', icon: BedDouble, label: 'Hospedaje' },
  { key: 'exterior', icon: Mountain, label: 'Exteriores' },
  { key: 'actividad', icon: Backpack, label: 'Actividades' },
]

export default function DetalleLugar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lugar, setLugar] = useState(null)
  const [tab, setTab] = useState('recorrido')
  const [recorridoActivo, setRecorridoActivo] = useState('principal')
  const [filtroFoto, setFiltroFoto] = useState('todas')
  const [fotoAmpliadaIndex, setFotoAmpliadaIndex] = useState(null)
  const [mostrarInfo, setMostrarInfo] = useState(false)
  const [likeActivo, setLikeActivo] = useState(false)
  const [likesCount, setLikesCount] = useState(0)

  const eventoRegistradoRef = useRef(null)

useEffect(() => {
  supabase
    .from('lugares')
    .select('*, categorias(nombre, icono, color), fotos(id, url, tipo, es_360, categoria_foto, hotspots, lat, lng, north_offset, grupo_recorrido, orden, nombre_escena)')
    .eq('id', id)
    .single()
    .then(({ data, error }) => {
      if (error) console.error('Error:', error)
      else {
        setLugar(data)
        setLikesCount(data.likes_count || 0)
        setLikeActivo(yaDioLike(data.id))
      }
    })

  if (eventoRegistradoRef.current !== id) {
    registrarEvento('vista_lugar', id)
    eventoRegistradoRef.current = id
  }
}, [id])

const manejarLike = async () => {
  if (likeActivo) {
    setLikeActivo(false)
    setLikesCount(c => c - 1)
    await quitarLike(lugar.id)
  } else {
    setLikeActivo(true)
    setLikesCount(c => c + 1)
    await darLike(lugar.id)
  }
}

  const fotos = lugar?.fotos || []
  const fotos360 = fotos.filter(f => f.tipo === 'imagen_360' && f.es_360)
  // Agrupa las fotos 360 por su recorrido
  const gruposRecorrido = [...new Set(fotos360.map(f => f.grupo_recorrido || 'principal'))]
  const fotos360DelGrupoActivo = fotos360.filter(f => (f.grupo_recorrido || 'principal') === recorridoActivo)
  const videos360 = fotos.filter(f => f.tipo === 'video_360')
  const fotosNormales = fotos.filter(f => f.tipo === 'imagen' && !f.es_360)
  const categoriasConContenido = [...new Set(fotosNormales.map(f => f.categoria_foto).filter(Boolean))]
  const mostrarFiltros = categoriasConContenido.length > 1
  const categoriasVisibles = CATEGORIAS_FOTO.filter(cat => cat.key === 'todas' || categoriasConContenido.includes(cat.key))
  const fotosFiltradas = filtroFoto === 'todas'
    ? fotosNormales
    : fotosNormales.filter(f => f.categoria_foto === filtroFoto)

  useEffect(() => {
    if (fotoAmpliadaIndex === null) return
    const manejarTecla = (e) => {
      if (e.key === 'Escape') setFotoAmpliadaIndex(null)
      if (e.key === 'ArrowRight') setFotoAmpliadaIndex(i => (i + 1) % fotosFiltradas.length)
      if (e.key === 'ArrowLeft') setFotoAmpliadaIndex(i => (i - 1 + fotosFiltradas.length) % fotosFiltradas.length)
    }
    window.addEventListener('keydown', manejarTecla)
    return () => window.removeEventListener('keydown', manejarTecla)
  }, [fotoAmpliadaIndex, fotosFiltradas.length])

  // Cierra el panel de info al cambiar de pestaña, para que no quede abierto flotando sobre contenido distinto
  useEffect(() => { setMostrarInfo(false) }, [tab])

  if (!lugar) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#121D24' }}>
      <Compass size={40} strokeWidth={1.5} color="#D89D34" style={{ animation: 'spin 3s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // El fondo del ÁREA DE CONTENIDO cambia según la pestaña (negro para medios inmersivos, claro para el grid),
  const fondoContenido = (tab === 'recorrido' || tab === 'video') ? '#121D24' : '#F4F1E8'
  const fondoHeader = tab === 'fotos'
    ? '#121D24'
    : 'linear-gradient(to bottom, rgba(18,29,36,0.8) 0%, rgba(18,29,36,0.4) 65%, transparent 100%)'

  return (
    <div style={{ minHeight: '100vh', background: fondoContenido }}>
      <BotonContacto contexto={lugar.nombre} lugarId={lugar.id} />
      

      {/* ---- HEADER + PESTAÑAS: idéntico en las 3 pestañas, flota sobre el contenido ---- */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
        background: fondoHeader,
        padding: '12px 14px 20px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, display: 'flex' }}>
            <button onClick={() => navigate('/portal360')} style={{
              background: 'rgba(244,241,232,0.15)', color: '#F4F1E8',
              border: '1px solid rgba(244,241,232,0.25)', borderRadius: '50px',
              padding: '6px 14px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              fontWeight: 500, fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <ArrowLeft size={14} strokeWidth={2} /> Volver
            </button>
          </div>

          <h1 style={{
            fontSize: '15px', fontFamily: "'Outfit', sans-serif", fontWeight: 600, color: 'white', margin: 0,
            textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%'
          }}>
            {lugar.nombre}
          </h1>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setMostrarInfo(v => !v)} style={{
              background: mostrarInfo ? '#4A6B82' : 'rgba(244,241,232,0.15)',
              color: 'white',
              border: '1px solid rgba(244,241,232,0.25)',
              borderRadius: '50px', padding: '7px 14px', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <Info size={14} /> Info
            </button>
          </div>
        </div>

        {/* Pestañas: mismo estilo píldora siempre */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: tab === t.key ? '#4A6B82' : 'rgba(244,241,232,0.12)',
              color: 'white',
              border: tab === t.key ? 'none' : '1px solid rgba(244,241,232,0.2)',
              borderRadius: '50px', padding: '7px 16px', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px', fontWeight: tab === t.key ? 700 : 500, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <t.icon size={14} strokeWidth={2} />
              {t.label}
            </button>
          ))}
        </div>

        <button onClick={manejarLike} style={{
          position: 'absolute', top: '54px', right: '14px',
          background: likeActivo ? 'rgba(200,90,50,0.35)' : 'rgba(244,241,232,0.15)',
          color: 'white',
          border: '1px solid rgba(244,241,232,0.25)',
          borderRadius: '50px', padding: '7px 14px', cursor: 'pointer',
          fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <Heart size={14} color={likeActivo ? '#C85A32' : 'white'} fill={likeActivo ? '#C85A32' : 'none'} />
          {likesCount}
        </button>
      </div>

      {/* Panel de información: mismo overlay en las 3 pestañas */}
      {mostrarInfo && (
        <>
          <div onClick={() => setMostrarInfo(false)} style={{
            position: 'fixed', inset: 0, zIndex: 39
          }} />
          <div style={{
            position: 'fixed', bottom: '20px', left: '16px', right: '16px',
            background: 'rgba(18,29,36,0.85)', backdropFilter: 'blur(6px)',
            borderRadius: '16px', padding: '18px', zIndex: 40, color: 'white',
            maxWidth: '480px', margin: '0 auto', fontFamily: "'Inter', sans-serif"
          }}>
          <button onClick={() => setMostrarInfo(false)} style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'rgba(244,241,232,0.15)', border: 'none', borderRadius: '50%',
            width: '28px', height: '28px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><X size={15} color="white" /></button>

          <h2 style={{ fontSize: '17px', fontFamily: "'Inter', sans-serif", fontWeight: 600, margin: '0 24px 8px 0' }}>{lugar.nombre}</h2>
          {lugar.descripcion && (
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5', margin: '0 0 12px' }}>
              {lugar.descripcion}
            </p>
          )}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {lugar.tiempo_visita || '1 hora'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Wallet size={12} /> {lugar.costo || 'Gratuito'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Compass size={12} /> {lugar.horario || 'Todo el día'}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigate('/rutasmaps', { state: { irADestino: lugar.id } })} style={{
              flex: 1, background: '#C85A32', color: 'white', border: 'none',
              borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '13px',
              fontWeight: 700, fontFamily: "'Inter', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}><Compass size={14} /> Cómo llegar</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Te recomiendo visitar ${lugar.nombre} en Ecuador — ${window.location.origin}/lugar/${lugar.id}`)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => registrarEvento('clic_whatsapp', lugar.id)}
            style={{
              flex: 1, background: 'rgba(244,241,232,0.1)', color: 'white', border: '1px solid rgba(244,241,232,0.3)',
              borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Inter', sans-serif",
              textAlign: 'center', textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}><Share2 size={14} /> Compartir</a>
          </div>
          </div>
        </>
      )}

      {/* ---- CONTENIDO: esto sí cambia según la pestaña ---- */}
      {tab === 'recorrido' && (
        <div style={{ position: 'fixed', inset: 0 }}>
          {gruposRecorrido.length > 1 && (
            <div style={{
              position: 'absolute', top: '100px', left: 0, right: 0,
              display: 'flex', gap: '8px', justifyContent: 'center', zIndex: 20
            }}>
              {gruposRecorrido.map(grupo => (
                <button key={grupo} onClick={() => setRecorridoActivo(grupo)} style={{
                  background: recorridoActivo === grupo ? '#4A6B82' : 'rgba(18,29,36,0.6)',
                  color: 'white', border: '1px solid rgba(244,241,232,0.25)',
                  borderRadius: '50px', padding: '6px 16px', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px', fontWeight: recorridoActivo === grupo ? 700 : 500,
                  textTransform: 'capitalize'
                }}>{grupo}</button>
              ))}
            </div>
          )}
          <Visor360Panel fotos360={fotos360DelGrupoActivo} nombreLugar={lugar.nombre} fullScreen />
        </div>
      )}

{tab === 'video' && (
  <div style={{ position: 'fixed', inset: 0 }}>
    <VideoPanel360 videos360={videos360} fullScreen />
  </div>
)}

      {tab === 'fotos' && (
        <>
          <div style={{ padding: '110px 16px 16px' }}>

            {/* Filtros de categoría — solo si hay más de una con contenido */}
            {mostrarFiltros && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {categoriasVisibles.map(cat => (
                  <button key={cat.key} onClick={() => setFiltroFoto(cat.key)} style={{
                    background: filtroFoto === cat.key ? '#4A6B82' : 'white',
                    color: filtroFoto === cat.key ? 'white' : '#374151',
                    border: filtroFoto === cat.key ? 'none' : '1px solid rgba(18,29,36,0.1)',
                    borderRadius: '50px',
                    padding: '6px 14px', cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <cat.icon size={13} strokeWidth={2} />
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {/* Grid de fotos filtradas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: '8px' }}>
              {fotosFiltradas.length > 0
                ? fotosFiltradas.map((f, i) => (
                    <img
                      key={i}
                      src={f.url}
                      loading="lazy"
                      onClick={() => setFotoAmpliadaIndex(i)}
                      style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
                    />
                  ))
                : (
                  <div style={{ gridColumn: '1/-1', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <ImageIcon size={36} strokeWidth={1.5} color="#4A6B82" style={{ marginBottom: '10px', opacity: 0.6 }} />
                    <p style={{ color: '#6b7280', fontFamily: "'Inter', sans-serif", fontSize: '14px', margin: 0 }}>
                      Aún no hay fotos en esta categoría
                    </p>
                  </div>
                )
              }
            </div>
          </div>

          {fotoAmpliadaIndex !== null && fotosFiltradas[fotoAmpliadaIndex] && (
            <div
              onClick={() => setFotoAmpliadaIndex(null)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(18,29,36,0.94)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 100, cursor: 'pointer', padding: '20px'
              }}
            >
              <img
                src={fotosFiltradas[fotoAmpliadaIndex].url}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }}
              />

              <button onClick={() => setFotoAmpliadaIndex(null)} style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'rgba(244,241,232,0.15)', border: '1px solid rgba(244,241,232,0.25)',
                borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}><X size={17} color="white" /></button>

              {fotosFiltradas.length > 1 && (
                <>
                  <button
                    onClick={e => { e.stopPropagation(); setFotoAmpliadaIndex(i => (i - 1 + fotosFiltradas.length) % fotosFiltradas.length) }}
                    style={{
                      position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                      background: 'rgba(244,241,232,0.15)', border: '1px solid rgba(244,241,232,0.25)',
                      borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}><ChevronLeft size={22} color="white" /></button>
                  <button
                    onClick={e => { e.stopPropagation(); setFotoAmpliadaIndex(i => (i + 1) % fotosFiltradas.length) }}
                    style={{
                      position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                      background: 'rgba(244,241,232,0.15)', border: '1px solid rgba(244,241,232,0.25)',
                      borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}><ChevronRight size={22} color="white" /></button>
                  <span style={{
                    position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(18,29,36,0.7)', color: 'white', fontSize: '13px',
                    fontFamily: "'Inter', sans-serif", fontWeight: 500,
                    padding: '4px 12px', borderRadius: '50px'
                  }}>{fotoAmpliadaIndex + 1} / {fotosFiltradas.length}</span>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
