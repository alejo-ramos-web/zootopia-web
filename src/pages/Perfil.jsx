import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth, db } from '../firebase/config'

function Perfil() {
  const navigate = useNavigate()
  const [datos, setDatos] = useState({ nombre: '', email: '' })
  const [formNombre, setFormNombre] = useState('')
  const [mensajeNombre, setMensajeNombre] = useState('')
  const [mensajePassword, setMensajePassword] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cargarDatos = async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const snap = await getDoc(doc(db, 'usuarios', uid))
    if (snap.exists()) {
      setDatos(snap.data())
      setFormNombre(snap.data().nombre)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const handleGuardarNombre = async () => {
    if (!formNombre) return
    await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), { nombre: formNombre })
    setMensajeNombre('✅ Nombre actualizado correctamente')
    setTimeout(() => setMensajeNombre(''), 3000)
  }

  const handleEnviarCodigo = async () => {
    setEnviando(true)
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email)
      setMensajePassword(`✅ Se envió un enlace de cambio de contraseña a ${auth.currentUser.email}. Revisa tu correo.`)
    } catch (err) {
      setMensajePassword('❌ Error al enviar el correo. Intenta de nuevo.')
    }
    setEnviando(false)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="bg-white text-blue-700 px-3 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">← Volver</button>
          <h1 className="text-xl font-bold">👤 Mi Perfil</h1>
        </div>
      </nav>

      <div className="p-6 max-w-lg mx-auto space-y-6">

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-700 mb-4">Información Personal</h2>
          <p className="text-gray-500 text-sm mb-4">✉️ {datos.email}</p>
          <div className="space-y-3">
            <input placeholder="Nombre" value={formNombre} onChange={e => setFormNombre(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            {mensajeNombre && <p className="text-green-600 text-sm">{mensajeNombre}</p>}
            <button onClick={handleGuardarNombre}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
              Guardar Nombre
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-700 mb-2">Cambiar Contraseña</h2>
          <p className="text-gray-500 text-sm mb-4">
            Te enviaremos un enlace a <span className="font-medium text-blue-600">{datos.email}</span> para que puedas cambiar tu contraseña de forma segura.
          </p>
          {mensajePassword && (
            <p className={`text-sm mb-4 ${mensajePassword.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>
              {mensajePassword}
            </p>
          )}
          <button onClick={handleEnviarCodigo} disabled={enviando}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {enviando ? 'Enviando...' : '📧 Enviar enlace al correo'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default Perfil