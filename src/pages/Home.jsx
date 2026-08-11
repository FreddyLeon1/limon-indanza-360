import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { registrarEvento } from '../supabase'
import BotonContacto from '../components/BotonContacto'
import logoUumka from '../assets/uumka-logo-vertical-negativo.png'
import fondoHero from '../assets/fondo-hero.png'
import { Compass, Camera, PhoneCall } from 'lucide-react'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const [idioma, setIdioma] = useState('es')

  const textos = {
    es: {
      titulo: 'SENDEROS OCULTOS',
      descripcion: 'Descubre senderos ocultos, cascadas y paisajes escondidos del Ecuador.',
      mapa: 'Rutas Maps',
      mapaDesc: 'Ciudad, naturaleza, rutas y GPS',
      galeria: 'Portal 360°',
      galeriaDesc: 'Fotos, videos y recorridos virtuales',
      emergencia: 'Emergencias: 911',
      footer: 'Ecuador'
    },
    en: {
      titulo: 'Hidden Paths',
      descripcion: 'Discover hidden trails, waterfalls and secret landscapes across Ecuador.',
      mapa: 'Rutas Maps',
      mapaDesc: 'City, nature, routes and GPS',
      galeria: 'Portal 360°',
      galeriaDesc: 'Photos, videos and virtual tours',
      emergencia: 'Emergency: 911',
      footer: 'Ecuador'
    }
  }

  const t = textos[idioma]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#121D24',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: 'white', textAlign: 'center',
      padding: '20px', fontFamily: "'Inter', sans-serif"
    }}>
      {/* Fondo Ken Burns */}
      <img
        src={fondoHero}
        alt=""
        className="uumka-hero-bg"
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 0
        }}
      />

      {/* Overlay oscuro para legibilidad del contenido */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        background: 'linear-gradient(180deg, rgba(18,29,36,0.6) 0%, rgba(18,29,36,0.92) 100%)',
        zIndex: 1
      }} />

      {/* Todo el contenido real va sobre las dos capas de arriba */}
      {/* Selector de idioma */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 2 }}>
        <button onClick={() => setIdioma('es')} style={{
          background: idioma === 'es' ? '#D89D34' : 'rgba(244,241,232,0.2)',
          color: idioma === 'es' ? '#121D24' : '#F4F1E8',
          border: 'none', borderRadius: '50px',
          padding: '6px 14px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '13px'
        }}>ES</button>
        <button onClick={() => setIdioma('en')} style={{
          background: idioma === 'en' ? '#D89D34' : 'rgba(244,241,232,0.2)',
          color: idioma === 'en' ? '#121D24' : '#F4F1E8',
          border: 'none', borderRadius: '50px',
          padding: '6px 14px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '13px'
        }}>EN</button>
      </div>

      {/* Emergencias */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 2 }}>
        <button style={{
          background: '#C85A32', color: '#FFFFFF', border: 'none',
          borderRadius: '50px', padding: '6px 14px',
          cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '13px',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <PhoneCall size={14} strokeWidth={2.5} />
          {t.emergencia}
        </button>
      </div>

      {/* Todo el contenido real va sobre las dos capas de fondo */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', width: '100%'
      }}>

        {/* Logo oficial Uumka */}
        <img
          src={logoUumka}
          alt="Uumka — Senderos Ocultos"
          style={{ width: '200px', marginBottom: '20px' }}
        />
        <h1 style={{ fontSize: '15px', fontWeight: 400, opacity: 0.7, marginBottom: '40px', maxWidth: '400px', lineHeight: '1.6' }}>
          {t.descripcion}
        </h1>

        {/* 2 botones principales */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '40px' }}>

          {/* Galería */}
            <div className="uumka-card-portal" onClick={() => { registrarEvento('clic_ir_galeria', null); navigate('/portal360') }} style={{
            background: 'rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(74,107,130,0.5)',
            borderRadius: '20px', padding: '32px 28px',
            width: '200px', cursor: 'pointer',
            transition: 'transform 0.2s, background 0.2s'
          }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(8, 30, 44, 0.45)'
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(3, 3, 3, 0.25)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <span className="uumka-ring-360" style={{ marginBottom: '14px' }}>
              <Camera size={48} strokeWidth={2} color="#4A6B82" />
            </span>
            <h3 style={{ fontSize: '17px', fontFamily: "'Inter', sans-serif", fontWeight: 600, marginBottom: '8px' }}>{t.galeria}</h3>
            <p style={{ fontSize: '12px', opacity: 0.7, lineHeight: '1.5' }}>{t.galeriaDesc}</p>
          </div>

          {/* Mapa */}
            <div className="uumka-card-rutas" onClick={() => { registrarEvento('clic_ir_mapa', null); navigate('/rutasmaps') }} style={{
            background: 'rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(200,90,50,0.4)',
            borderRadius: '20px', padding: '32px 28px',
            width: '200px', cursor: 'pointer',
            transition: 'transform 0.2s, background 0.2s'
          }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(48, 25, 10, 0.2)'
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <Compass className="uumka-icon-compass" size={48} strokeWidth={2} color="#C85A32" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '17px', fontFamily: "'Inter', sans-serif", fontWeight: 600, marginBottom: '8px' }}>{t.mapa}</h3>
            <p style={{ fontSize: '12px', opacity: 0.7, lineHeight: '1.5' }}>{t.mapaDesc}</p>
          </div>

        </div>

        <BotonContacto />

        {/* Footer */}
        <p style={{ fontSize: '12px', opacity: 0.4 }}>© 2026 - Uumka - {t.footer}</p>

      </div>
    </div>
  )
}