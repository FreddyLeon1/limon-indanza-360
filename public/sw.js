const CACHE_NAME = 'limon-indanza-v1'

const ARCHIVOS_ESTATICOS = [
  '/',
  '/mapa',
  '/recorridos',
  '/index.html',
]

// Al instalar — guardar archivos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ARCHIVOS_ESTATICOS)
    })
  )
  // Activa inmediatamente la nueva versión sin esperar
  self.skipWaiting()
})

// Al activar — limpiar caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// Al hacer fetch — primero caché, luego red
self.addEventListener('fetch', (event) => {
  // No interceptar peticiones a Supabase ni a APIs externas
  if (
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('openrouteservice') ||
    event.request.url.includes('cartocdn')
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // Guardar en caché para uso futuro
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone)
        })
        return response
      }).catch(() => {
        // Sin internet y sin caché
        return caches.match('/')
      })
    })
  )
})
// Escuchar mensaje para forzar activación inmediata
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})