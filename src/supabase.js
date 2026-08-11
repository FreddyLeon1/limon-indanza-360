import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ntiyaqjwhwqcjfcurxmf.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50aXlhcWp3aHdxY2pmY3VyeG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjI4NTksImV4cCI6MjA5NjMzODg1OX0.oOr9ONPXL7GONIqQ8asnJ1IdBqN1WnIN7MhpIorkNHs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const _ultimosEventos = {}

const getSessionId = () => {
  let sid = localStorage.getItem('session_id')
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem('session_id', sid)
  }
  return sid
}

// Captura utm_source, utm_campaign y referrer SOLO la primera vez que entra
// Si ya existen guardados, no los vuelve a sobreescribir (para no perder el origen original)
const getOrigenSesion = () => {
  let origen = localStorage.getItem('origen_sesion')
  if (origen) return JSON.parse(origen)

  const params = new URLSearchParams(window.location.search)
  const nuevoOrigen = {
    utm_source: params.get('utm_source') || null,
    utm_campaign: params.get('utm_campaign') || null,
    referrer: document.referrer || null
  }
  localStorage.setItem('origen_sesion', JSON.stringify(nuevoOrigen))
  return nuevoOrigen
}

export const registrarEvento = async (tipo, lugarId = null, detalle = null) => {
  const clave = `${tipo}-${lugarId}-${detalle}`
  const ahora = Date.now()

  if (_ultimosEventos[clave] && ahora - _ultimosEventos[clave] < 2000) {
    return
  }
  _ultimosEventos[clave] = ahora

  const origen = getOrigenSesion()

  try {
    await supabase.from('eventos').insert({
      tipo,
      lugar_id: lugarId,
      detalle,
      session_id: getSessionId(),
      utm_source: origen.utm_source,
      utm_campaign: origen.utm_campaign,
      referrer: origen.referrer
    })
  } catch (err) {
    console.error('Error registrando evento:', err)
  }
}
const LIKES_KEY = 'lugares_con_like'

const getLikesLocales = () => {
  const guardados = localStorage.getItem(LIKES_KEY)
  return guardados ? JSON.parse(guardados) : []
}

export const yaDioLike = (lugarId) => getLikesLocales().includes(lugarId)

export const darLike = async (lugarId) => {
  if (yaDioLike(lugarId)) return

  const { error } = await supabase.from('likes').insert({
    lugar_id: lugarId,
    session_id: getSessionId()
  })

  // Código 23505 = ya existía (otra pestaña alcanzó a insertarlo antes) — no es un error real
  if (error && error.code !== '23505') {
    console.error('Error dando like:', error)
    return
  }

  localStorage.setItem(LIKES_KEY, JSON.stringify([...getLikesLocales(), lugarId]))
  registrarEvento('like_lugar', lugarId)
}

export const quitarLike = async (lugarId) => {
  await supabase.from('likes').delete().eq('lugar_id', lugarId).eq('session_id', getSessionId())
  localStorage.setItem(LIKES_KEY, JSON.stringify(getLikesLocales().filter(id => id !== lugarId)))
}