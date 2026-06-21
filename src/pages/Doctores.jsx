import { useState, useEffect } from 'react'
import { collection, getDocs, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../firebase/config'
import { useNavigate } from 'react-router-dom'

function Doctores() {
  const navigate = useNavigate()
  const [doctores, setDoctores] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', email: '', password: '', especialidad: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const cargarDoctores = async () => {
    const snapshot = await getDocs(collection(db, 'usuarios'))
    const lista = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(u => u.rol === 'doctor')
    setDoctores(lista)
  }

  useEffect(() => { cargarDoctores() }, [])

  const handleGuardar = async () => {
    if (!form.nombre || !form.especialidad) return setError('Nombre y especialidad son obligatorios')

    setCargando(true)
    try {
      if (editando) {
        // Solo actualiza nombre y especialidad
        await updateDoc(doc(db, 'usuarios', editando), {
          nombre: form.nombre,
          especialidad: form.especialidad
        })
      } else {
        if (!form.email || !form.password) return setError('Todos los campos son obligatorios')
        if (form.password.length < 6) return setError('La contraseña debe tener mínimo 6 caracteres')

        const recepcionistaEmail = auth.currentUser.email
        const recepcionistaPassword = prompt('Ingresa tu contraseña de recepcionista para continuar:')

        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password)
        const uid = userCredential.user.uid

        await setDoc(doc(db, 'usuarios', uid), {
          nombre: form.nombre,
          email: form.email,
          especialidad: form.especialidad,
          rol: 'doctor'
        })

        await signInWithEmailAndPassword(auth, recepcionistaEmail, recepcionistaPassword)
      }

      setForm({ nombre: '', email: '', password: '', especialidad: '' })
      setError('')
      setEditando(null)
      setShowModal(false)
      cargarDoctores()
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Este correo ya está registrado')
      else setError('Error: ' + err.message)
    }
    setCargando(false)
  }

  const handleEditar = (doctor) => {
    setForm({ nombre: doctor.nombre, email: doctor.email, password: '', especialidad: doctor.especialidad })
    setEditando(doctor.id)
    setError('')
    setShowModal(true)
  }

  const handleEliminar = async (id) => {
    if (confirm('¿Eliminar este doctor?')) {
      await deleteDoc(doc(db, 'usuarios', id))
      cargarDoctores()
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="bg-white text-blue-700 px-3 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">← Volver</button>
          <h1 className="text-xl font-bold">👨‍⚕️ Doctores</h1>
        </div>
        <button onClick={() => { setShowModal(true); setEditando(null); setError(''); setForm({ nombre: '', email: '', password: '', especialidad: '' }) }}
          className="bg-white text-blue-700 px-4 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">
          + Agregar Doctor
        </button>
      </nav>

      <div className="p-6">
        {doctores.length === 0 && <p className="text-gray-500 text-center mt-8">No hay doctores registrados</p>}
        <div className="grid gap-4 max-w-3xl mx-auto">
          {doctores.map(doctor => (
            <div key={doctor.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-lg text-gray-800">👨‍⚕️ {doctor.nombre}</p>
                <p className="text-gray-500 text-sm">✉️ {doctor.email}</p>
                <p className="text-gray-500 text-sm">🏥 {doctor.especialidad}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleEditar(doctor)}
                  className="bg-yellow-400 text-white px-3 py-1 rounded-lg text-sm hover:bg-yellow-500">Editar</button>
                <button onClick={() => handleEliminar(doctor.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editando ? 'Editar Doctor' : 'Nuevo Doctor'}</h2>
            <div className="space-y-3">
              <input placeholder="Nombre completo *" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              {!editando && (
                <>
                  <input placeholder="Correo electrónico *" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <input placeholder="Contraseña * (mínimo 6 caracteres)" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </>
              )}
              <input placeholder="Especialidad *" value={form.especialidad} onChange={e => setForm({ ...form, especialidad: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            {editando && <p className="text-gray-400 text-xs mt-2">* Solo se puede editar nombre y especialidad</p>}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowModal(false); setEditando(null); setError('') }}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-100">Cancelar</button>
              <button onClick={handleGuardar} disabled={cargando}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {cargando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Doctores