import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import isotipoUumka from '../assets/uumka-isotipo.png'

const CATEGORIAS_FOTO_ADMIN = [
  { value: 'comida', label: '🍽️ Comida' },
  { value: 'habitacion', label: '🛏️ Hospedaje' },
  { value: 'exterior', label: '🌄 Exteriores' },
  { value: 'actividad', label: '🎒 Actividades' },
]
const comprimirImagen = (archivo, maxAncho, calidad) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const lector = new FileReader()

    lector.onerror = () => reject(new Error('No se pudo leer el archivo'))
    img.onerror = () => reject(new Error('No se pudo decodificar la imagen'))

    lector.onload = (e) => {
      img.src = e.target.result
    }

    img.onload = () => {
      try {
        let { width, height } = img
        if (width > maxAncho) {
          height = Math.round((height * maxAncho) / width)
          width = maxAncho
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('No se pudo generar la imagen comprimida'))
              return
            }
            const archivoComprimido = new File([blob], archivo.name, { type: 'image/jpeg' })
            resolve(archivoComprimido)
          },
          'image/jpeg',
          calidad
        )
      } catch (err) {
        reject(err)
      }
    }

    lector.readAsDataURL(archivo)
  })
}

export default function Admin() {
  const navigate = useNavigate()
  const [sesion, setSesion] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [lugares, setLugares] = useState([])
  const [categorias, setCategorias] = useState([])
  const [vista, setVista] = useState('lista')
  const [lugarSeleccionado, setLugarSeleccionado] = useState(null)
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([])
  const [tipoArchivo, setTipoArchivo] = useState('imagen')
  const [latFoto, setLatFoto] = useState('')
  const [lngFoto, setLngFoto] = useState('')
  const [offsetFoto, setOffsetFoto] = useState('0')
  const [grupoRecorridoFoto, setGrupoRecorridoFoto] = useState('principal')
  const [nombreEscenaFoto, setNombreEscenaFoto] = useState('')
  const [editandoHotspots, setEditandoHotspots] = useState(null)
  const [editandoUbicacion, setEditandoUbicacion] = useState(null)
  const [ubicacionForm, setUbicacionForm] = useState({ lat: '', lng: '', offset: '0' })
  const [hotspotsForm, setHotspotsForm] = useState([])
  const [conectarAmbosSentidos, setConectarAmbosSentidos] = useState(true)
  const [categoriaFotoSeleccionada, setCategoriaFotoSeleccionada] = useState('comida')
  const [subiendoArchivos, setSubiendoArchivos] = useState(false)
  const [fotosLugar, setFotosLugar] = useState([])
  const [form, setForm] = useState({
    nombre: '', descripcion: '', categoria_id: '',
    tipo: 'naturaleza', coordenadas_lat: '', coordenadas_lng: '',
    parking_lat: '', parking_lng: '', dificultad: 'Fácil',
    tiempo_visita: '', costo: '', horario: '', telefono: '', activo: true
  })
  const [editandoId, setEditandoId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    supabase.auth.onAuthStateChange((_e, session) => setSesion(session))
  }, [])

  useEffect(() => {
    if (sesion) { cargarLugares(); cargarCategorias() }
  }, [sesion])

  const cargarLugares = async () => {
    const { data } = await supabase
      .from('lugares')
      .select('*, categorias(nombre)')
      .order('creado_en', { ascending: false })
    setLugares(data || [])
  }

  const cargarCategorias = async () => {
    const { data } = await supabase.from('categorias').select('*')
    setCategorias(data || [])
  }

  const cargarFotosLugar = async (lugarId) => {
    const { data } = await supabase
      .from('fotos')
      .select('*')
      .eq('lugar_id', lugarId)
      .order('orden', { ascending: true })
    setFotosLugar(data || [])
  }

  const login = async () => {
    setCargando(true)
    setError('')
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('❌ Email o contraseña incorrectos')
      setCargando(false)
      return
    }
    const { data: adminData, error: adminError } = await supabase
      .from('usuarios_admin')
      .select('id')
      .eq('user_id', data.user.id)
      .single()
    if (adminError || !adminData) {
      await supabase.auth.signOut()
      setError('❌ No tienes permisos de administrador')
      setCargando(false)
      return
    }
    setCargando(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setSesion(null)
  }

  const subirArchivos = async (lugarId) => {
    if (archivosSeleccionados.length === 0) return

    if (tipoArchivo === 'imagen_360' && (!latFoto || !lngFoto)) {
      alert('⚠️ Debes escribir Latitud y Longitud antes de subir una foto 360°')
      return
    }

    setSubiendoArchivos(true)

    // Cuenta cuántas fotos ya tiene este lugar, para seguir la numeración en vez de reiniciarla
    const { count } = await supabase
      .from('fotos')
      .select('*', { count: 'exact', head: true })
      .eq('lugar_id', lugarId)

    for (let i = 0; i < archivosSeleccionados.length; i++) {
      let archivo = archivosSeleccionados[i]

      // Solo comprimimos imágenes (no videos) — cada tipo tiene su propio límite
      if (tipoArchivo === 'imagen') {
        archivo = await comprimirImagen(archivo, 1600, 0.7)
      } else if (tipoArchivo === 'imagen_360') {
        archivo = await comprimirImagen(archivo, 3000, 0.7)
      }
      const extension = tipoArchivo === 'imagen' || tipoArchivo === 'imagen_360' ? 'jpg' : archivo.name.split('.').pop()
      const nombreArchivo = `${lugarId}_${Date.now()}_${i}.${extension}`
      const rutaArchivo = `lugares/${nombreArchivo}`

      const { error: errorSubida } = await supabase.storage
        .from('fotos-lugares')
        .upload(rutaArchivo, archivo)

      if (errorSubida) {
        console.error('Error subiendo archivo:', errorSubida)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('fotos-lugares')
        .getPublicUrl(rutaArchivo)

      const es360 = tipoArchivo === 'imagen_360' || tipoArchivo === 'video_360'
      await supabase.from('fotos').insert({
        lugar_id: lugarId,
        url: urlData.publicUrl,
        tipo: tipoArchivo,
        es_360: es360,
        categoria_foto: tipoArchivo === 'imagen' ? categoriaFotoSeleccionada : null,
        orden: (count || 0) + i + 1,
        lat: tipoArchivo === 'imagen_360' && latFoto ? parseFloat(latFoto) : null,
        lng: tipoArchivo === 'imagen_360' && lngFoto ? parseFloat(lngFoto) : null,
        north_offset: tipoArchivo === 'imagen_360' ? (parseFloat(offsetFoto) || 0) : 0,
        grupo_recorrido: tipoArchivo === 'imagen_360' ? (grupoRecorridoFoto || 'principal') : null,
        nombre_escena: tipoArchivo === 'imagen_360' ? (nombreEscenaFoto || null) : null
      })

    }

    setSubiendoArchivos(false)
    setArchivosSeleccionados([])
    await cargarFotosLugar(lugarId)
  }

  const eliminarFoto = async (foto) => {
  if (!confirm('¿Eliminar este archivo?')) return

  // Extrae la ruta del archivo a partir de la URL pública, para poder borrarlo del Storage
  const partes = foto.url.split('/fotos-lugares/')
  const rutaArchivo = partes[1]

  if (rutaArchivo) {
    const { error: errorStorage } = await supabase.storage
      .from('fotos-lugares')
      .remove([rutaArchivo])
    if (errorStorage) console.error('Error borrando del storage:', errorStorage)
  }

  await supabase.from('fotos').delete().eq('id', foto.id)
  await cargarFotosLugar(lugarSeleccionado.id)
}
  const marcarPortada = async (foto) => {
    // Primero, quita la portada de todas las fotos de este lugar
    await supabase.from('fotos').update({ es_portada: false }).eq('lugar_id', foto.lugar_id)
    // Luego, marca esta como la nueva portada
    await supabase.from('fotos').update({ es_portada: true }).eq('id', foto.id)
    await cargarFotosLugar(foto.lugar_id)
  }
  const abrirEditorHotspots = (foto) => {
  const otras360 = fotosLugar.filter(f => f.tipo === 'imagen_360' && f.id !== foto.id)
  const actuales = foto.hotspots || []
  setHotspotsForm(otras360.map(o => {
    const existente = actuales.find(h => String(h.target) === String(o.id))
    return {
      fotoId: o.id,
      url: o.url,
      orden: o.orden,
      seleccionado: !!existente,
      label: existente?.label || ''
    }
  }))
  setEditandoHotspots(foto)
}

const guardarHotspots = async () => {
  const nuevosHotspots = hotspotsForm
    .filter(h => h.seleccionado)
    .map(h => ({ target: h.fotoId, label: h.label || 'Continuar' }))

  await supabase.from('fotos').update({ hotspots: nuevosHotspots }).eq('id', editandoHotspots.id)

  // Si está activo, también agrega la conexión de vuelta en cada foto marcada
  if (conectarAmbosSentidos) {
    const seleccionadas = hotspotsForm.filter(h => h.seleccionado)
    for (const h of seleccionadas) {
      const { data: fotoDestino } = await supabase
        .from('fotos')
        .select('hotspots')
        .eq('id', h.fotoId)
        .single()

      const hotspotsExistentes = fotoDestino?.hotspots || []
      const yaExiste = hotspotsExistentes.some(hs => String(hs.target) === String(editandoHotspots.id))

      if (!yaExiste) {
        const actualizados = [
          ...hotspotsExistentes,
          { target: editandoHotspots.id, label: 'Volver' }
        ]
        await supabase.from('fotos').update({ hotspots: actualizados }).eq('id', h.fotoId)
      }
    }
  }

  setEditandoHotspots(null)
  await cargarFotosLugar(editandoHotspots.lugar_id)
}
const abrirEditorUbicacion = (foto) => {
  setUbicacionForm({
    lat: foto.lat ?? '',
    lng: foto.lng ?? '',
    offset: foto.north_offset ?? '0'
  })
  setEditandoUbicacion(foto)
}

const guardarUbicacion = async () => {
  if (!ubicacionForm.lat || !ubicacionForm.lng) {
    alert('⚠️ Latitud y Longitud son obligatorias')
    return
  }
  await supabase.from('fotos').update({
    lat: parseFloat(ubicacionForm.lat),
    lng: parseFloat(ubicacionForm.lng),
    north_offset: parseFloat(ubicacionForm.offset) || 0
  }).eq('id', editandoUbicacion.id)
  setEditandoUbicacion(null)
  await cargarFotosLugar(editandoUbicacion.lugar_id)
}

  const guardarLugar = async () => {
    setCargando(true)
    const datos = {
      ...form,
      coordenadas_lat: parseFloat(form.coordenadas_lat),
      coordenadas_lng: parseFloat(form.coordenadas_lng),
      parking_lat: form.parking_lat ? parseFloat(form.parking_lat) : null,
      parking_lng: form.parking_lng ? parseFloat(form.parking_lng) : null,
      categoria_id: parseInt(form.categoria_id)
    }

    let lugarId = editandoId
    if (editandoId) {
      await supabase.from('lugares').update(datos).eq('id', editandoId)
    } else {
      const { data: nuevoLugar } = await supabase
        .from('lugares').insert(datos).select('id').single()
      lugarId = nuevoLugar?.id
    }

    if (lugarId && archivosSeleccionados.length > 0) {
      await subirArchivos(lugarId)
    }

    await cargarLugares()
    setVista('lista')
    resetForm()
    setCargando(false)
  }

  const resetForm = () => {
    setForm({
      nombre: '', descripcion: '', categoria_id: '',
      tipo: 'naturaleza', coordenadas_lat: '', coordenadas_lng: '',
      parking_lat: '', parking_lng: '', dificultad: 'Fácil',
      tiempo_visita: '', costo: '', horario: '', telefono: '', activo: true
    })
    setEditandoId(null)
    setArchivosSeleccionados([])
    setFotosLugar([])
    setLugarSeleccionado(null)
  }

  const editarLugar = (lugar) => {
    setForm({
      nombre: lugar.nombre || '',
      descripcion: lugar.descripcion || '',
      categoria_id: lugar.categoria_id || '',
      tipo: lugar.tipo || 'naturaleza',
      coordenadas_lat: lugar.coordenadas_lat || '',
      coordenadas_lng: lugar.coordenadas_lng || '',
      parking_lat: lugar.parking_lat || '',
      parking_lng: lugar.parking_lng || '',
      dificultad: lugar.dificultad || 'Fácil',
      tiempo_visita: lugar.tiempo_visita || '',
      costo: lugar.costo || '',
      horario: lugar.horario || '',
      telefono: lugar.telefono || '',
      activo: lugar.activo
    })
    setEditandoId(lugar.id)
    setLugarSeleccionado(lugar)
    cargarFotosLugar(lugar.id)
    setVista('formulario')
  }

  const eliminarLugar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este lugar?')) return
    await supabase.from('lugares').delete().eq('id', id)
    await cargarLugares()
  }

  const toggleActivo = async (id, activo) => {
    await supabase.from('lugares').update({ activo: !activo }).eq('id', id)
    await cargarLugares()
  }

  const tipoIcono = (tipo) => {
    if (tipo === 'imagen') return '📷'
    if (tipo === 'imagen_360') return '🔄📷'
    if (tipo === 'video') return '🎬'
    if (tipo === 'video_360') return '🔄🎬'
    return '📁'
  }

  const aceptaArchivo = (tipo) => {
    if (tipo === 'video' || tipo === 'video_360') return 'video/*'
    return 'image/*'
  }

  // LOGIN
  if (!sesion) return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #1a472a, #2d6a4f)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', padding: '40px',
        width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src={isotipoUumka} alt="Uumka" style={{ width: '48px', height: '48px' }} />
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#121D24' }}>Panel Admin</h1>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Limón Indanza 360°</p>
        </div>
        {error && <p style={{ background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb', marginBottom: '12px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
        />
        <input type="password" placeholder="Contraseña" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb', marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
        />
        <button onClick={login} disabled={cargando} style={{
          width: '100%', background: '#D89D34', color: '#121D24', border: 'none',
          borderRadius: '8px', padding: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
        }}>{cargando ? 'Ingresando...' : 'Ingresar'}</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a472a, #2d6a4f)',
        color: 'white', padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={isotipoUumka} alt="Uumka" style={{ width: '28px', height: '28px' }} />
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>Panel de Administración</h1>
            <p style={{ fontSize: '11px', opacity: 0.8 }}>Uumka</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/')} style={{
            background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none',
            borderRadius: '50px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px'
          }}>🌐 Ver sitio</button>
          <button onClick={() => navigate('/admin/metricas')} style={{
            background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none',
            borderRadius: '50px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px'
          }}>📊 Ver métricas</button>
          <button onClick={logout} style={{
            background: '#dc2626', color: 'white', border: 'none',
            borderRadius: '50px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px'
          }}>🚪 Salir</button>
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>

        {/* LISTA DE LUGARES */}
        {vista === 'lista' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a472a' }}>
                Lugares ({lugares.length})
              </h2>
              <button onClick={() => { resetForm(); setVista('formulario') }} style={{
                background: '#D89D34', color: '#121D24', border: 'none',
                borderRadius: '8px', padding: '10px 20px', cursor: 'pointer',
                fontSize: '14px', fontWeight: 'bold'
              }}>+ Agregar lugar</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lugares.map(lugar => (
                <div key={lugar.id} style={{
                  background: 'white', borderRadius: '12px', padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: '12px', opacity: lugar.activo ? 1 : 0.5
                }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111', marginBottom: '4px' }}>
                      {lugar.nombre}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>
                      {lugar.categorias?.nombre} • {lugar.tipo} • {lugar.dificultad}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => toggleActivo(lugar.id, lugar.activo)} style={{
                      background: lugar.activo ? '#f0fdf4' : '#fef2f2',
                      color: lugar.activo ? '#16a34a' : '#dc2626',
                      border: `1px solid ${lugar.activo ? '#16a34a' : '#dc2626'}`,
                      borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px'
                    }}>{lugar.activo ? '✅ Activo' : '❌ Inactivo'}</button>
                    <button onClick={() => editarLugar(lugar)} style={{
                      background: '#f0fdf4', color: '#1a472a', border: '1px solid #16a34a',
                      borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px'
                    }}>✏️ Editar</button>
                    <button onClick={() => { setLugarSeleccionado(lugar); cargarFotosLugar(lugar.id); setVista('medios') }} style={{
                      background: '#eff6ff', color: '#2563eb', border: '1px solid #2563eb',
                      borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px'
                    }}>📸 Medios</button>
                    <button onClick={() => eliminarLugar(lugar.id)} style={{
                      background: '#fef2f2', color: '#dc2626', border: '1px solid #dc2626',
                      borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px'
                    }}>🗑️ Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* FORMULARIO DE LUGAR */}
        {vista === 'formulario' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button onClick={() => { setVista('lista'); resetForm() }} style={{
                background: '#f3f4f6', color: '#374151', border: 'none',
                borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px'
              }}>← Volver</button>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a472a' }}>
                {editandoId ? '✏️ Editar lugar' : '➕ Agregar lugar'}
              </h2>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                {[
                  { label: 'Nombre', key: 'nombre', type: 'text', full: true },
                  { label: 'Descripción', key: 'descripcion', type: 'textarea', full: true },
                  { label: 'Latitud', key: 'coordenadas_lat', type: 'number' },
                  { label: 'Longitud', key: 'coordenadas_lng', type: 'number' },
                  { label: 'Parking Lat (opcional)', key: 'parking_lat', type: 'number' },
                  { label: 'Parking Lng (opcional)', key: 'parking_lng', type: 'number' },
                  { label: 'Tiempo de visita', key: 'tiempo_visita', type: 'text' },
                  { label: 'Costo', key: 'costo', type: 'text' },
                  { label: 'Horario', key: 'horario', type: 'text' },
                  { label: 'Teléfono', key: 'telefono', type: 'text' },
                ].map(campo => (
                  <div key={campo.key} style={{ gridColumn: campo.full ? '1 / -1' : 'auto' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '6px' }}>
                      {campo.label}
                    </label>
                    {campo.type === 'textarea' ? (
                      <textarea value={form[campo.key]}
                        onChange={e => setForm({ ...form, [campo.key]: e.target.value })}
                        rows={3}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                      />
                    ) : (
                      <input type={campo.type} value={form[campo.key]}
                        onChange={e => setForm({ ...form, [campo.key]: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                      />
                    )}
                  </div>
                ))}

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '6px' }}>Categoría</label>
                  <select value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none' }}>
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '6px' }}>Tipo</label>
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none' }}>
                    <option value="naturaleza">🌿 Naturaleza</option>
                    <option value="ciudad">🏙️ Ciudad</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '6px' }}>Dificultad</label>
                  <select value={form.dificultad} onChange={e => setForm({ ...form, dificultad: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none' }}>
                    <option value="Fácil">🟢 Fácil</option>
                    <option value="Media">🟡 Media</option>
                    <option value="Difícil">🔴 Difícil</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '6px' }}>Estado</label>
                  <select value={form.activo} onChange={e => setForm({ ...form, activo: e.target.value === 'true' })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none' }}>
                    <option value="true">✅ Activo</option>
                    <option value="false">❌ Inactivo</option>
                  </select>
                </div>

              </div>

              <button onClick={guardarLugar} disabled={cargando} style={{
                marginTop: '20px', background: '#D89D34', color: '#121D24', border: 'none',
                borderRadius: '8px', padding: '12px 32px', fontSize: '16px',
                fontWeight: 'bold', cursor: 'pointer', width: '100%'
              }}>
                {cargando ? '⏳ Guardando...' : editandoId ? '💾 Actualizar lugar' : '➕ Guardar lugar'}
              </button>
            </div>
          </>
        )}

        {/* GESTIÓN DE MEDIOS */}
        {vista === 'medios' && lugarSeleccionado && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button onClick={() => { setVista('lista'); resetForm() }} style={{
                background: '#f3f4f6', color: '#374151', border: 'none',
                borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px'
              }}>← Volver</button>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a472a' }}>
                📸 Medios — {lugarSeleccionado.nombre}
              </h2>
            </div>

            {/* Subir nuevo archivo */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a472a', marginBottom: '16px' }}>
                ➕ Subir nuevo archivo
              </h3>

              {/* Selector de tipo */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '8px' }}>
                  Tipo de contenido
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { value: 'imagen', label: '📷 Foto normal' },
                    { value: 'imagen_360', label: '🔄📷 Foto 360°' },
                    { value: 'video', label: '🎬 Video normal' },
                    { value: 'video_360', label: '🔄🎬 Video 360°' },
                  ].map(op => (
                    <button key={op.value} onClick={() => { setTipoArchivo(op.value); setArchivosSeleccionados([]) }} style={{
                      background: tipoArchivo === op.value ? '#1a472a' : '#f3f4f6',
                      color: tipoArchivo === op.value ? 'white' : '#374151',
                      border: `2px solid ${tipoArchivo === op.value ? '#1a472a' : '#e5e7eb'}`,
                      borderRadius: '8px', padding: '10px', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 'bold'
                    }}>{op.label}</button>
                  ))}
                </div>
              </div>
              {/* Selector de categoría (solo para fotos normales) */}
              {tipoArchivo === 'imagen' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '8px' }}>
                    Categoría de la foto
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {CATEGORIAS_FOTO_ADMIN.map(cat => (
                      <button key={cat.value} onClick={() => setCategoriaFotoSeleccionada(cat.value)} style={{
                        background: categoriaFotoSeleccionada === cat.value ? '#16a34a' : '#f3f4f6',
                        color: categoriaFotoSeleccionada === cat.value ? 'white' : '#374151',
                        border: `2px solid ${categoriaFotoSeleccionada === cat.value ? '#16a34a' : '#e5e7eb'}`,
                        borderRadius: '8px', padding: '10px', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 'bold'
                      }}>{cat.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {tipoArchivo === 'imagen_360' && (
                <div style={{ marginBottom: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
                  <p style={{ fontSize: '12px', color: '#166534', marginBottom: '10px', fontWeight: 'bold' }}>
                    📍 Coordenadas GPS de esta foto (anotadas en el campo)
                  </p>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '11px', color: '#374151', display: 'block', marginBottom: '4px' }}>
                      Nombre de esta escena (ej: "Entrada", "Pasillo escaleras")
                    </label>
                    <input type="text" placeholder="Opcional" value={nombreEscenaFoto}
                      onChange={e => setNombreEscenaFoto(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#374151', display: 'block', marginBottom: '4px' }}>Latitud</label>
                      <input type="number" step="any" placeholder="-2.972500" value={latFoto}
                        onChange={e => setLatFoto(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#374151', display: 'block', marginBottom: '4px' }}>Longitud</label>
                      <input type="number" step="any" placeholder="-78.439444" value={lngFoto}
                        onChange={e => setLngFoto(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#374151', display: 'block', marginBottom: '4px' }}>
                      Corrección de norte (grados, deja 0 si no lo sabes aún)
                    </label>
                    <input type="number" placeholder="0" value={offsetFoto}
                      onChange={e => setOffsetFoto(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}
              {/* Input de archivo */}
              <input
                type="file"
                accept={aceptaArchivo(tipoArchivo)}
                multiple={tipoArchivo !== 'imagen_360'}
                onChange={e => {
                  const archivos = Array.from(e.target.files)
                  if (tipoArchivo === 'imagen_360' && archivos.length > 1) {
                    alert('⚠️ Las fotos 360° se suben de una en una, ya que cada una necesita sus propias coordenadas GPS.')
                    e.target.value = ''
                    setArchivosSeleccionados([])
                    return
                  }
                  setArchivosSeleccionados(archivos)
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px dashed #16a34a', fontSize: '14px', boxSizing: 'border-box', cursor: 'pointer', background: '#f0fdf4', marginBottom: '12px' }}
              />
              

              {/* Vista previa */}
              {archivosSeleccionados.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {archivosSeleccionados.map((archivo, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      {(tipoArchivo === 'imagen' || tipoArchivo === 'imagen_360') ? (
                        <img src={URL.createObjectURL(archivo)} alt={archivo.name}
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #16a34a' }}
                        />
                      ) : (
                        <div style={{ width: '80px', height: '80px', background: '#1a472a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                          🎬
                        </div>
                      )}
                      <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {archivo.name}
                      </p>
                    </div>
                  ))}
                  <p style={{ fontSize: '12px', color: '#16a34a', alignSelf: 'center' }}>
                    ✅ {archivosSeleccionados.length} archivo(s) listo(s)
                  </p>
                </div>
              )}

              <button
                onClick={() => subirArchivos(lugarSeleccionado.id)}
                disabled={archivosSeleccionados.length === 0 || subiendoArchivos}
                style={{
                  background: archivosSeleccionados.length === 0 ? '#9ca3af' : '#16a34a',
                  color: 'white', border: 'none', borderRadius: '8px',
                  padding: '12px', fontSize: '14px', fontWeight: 'bold',
                  cursor: archivosSeleccionados.length === 0 ? 'not-allowed' : 'pointer', width: '100%'
                }}>
                {subiendoArchivos ? '⏳ Optimizando y subiendo...' : '⬆️ Subir archivos'}
              </button>
            </div> 
            {/* Lista de archivos existentes */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a472a', marginBottom: '16px' }}>
                📁 Archivos del lugar ({fotosLugar.length})
              </h3>

              {fotosLugar.length === 0 ? (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
                  No hay archivos aún — sube fotos o videos arriba
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                  {fotosLugar.map(foto => (
                    <div key={foto.id} style={{
                      borderRadius: '10px', overflow: 'hidden',
                      border: '2px solid #e5e7eb', position: 'relative'
                    }}>
                      {(foto.tipo === 'imagen' || foto.tipo === 'imagen_360') ? (
                        <img src={foto.url} alt="foto"
                          style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100px', background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
                          🎬
                        </div>
                      )}
                      <div style={{ padding: '6px 8px', background: '#f9fafb' }}>
                        <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#374151', margin: '0 0 4px' }}>
                          {tipoIcono(foto.tipo)} {foto.tipo?.replace('_', ' ')}
                        </p>
                        {foto.categoria_foto && (
                          <p style={{
                            fontSize: '10px', color: '#16a34a', background: '#f0fdf4',
                            border: '1px solid #bbf7d0', borderRadius: '4px',
                            padding: '2px 6px', margin: '0 0 6px', display: 'inline-block'
                          }}>
                            🏷️ {foto.categoria_foto}
                          </p>
                        )}
                        {foto.es_portada && (
                          <p style={{
                            fontSize: '10px', color: '#b45309', background: '#fffbeb',
                            border: '1px solid #fde68a', borderRadius: '4px',
                            padding: '2px 6px', margin: '0 0 6px', display: 'inline-block', fontWeight: 'bold'
                          }}>
                            ⭐ Portada actual
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {foto.tipo === 'imagen' && !foto.es_portada && (
                            <button onClick={() => marcarPortada(foto)} style={{
                              flex: 1, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
                              borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', fontSize: '11px'
                            }}>⭐ Portada</button>
                          )}
                          {foto.tipo === 'imagen_360' && (
                            <button onClick={() => abrirEditorUbicacion(foto)} style={{
                              flex: 1, background: foto.lat ? '#f0fdf4' : '#fffbeb',
                              color: foto.lat ? '#16a34a' : '#b45309',
                              border: `1px solid ${foto.lat ? '#16a34a' : '#fde68a'}`,
                              borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', fontSize: '11px'
                            }}>{foto.lat ? '📍 Ubicación' : '⚠️ Sin ubicar'}</button>
                          )}
                          {foto.tipo === 'imagen_360' && (
                            <button onClick={() => abrirEditorHotspots(foto)} style={{
                              flex: 1, background: '#eff6ff', color: '#2563eb', border: '1px solid #2563eb',
                              borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', fontSize: '11px'
                            }}>🔗 Conectar</button>
                          )}
                          <button onClick={() => eliminarFoto(foto)} style={{
                            flex: 1, background: '#fef2f2', color: '#dc2626', border: '1px solid #dc2626',
                            borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', fontSize: '11px'
                          }}>🗑️ Eliminar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {editandoUbicacion && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
              }}>
                <div style={{
                  background: 'white', borderRadius: '16px', padding: '24px',
                  width: '90%', maxWidth: '400px'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a472a', marginBottom: '16px' }}>
                    📍 Ubicación — Foto #{editandoUbicacion.orden}
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#374151', display: 'block', marginBottom: '4px' }}>Latitud</label>
                      <input type="number" step="any" value={ubicacionForm.lat}
                        onChange={e => setUbicacionForm({ ...ubicacionForm, lat: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#374151', display: 'block', marginBottom: '4px' }}>Longitud</label>
                      <input type="number" step="any" value={ubicacionForm.lng}
                        onChange={e => setUbicacionForm({ ...ubicacionForm, lng: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', color: '#374151', display: 'block', marginBottom: '4px' }}>
                      Corrección de norte (grados)
                    </label>
                    <input type="number" value={ubicacionForm.offset}
                      onChange={e => setUbicacionForm({ ...ubicacionForm, offset: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setEditandoUbicacion(null)} style={{
                      flex: 1, background: '#f3f4f6', color: '#374151', border: 'none',
                      borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '13px'
                    }}>Cancelar</button>
                    <button onClick={guardarUbicacion} style={{
                      flex: 1, background: '#16a34a', color: 'white', border: 'none',
                      borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                    }}>💾 Guardar ubicación</button>
                  </div>
                </div>
              </div>
            )}
            {editandoHotspots && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
              }}>
                <div style={{
                  background: 'white', borderRadius: '16px', padding: '24px',
                  width: '90%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a472a', marginBottom: '6px' }}>
                    🔗 Conectar foto #{editandoHotspots.orden}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
                    Marca a cuáles otras fotos 360 de este lugar debe llevar esta foto.
                  </p>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px',
                    background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px',
                    padding: '10px', fontSize: '12px', color: '#1e40af', cursor: 'pointer'
                  }}>
                    <input type="checkbox" checked={conectarAmbosSentidos}
                      onChange={e => setConectarAmbosSentidos(e.target.checked)}
                    />
                    🔁 Conectar también en el sentido contrario (ida y vuelta)
                  </label>
                  {hotspotsForm.length === 0 && (
                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>
                      No hay más fotos 360 en este lugar todavía para conectar.
                    </p>
                  )}

                  {hotspotsForm.map((h, i) => (
                    <div key={h.fotoId} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px', borderRadius: '8px',
                      background: h.seleccionado ? '#f0fdf4' : '#f9fafb', marginBottom: '8px'
                    }}>
                      <input type="checkbox" checked={h.seleccionado}
                        onChange={e => {
                          const copia = [...hotspotsForm]
                          copia[i].seleccionado = e.target.checked
                          setHotspotsForm(copia)
                        }}
                      />
                      <img
                        src={h.url}
                        onClick={() => window.open(h.url, '_blank')}
                        title="Clic para ver en grande"
                        style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '6px', cursor: 'zoom-in', border: '2px solid #d1d5db' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a472a', flexShrink: 0 }}>Foto #{h.orden}</span>
                      <input type="text" placeholder="Etiqueta (ej: Ir al mirador)" value={h.label}
                        onChange={e => {
                          const copia = [...hotspotsForm]
                          copia[i].label = e.target.value
                          setHotspotsForm(copia)
                        }}
                        style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px' }}
                      />
                    </div>
                  ))}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button onClick={() => setEditandoHotspots(null)} style={{
                      flex: 1, background: '#f3f4f6', color: '#374151', border: 'none',
                      borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '13px'
                    }}>Cancelar</button>
                    <button onClick={guardarHotspots} style={{
                      flex: 1, background: '#16a34a', color: 'white', border: 'none',
                      borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                    }}>💾 Guardar conexiones</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}