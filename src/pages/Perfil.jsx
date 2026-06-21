import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { auth, db } from '../firebase/config'

function Perfil() {
  const navigate = useNavigate()
  const [datos, setDatos] = useState({ nombre: '', email: '' })
  const [formNombre, setFormNombre] = useState('')
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirmar, setPasswordConfirmar] = useState('')
  const [mensajeNombre, setMensajeNombre] = useState('')
  const [mensajePassword, setMensajePassword] = useState('')
  const [errorPassword, setErrorPassword] = useState('')

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

  const handleCambiarPassword = async () => {
    setErrorPassword('')
    setMensajePassword('')
    if (!passwordActual || !passwordNueva || !passwordConfirmar) return setErrorPassword('Completa todos los campos')
    if (passwordNueva.length < 6) return setErrorPassword('La nueva contraseña debe tener mínimo 6 caracteres')
    if (passwordNueva !== passwordConfirmar) return setErrorPassword('Las contraseñas no coinciden')
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, passwordActual)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, passwordNueva)
      setPasswordActual('')
      setPasswordNueva('')
      setPasswordConfirmar('')
      setMensajePassword('✅ Contraseña actualizada correctamente')
      setTimeout(() => setMensajePassword(''), 3000)
    } catch (err) {
      if (err.code === 'auth/wrong-password') setErrorPassword('Contraseña actual incorrecta')
      else setErrorPassword('Error al cambiar la contraseña')
    }
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

        {/* Info */}
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

        {/* Cambiar contraseña */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-700 mb-4">Cambiar Contraseña</h2>
          <div className="space-y-3">
            <input type="password" placeholder="Contraseña actual" value={passwordActual}
              onChange={e => setPasswordActual(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <input type="password" placeholder="Nueva contraseña" value={passwordNueva}
              onChange={e => setPasswordNueva(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <input type="password" placeholder="Confirmar nueva contraseña" value={passwordConfirmar}
              onChange={e => setPasswordConfirmar(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            {errorPassword && <p className="text-red-500 text-sm">{errorPassword}</p>}
            {mensajePassword && <p className="text-green-600 text-sm">{mensajePassword}</p>}
            <button onClick={handleCambiarPassword}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
              Cambiar Contraseña
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Perfil