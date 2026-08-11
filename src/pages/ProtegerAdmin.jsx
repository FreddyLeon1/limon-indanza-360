import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function ProtegerAdmin({ children }) {
  const navigate = useNavigate()
  const [verificando, setVerificando] = useState(true)
  const [autorizado, setAutorizado] = useState(false)

  useEffect(() => {
    const verificar = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setAutorizado(false)
        setVerificando(false)
        return
      }

      const { data: adminData, error } = await supabase
        .from('usuarios_admin')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      setAutorizado(!error && !!adminData)
      setVerificando(false)
    }
    verificar()
  }, [])

  if (verificando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280', fontFamily: "'Segoe UI', sans-serif" }}>Verificando acceso...</p>
      </div>
    )
  }

  if (!autorizado) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a472a, #2d6a4f)',
        fontFamily: "'Segoe UI', sans-serif", color: 'white', textAlign: 'center', padding: '20px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Acceso restringido</h2>
        <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '20px' }}>
          Necesitas iniciar sesión como administrador para ver esta página.
        </p>
        <button onClick={() => navigate('/admin')} style={{
          background: 'white', color: '#1a472a', border: 'none',
          borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'
        }}>Ir a iniciar sesión</button>
      </div>
    )
  }

  return children
}