export default async (request, context) => {
  const userAgent = request.headers.get('user-agent') || ''
  const esRobot = /facebookexternalhit|WhatsApp|Twitterbot|Slackbot|LinkedInBot|TelegramBot|Discordbot/i.test(userAgent)

  if (!esRobot) {
    return context.next()
  }

  const url = new URL(request.url)
  const id = url.pathname.split('/lugar/')[1]

  const SUPABASE_URL = 'https://ntiyaqjwhwqcjfcurxmf.supabase.co'
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50aXlhcWp3aHdxY2pmY3VyeG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjI4NTksImV4cCI6MjA5NjMzODg1OX0.oOr9ONPXL7GONIqQ8asnJ1IdBqN1WnIN7MhpIorkNHs'

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/lugares?id=eq.${id}&select=nombre,descripcion,fotos(url,tipo,es_portada)`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  )
  const datos = await res.json()
  const lugar = datos[0]

  if (!lugar) return context.next()

  const portada = (lugar.fotos || []).find(f => f.tipo === 'imagen' && f.es_portada)?.url
    || `${url.origin}/uumka-preview-default.jpg`

  const escapeHtml = (str = '') => str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const titulo = escapeHtml(lugar.nombre)
  const descripcion = escapeHtml(lugar.descripcion || 'Descúbrelo en Uumka')
  const urlFinal = `${url.origin}/lugar/${id}`

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${titulo} — Uumka</title>
<meta property="og:title" content="${titulo} — Uumka" />
<meta property="og:description" content="${descripcion}" />
<meta property="og:image" content="${portada}" />
<meta property="og:url" content="${urlFinal}" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta http-equiv="refresh" content="0; url=${urlFinal}" />
</head>
<body>Redirigiendo a ${titulo}...</body>
</html>`

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}