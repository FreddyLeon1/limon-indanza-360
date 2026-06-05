import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a2e1a 0%, #1a472a 50%, #2d6a4f 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      textAlign: 'center',
      padding: '20px',
      fontFamily: "'Segoe UI', sans-serif"
    }}>

      {/* Logo */}
      <div style={{ fontSize: '80px', marginBottom: '10px' }}>🌿</div>

      {/* Título */}
      <h1 style={{
        fontSize: '42px', fontWeight: 'bold',
        marginBottom: '8px', textShadow: '0 2px 10px rgba(0,0,0,0.5)'
      }}>Limón Indanza</h1>

      <h2 style={{ fontSize: '20px', fontWeight: 'normal', opacity: 0.85, marginBottom: '6px' }}>
        Amazonía Ecuatoriana • Morona Santiago
      </h2>

      <p style={{ fontSize: '15px', opacity: 0.7, marginBottom: '40px', maxWidth: '400px', lineHeight: '1.6' }}>
        Descubre los paisajes, cascadas y senderos escondidos de uno de los cantones más hermosos del Ecuador.
      </p>

      {/* Botones */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '50px' }}>
        <button
          onClick={() => navigate('/mapa')}
          style={{
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            color: 'white', border: 'none', borderRadius: '50px',
            padding: '16px 40px', fontSize: '18px', fontWeight: 'bold',
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(22,163,74,0.5)',
            transition: 'transform 0.2s',
          }}
          onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.target.style.transform = 'scale(1)'}
        >
          🗺️ Explorar el Mapa
        </button>

        <button
          onClick={() => navigate('/mapa3d')}
          style={{
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            color: 'white', border: 'none', borderRadius: '50px',
            padding: '16px 40px', fontSize: '18px', fontWeight: 'bold',
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(59,130,246,0.5)',
            transition: 'transform 0.2s',
          }}
          onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.target.style.transform = 'scale(1)'}
        >
          🧭 Navegación 3D
        </button>
      </div>

      {/* Tarjetas */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '700px' }}>
        {[
          { icono: '📸', titulo: 'Fotos 360°', desc: 'Vive los lugares antes de visitarlos' },
          { icono: '🗺️', titulo: 'Rutas Reales', desc: 'Calcula tiempos a pie o en auto' },
          { icono: '🌊', titulo: 'Naturaleza Pura', desc: 'Cascadas, ríos y miradores vírgenes' },
        ].map((item, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px', padding: '20px', width: '180px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icono}</div>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>{item.titulo}</h3>
            <p style={{ fontSize: '12px', opacity: 0.7, lineHeight: '1.4' }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p style={{ marginTop: '40px', fontSize: '12px', opacity: 0.4 }}>
        © 2025 Limón Indanza 360° — Hecho con ❤️ en Ecuador
      </p>

    </div>
  )
}