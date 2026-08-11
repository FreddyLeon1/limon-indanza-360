import { useState } from 'react'
import { registrarEvento } from '../supabase'
import { MessageCircle } from 'lucide-react'
import './BotonContacto.css'

export default function BotonContacto({ contexto = '', lugarId = null }) {
  const [hover, setHover] = useState(false)

  const mensaje = contexto
    ? `Hola! Tengo una pregunta sobre ${contexto} en Uumka.`
    : 'Hola! Tengo una pregunta sobre Uumka.'

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 999, display: 'flex', alignItems: 'center', gap: '10px' }}>

      {/* Tooltip */}
      <span style={{
        background: '#121D24',
        color: '#F4F1E8',
        fontFamily: "'Inter', sans-serif",
        fontSize: '13px',
        fontWeight: 500,
        padding: '8px 14px',
        borderRadius: '8px',
        whiteSpace: 'nowrap',
        opacity: hover ? 1 : 0,
        transform: hover ? 'translateX(0)' : 'translateX(10px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        pointerEvents: 'none',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        ¿Tienes preguntas? Escríbenos
      </span>
     
        <a href={`https://wa.me/593989260119?text=${encodeURIComponent(mensaje)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => registrarEvento('clic_contacto', lugarId)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="uumka-whatsapp-btn"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '56px', height: '56px',
          background: '#25d366',
          borderRadius: '50%',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
          textDecoration: 'none',
          flexShrink: 0
        }}
        aria-label="Escríbenos por WhatsApp"
      >
        <MessageCircle size={26} color="white" strokeWidth={2} />
      </a>
    </div>
  )
}