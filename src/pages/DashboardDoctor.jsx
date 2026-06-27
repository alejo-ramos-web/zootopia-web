import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collection, getDocs, query, where, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

function DashboardDoctor() {
  const navigate = useNavigate()
  const [citasPendientes, setCitasPendientes] = useState([])
  const [citasAtendidas, setCitasAtendidas] = useState([])
  const [citasProximas, setCitasProximas] = useState([])
  const [nombreDoctor, setNombreDoctor] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [citaSeleccionada, setCitaSeleccionada] = useState(null)
  const [form, setForm] = useState({ peso: '', diagnostico: '', tratamiento: '', proximaCita: '' })
  const [guardando, setGuardando] = useState(false)
  const [seccion, setSeccion] = useState('pendientes')
  const [cargando, setCargando] = useState(true)

  const cargarDatos = async () => {
    setCargando(true)
    const uid = auth.currentUser?.uid
    if (!uid) return

    const userSnap = await getDoc(doc(db, 'usuarios', uid))
    if (userSnap.exists()) setNombreDoctor(userSnap.data().nombre)

    const hoy = new Date().toISOString().split('T')[0]

    const citasSnap = await getDocs(query(
      collection(db, 'citas'),
      where('doctorId', '==', uid),
      where('estado', '==', 'confirmada')
    ))

    const todas = citasSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Verificar que el cliente aún existe
    const citasValidas = []
    for (const cita of todas) {
      const clienteSnap = await getDoc(doc(db, 'clientes', cita.clienteId))
      if (clienteSnap.exists()) {
        citasValidas.push(cita)
      }
    }

    setCitasPendientes(citasValidas.filter(c => !c.consultaRegistrada && c.fecha <= hoy))
    setCitasAtendidas(citasValidas.filter(c => c.consultaRegistrada))
    setCitasProximas(citasValidas.filter(c => !c.consultaRegistrada && c.fecha > hoy))
    setCargando(false)
  }

  useEffect(() => { cargarDatos() }, [])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  const abrirConsulta = (cita) => {
    setCitaSeleccionada(cita)
    setForm({ peso: '', diagnostico: '', tratamiento: '', proximaCita: '' })
    setShowModal(true)
  }

  const handleGuardarConsulta = async () => {
    if (!form.diagnostico || !form.tratamiento) return alert('Diagnóstico y tratamiento son obligatorios')
    setGuardando(true)
    try {
      await addDoc(
        collection(db, 'clientes', citaSeleccionada.clienteId, 'mascotas', citaSeleccionada.mascotaId, 'historial'),
        {
          fecha: new Date().toISOString().split('T')[0],
          motivo: citaSeleccionada.motivo,
          peso: form.peso,
          diagnostico: form.diagnostico,
          tratamiento: form.tratamiento,
          doctor: nombreDoctor,
          proximaCita: form.proximaCita
        }
      )

      await updateDoc(doc(db, 'citas', citaSeleccionada.id), {
        consultaRegistrada: true
      })

      setShowModal(false)
      setCitaSeleccionada(null)
      setSeccion('atendidas')
      cargarDatos()
    } catch (err) {
      alert('Error al guardar la consulta')
    }
    setGuardando(false)
  }

  const TabButton = ({ id, label, cantidad }) => (
    <button onClick={() => setSeccion(id)}
      className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${seccion === id ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border'}`}>
      {label}
      {cantidad > 0 && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${seccion === id ? 'bg-white text-teal-600' : 'bg-teal-100 text-teal-600'}`}>
          {cantidad}
        </span>
      )}
    </button>
  )

  const citasActuales = seccion === 'pendientes' ? citasPendientes : seccion === 'atendidas' ? citasAtendidas : citasProximas

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-teal-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">Zootopia — Dr. {nombreDoctor}</h1>
        <button onClick={handleLogout}
          className="bg-white text-teal-700 px-4 py-1 rounded-lg font-semibold hover:bg-teal-100 transition">
          Cerrar sesión
        </button>
      </nav>

      <div className="p-6 max-w-3xl mx-auto">

        <div className="flex gap-3 mb-6">
          <TabButton id="pendientes" label="📋 Pendientes" cantidad={citasPendientes.length} />
          <TabButton id="proximas" label="📅 Próximas" cantidad={citasProximas.length} />
          <TabButton id="atendidas" label="✅ Atendidas" cantidad={citasAtendidas.length} />
        </div>

        {cargando && <p className="text-gray-500 text-center mt-8">Cargando citas...</p>}

        {!cargando && citasActuales.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400">
            {seccion === 'pendientes' && 'No tienes citas pendientes de atender'}
            {seccion === 'proximas' && 'No tienes citas próximas'}
            {seccion === 'atendidas' && 'No tienes consultas atendidas aún'}
          </div>
        )}

        <div className="space-y-4">
          {citasActuales.map(cita => (
            <div key={cita.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">🐾 {cita.nombreMascota}</p>
                  <p className="text-gray-500 text-sm">👤 {cita.nombreCliente}</p>
                  <p className="text-gray-500 text-sm">📅 {cita.fecha} — {cita.hora}</p>
                  <p className="text-gray-500 text-sm">📋 {cita.motivo}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {seccion === 'pendientes' && (
                    <button onClick={() => abrirConsulta(cita)}
                      className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition text-sm">
                      Registrar Consulta
                    </button>
                  )}
                  <button onClick={() => navigate(`/doctor/clientes/${cita.clienteId}/mascotas/${cita.mascotaId}`)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm">
                    Ver Historial
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-1">Registrar Consulta</h2>
            <p className="text-gray-500 text-sm mb-4">🐾 {citaSeleccionada?.nombreMascota} — {citaSeleccionada?.nombreCliente}</p>
            <div className="space-y-3">
              <input placeholder="Peso actual (kg)" type="number" value={form.peso}
                onChange={e => setForm({ ...form, peso: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <textarea placeholder="Diagnóstico *" value={form.diagnostico}
                onChange={e => setForm({ ...form, diagnostico: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400" rows={3} />
              <textarea placeholder="Tratamiento *" value={form.tratamiento}
                onChange={e => setForm({ ...form, tratamiento: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400" rows={3} />
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Próxima cita sugerida</label>
                <input type="date" value={form.proximaCita}
                  onChange={e => setForm({ ...form, proximaCita: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-100">Cancelar</button>
              <button onClick={handleGuardarConsulta} disabled={guardando}
                className="flex-1 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Guardar Consulta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardDoctor