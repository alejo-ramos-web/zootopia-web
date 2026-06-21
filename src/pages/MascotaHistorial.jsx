import { useState, useEffect } from 'react'
import { doc, getDoc, collection, addDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import { useNavigate, useParams, useLocation } from 'react-router-dom'

function MascotaHistorial() {
  const { clienteId, mascotaId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const esDoctor = location.pathname.startsWith('/doctor')
  const [mascota, setMascota] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [historial, setHistorial] = useState([])
  const [rolUsuario, setRolUsuario] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    fecha: '', motivo: '', peso: '', diagnostico: '', tratamiento: '', doctor: '', proximaCita: ''
  })

  const cargarDatos = async () => {
    const uid = auth.currentUser?.uid
    if (uid) {
      const userSnap = await getDoc(doc(db, 'usuarios', uid))
      if (userSnap.exists()) setRolUsuario(userSnap.data().rol)
    }

    const clienteSnap = await getDoc(doc(db, 'clientes', clienteId))
    if (clienteSnap.exists()) setCliente(clienteSnap.data())

    const mascotaSnap = await getDoc(doc(db, 'clientes', clienteId, 'mascotas', mascotaId))
    if (mascotaSnap.exists()) setMascota(mascotaSnap.data())

    const historialSnap = await getDocs(collection(db, 'clientes', clienteId, 'mascotas', mascotaId, 'historial'))
    const lista = historialSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    setHistorial(lista)
  }

  useEffect(() => { cargarDatos() }, [])

  const handleVolver = () => {
    if (esDoctor) {
      navigate('/dashboard-doctor')
    } else {
      navigate(`/clientes/${clienteId}`)
    }
  }

  const handleGuardar = async () => {
    if (!form.fecha || !form.motivo) return alert('Fecha y motivo son obligatorios')
    if (editando) {
      await updateDoc(doc(db, 'clientes', clienteId, 'mascotas', mascotaId, 'historial', editando), form)
    } else {
      await addDoc(collection(db, 'clientes', clienteId, 'mascotas', mascotaId, 'historial'), form)
    }
    setForm({ fecha: '', motivo: '', peso: '', diagnostico: '', tratamiento: '', doctor: '', proximaCita: '' })
    setEditando(null)
    setShowModal(false)
    cargarDatos()
  }

  const handleEditar = (consulta) => {
    setForm({
      fecha: consulta.fecha, motivo: consulta.motivo, peso: consulta.peso,
      diagnostico: consulta.diagnostico, tratamiento: consulta.tratamiento,
      doctor: consulta.doctor, proximaCita: consulta.proximaCita
    })
    setEditando(consulta.id)
    setShowModal(true)
  }

  const handleEliminar = async (consultaId) => {
    if (confirm('¿Eliminar esta consulta?')) {
      await deleteDoc(doc(db, 'clientes', clienteId, 'mascotas', mascotaId, 'historial', consultaId))
      cargarDatos()
    }
  }

  if (!mascota) return <div className="p-8 text-gray-500">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className={`${esDoctor ? 'bg-teal-700' : 'bg-blue-700'} text-white px-6 py-4 flex justify-between items-center shadow`}>
        <div className="flex items-center gap-3">
          <button onClick={handleVolver}
            className={`bg-white ${esDoctor ? 'text-teal-700' : 'text-blue-700'} px-3 py-1 rounded-lg font-semibold hover:opacity-80 transition`}>← Volver</button>
          <h1 className="text-xl font-bold">🐾 Historial de {mascota.nombre}</h1>
        </div>
      </nav>

      <div className="p-6 max-w-3xl mx-auto space-y-6">

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-blue-700 mb-3">🐶 {mascota.nombre}</h2>
          <div className="grid grid-cols-2 gap-2 text-gray-600 text-sm">
            <p>Especie: <span className="font-medium">{mascota.especie}</span></p>
            <p>Raza: <span className="font-medium">{mascota.raza}</span></p>
            <p>Sexo: <span className="font-medium">{mascota.sexo}</span></p>
            <p>Edad: <span className="font-medium">{mascota.edad} años</span></p>
            <p>Peso actual: <span className="font-medium">{mascota.peso} kg</span></p>
            <p>Dueño: <span className="font-medium">{cliente?.nombre}</span></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-700">📋 Historial de Consultas</h2>
            {rolUsuario === 'doctor' && (
              <button onClick={() => { setShowModal(true); setEditando(null); setForm({ fecha: '', motivo: '', peso: '', diagnostico: '', tratamiento: '', doctor: '', proximaCita: '' }) }}
                className="bg-teal-600 text-white px-4 py-1 rounded-lg hover:bg-teal-700 transition">
                + Nueva Consulta
              </button>
            )}
          </div>

          {historial.length === 0 && <p className="text-gray-400">No hay consultas registradas</p>}

          <div className="space-y-4">
            {historial.map(consulta => (
              <div key={consulta.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex gap-3 items-center mb-2">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">📅 {consulta.fecha}</span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">⚖️ {consulta.peso} kg</span>
                    </div>
                    <p className="text-gray-700"><span className="font-semibold">Motivo:</span> {consulta.motivo}</p>
                    <p className="text-gray-700"><span className="font-semibold">Diagnóstico:</span> {consulta.diagnostico}</p>
                    <p className="text-gray-700"><span className="font-semibold">Tratamiento:</span> {consulta.tratamiento}</p>
                    <p className="text-gray-500 text-sm mt-1">👨‍⚕️ Dr. {consulta.doctor} | Próxima cita: {consulta.proximaCita || 'No indicada'}</p>
                  </div>
                  {rolUsuario === 'doctor' && (
                    <div className="flex flex-col gap-2 ml-4">
                      <button onClick={() => handleEditar(consulta)}
                        className="bg-yellow-400 text-white px-3 py-1 rounded-lg text-sm hover:bg-yellow-500">Editar</button>
                      <button onClick={() => handleEliminar(consulta.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600">Eliminar</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && rolUsuario === 'doctor' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editando ? 'Editar Consulta' : 'Nueva Consulta'}</h2>
            <div className="space-y-3">
              <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <input placeholder="Motivo de consulta *" value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <input placeholder="Peso (kg)" type="number" value={form.peso} onChange={e => setForm({ ...form, peso: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <textarea placeholder="Diagnóstico" value={form.diagnostico} onChange={e => setForm({ ...form, diagnostico: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400" rows={3} />
              <textarea placeholder="Tratamiento" value={form.tratamiento} onChange={e => setForm({ ...form, tratamiento: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400" rows={3} />
              <input placeholder="Doctor" value={form.doctor} onChange={e => setForm({ ...form, doctor: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <input type="date" value={form.proximaCita} onChange={e => setForm({ ...form, proximaCita: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowModal(false); setEditando(null) }}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-100">Cancelar</button>
              <button onClick={handleGuardar}
                className="flex-1 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MascotaHistorial