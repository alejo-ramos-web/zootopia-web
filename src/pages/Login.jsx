import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { useNavigate, useParams } from 'react-router-dom'

function Login() {
  const { rol } = useParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid

      const docRef = doc(db, 'usuarios', uid)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        setError('Usuario no encontrado en el sistema')
        setCargando(false)
        return
      }

      const userData = docSnap.data()

      if (userData.rol !== rol) {
        setError(`Esta cuenta no tiene acceso como ${rol}`)
        setCargando(false)
        return
      }

      if (rol === 'recepcionista') navigate('/dashboard')
      if (rol === 'doctor') navigate('/dashboard-doctor')

    } catch (err) {
      console.error(err)
      setError('Correo o contraseña incorrectos')
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">Zootopia</h1>
          <p className="text-gray-500 mt-1 capitalize">Acceso {rol}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full border border-gray-300 text-gray-500 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            ← Volver
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login