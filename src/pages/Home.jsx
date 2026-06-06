import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Home() {
  const navigate = useNavigate()
  const [idioma, setIdioma] = useState('es')

  const textos = {
    es: {
      titulo: 'Limón Indanza',
      subtitulo: 'Amazonía Ecuatoriana • Morona Santiago',
      descripcion: 'Descubre los paisajes, cascadas y senderos escondidos de uno de los cantones más hermosos del Ecuador.',
      ciudad: 'Explorar la Ciudad',
      ciudadDesc: 'Restaurantes, hoteles, bares y más',
      naturaleza: 'Rutas Naturales',
      naturalezaDesc: 'Cascadas, miradores y senderos',
      recorridos: 'Recorridos 360°',
      recorridosDesc: 'Vive los lugares antes de visitarlos',
      emergencia: '🆘 Emergencias: 911',
      footer: 'Hecho con ❤️ en Ecuador'
    },
    en: {
      titulo: 'Limón Indanza',
      subtitulo: 'Ecuadorian Amazon • Morona Santiago',
      descripcion: 'Discover the landscapes, waterfalls and hidden trails of one of Ecuador\'s most beautiful cantons.',
      ciudad: 'Explore the City',
      ciudadDesc: 'Restaurants, hotels, bars and more',
      naturaleza: 'Nature Routes',
      naturalezaDesc: 'Waterfalls, viewpoints and trails',
      recorridos: '360° Tours',
      recorridosDesc: 'Experience places before you visit',
      emergencia: '🆘 Emergency: 911',
      footer: 'Made with ❤️ in Ecuador'
    }
  }

  const t = textos[idioma]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a2e1a 0%, #1a472a 50%, #2d6a4f 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: 'white', textAlign: 'center',
      padding: '20px', fontFamily: "'Segoe UI', sans-serif"
    }}>

      {/* Selector de idioma */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
        <button onClick={() => setIdioma('es')} style={{
          background: idioma === 'es' ? 'white' : 'rgba(255,255,255,0.2)',
          color: idioma === 'es' ? '#1a472a' : 'white',
          border: 'none', borderRadius: '50px',
          padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
        }}>🇪🇨 ES</button>
        <button onClick={() => setIdioma('en')} style={{
          background: idioma === 'en' ? 'white' : 'rgba(255,255,255,0.2)',
          color: idioma === 'en' ? '#1a472a' : 'white',
          border: 'none', borderRadius: '50px',
          padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
        }}>🇺🇸 EN</button>
      </div>

      {/* Emergencias */}
      <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
        <button style={{
          background: '#dc2626', color: 'white', border: 'none',
          borderRadius: '50px', padding: '6px 14px',
          cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
          boxShadow: '0 2px 8px rgba(220,38,38,0.5)'
        }}>{t.emergencia}</button>
      </div>

      {/* Logo y título */}
      <div style={{ fontSize: '80px', marginBottom: '10px' }}>🌿</div>
      <h1 style={{ fontSize: '42px', fontWeight: 'bold', marginBottom: '8px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
        {t.titulo}
      </h1>
      <h2 style={{ fontSize: '18px', fontWeight: 'normal', opacity: 0.85, marginBottom: '6px' }}>
        {t.subtitulo}
      </h2>
      <p style={{ fontSize: '15px', opacity: 0.7, marginBottom: '40px', maxWidth: '400px', lineHeight: '1.6' }}>
        {t.descripcion}
      </p>

      {/* 3 opciones principales */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '40px' }}>

        {/* Ciudad */}
        <div onClick={() => navigate('/mapa')} style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '20px', padding: '24px 20px',
          width: '180px', cursor: 'pointer',
          transition: 'transform 0.2s, background 0.2s'
        }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏙️</div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' }}>{t.ciudad}</h3>
          <p style={{ fontSize: '12px', opacity: 0.7, lineHeight: '1.4' }}>{t.ciudadDesc}</p>
        </div>

        {/* Naturaleza */}
        <div onClick={() => navigate('/mapa3d')} style={{
          background: 'rgba(22,163,74,0.3)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(22,163,74,0.6)',
          borderRadius: '20px', padding: '24px 20px',
          width: '180px', cursor: 'pointer',
          transition: 'transform 0.2s, background 0.2s'
        }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(22,163,74,0.5)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(22,163,74,0.3)'}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧭</div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' }}>{t.naturaleza}</h3>
          <p style={{ fontSize: '12px', opacity: 0.7, lineHeight: '1.4' }}>{t.naturalezaDesc}</p>
        </div>

        {/* 360° */}
        <div onClick={() => navigate('/recorridos')} style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '20px', padding: '24px 20px',
          width: '180px', cursor: 'pointer',
          transition: 'transform 0.2s, background 0.2s'
        }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📸</div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' }}>{t.recorridos}</h3>
          <p style={{ fontSize: '12px', opacity: 0.7, lineHeight: '1.4' }}>{t.recorridosDesc}</p>
        </div>

      </div>

      {/* Footer */}
      <p style={{ fontSize: '12px', opacity: 0.4 }}>© 2025 Limón Indanza 360° — {t.footer}</p>

    </div>
  )
}