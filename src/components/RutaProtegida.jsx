import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { useNavigate } from 'react-router-dom'

function RutaProtegida({ children, rolRequerido }) {
  const [estado, setEstado] = useState('verificando') // verificando, autorizado, denegado
  const navigate = useNavigate()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setEstado('denegado')
        navigate('/')
        return
      }

      try {
        const snap = await getDoc(doc(db, 'usuarios', user.uid))
        if (!snap.exists()) {
          setEstado('denegado')
          navigate('/')
          return
        }

        const rol = snap.data().rol

        if (rol !== rolRequerido) {
          setEstado('denegado')
          // Redirige según su rol real
          if (rol === 'doctor') navigate('/dashboard-doctor')
          else if (rol === 'recepcionista') navigate('/dashboard')
          else navigate('/')
          return
        }

        setEstado('autorizado')
      } catch (err) {
        setEstado('denegado')
        navigate('/')
      }
    })
    return () => unsub()
  }, [])

  if (estado === 'verificando') return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      <p>Verificando acceso...</p>
    </div>
  )

  if (estado === 'denegado') return null

  return children
}

export default RutaProtegida