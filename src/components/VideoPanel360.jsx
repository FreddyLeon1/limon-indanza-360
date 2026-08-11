import { useEffect, useRef } from 'react'
import { Viewer } from '@photo-sphere-viewer/core'
import { VideoPlugin } from '@photo-sphere-viewer/video-plugin'
import { EquirectangularVideoAdapter } from '@photo-sphere-viewer/equirectangular-video-adapter'
import { Video } from 'lucide-react'

import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/video-plugin/index.css'

export default function VideoPanel360({ videos360, fullScreen = false }) {
  const contenedorRef = useRef(null)
  const viewerRef = useRef(null)

  const video = videos360?.[0]

  useEffect(() => {
    if (!contenedorRef.current || !video?.url) return

    const viewer = new Viewer({
        container: contenedorRef.current,
        adapter: EquirectangularVideoAdapter,
        panorama: {
            source: video.url,
        },
        navbar: ['video', 'zoom', 'fullscreen'],
        plugins: [VideoPlugin],
    })

    viewerRef.current = viewer

    return () => {
      viewer.destroy()
      viewerRef.current = null
    }
  }, [video?.url])

  if (!video) {
    return (
      <div style={{
        height: fullScreen ? '100%' : '60vh', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', background: '#121D24', textAlign: 'center', padding: '0 20px'
      }}>
        <Video size={36} strokeWidth={1.5} color="#D89D34" style={{ marginBottom: '12px', opacity: 0.7 }} />
        <p style={{ fontSize: '14px', fontFamily: "'Inter', sans-serif", fontWeight: 500, color: '#F4F1E8', opacity: 0.7, margin: 0, maxWidth: '260px' }}>
          Este rincón todavía guarda su video 360° en secreto.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={contenedorRef}
      style={{ position: 'relative', width: '100%', height: fullScreen ? '100%' : '60vh', background: '#121D24' }}
    />
  )
}