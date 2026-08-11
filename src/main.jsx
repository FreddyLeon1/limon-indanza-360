import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// Registrar Service Worker para modo offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registro) => {
        console.log('✅ Service Worker registrado')

        // Verificar actualizaciones cada vez que se carga la app
        registro.addEventListener('updatefound', () => {
          const nuevoWorker = registro.installing
          nuevoWorker.addEventListener('statechange', () => {
            if (nuevoWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Hay una versión nueva disponible — activarla y recargar
              nuevoWorker.postMessage('SKIP_WAITING')
              window.location.reload()
            }
          })
        })
      })
      .catch(err => console.log('❌ Error SW:', err))

    // Si cambia el controlador (nueva versión activa), recargar una sola vez
    let recargando = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!recargando) {
        recargando = true
        window.location.reload()
      }
    })
  })
}