import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useNavigate } from 'react-router-dom'

function Citas() {
  const navigate = useNavigate()
  const [citas, setCitas] = useState([])
  const [doctores, setDoctores] = useState([])
  const [clientes, setClientes] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [filtro, setFiltro] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [fechaFiltro, setFechaFiltro] = useState('')
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [showRechazo, setShowRechazo] = useState(null)
  const [form, setForm] = useState({
    clienteId: '', mascotaId: '', doctorId: '',
    fecha: '', hora: '', motivo: ''
  })

  const cargarDatos = async () => {
    const citasSnap = await getDocs(query(collection(db, 'citas'), orderBy('fecha', 'desc')))
    setCitas(citasSnap.docs.map(d => ({ id: d.id, ...d.data() })))

    const usuariosSnap = await getDocs(collection(db, 'usuarios'))
    const docs = usuariosSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    setDoctores(docs.filter(u => u.rol === 'doctor'))

    const clientesSnap = await getDocs(collection(db, 'clientes'))
    setClientes(clientesSnap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const cargarMascotas = async (clienteId) => {
    if (!clienteId) return setMascotas([])
    const snap = await getDocs(collection(db, 'clientes', clienteId, 'mascotas'))
    setMascotas(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { cargarDatos() }, [])

  const handleGuardar = async () => {
    if (!form.clienteId || !form.mascotaId || !form.doctorId || !form.fecha || !form.hora || !form.motivo)
      return alert('Todos los campos son obligatorios')

    const ahora = new Date()
    const fechaHoraCita = new Date(`${form.fecha}T${form.hora}`)
    const diff = (fechaHoraCita - ahora) / (1000 * 60 * 60)
    if (diff < 2) return alert('La cita debe agendarse con mínimo 2 horas de anticipación')

    const cliente = clientes.find(c => c.id === form.clienteId)
    const mascota = mascotas.find(m => m.id === form.mascotaId)
    const doctor = doctores.find(d => d.id === form.doctorId)

    await addDoc(collection(db, 'citas'), {
      ...form,
      nombreCliente: cliente?.nombre,
      nombreMascota: mascota?.nombre,
      nombreDoctor: doctor?.nombre,
      estado: 'pendiente',
      fechaCreacion: new Date().toISOString()
    })

    setForm({ clienteId: '', mascotaId: '', doctorId: '', fecha: '', hora: '', motivo: '' })
    setShowModal(false)
    cargarDatos()
  }

  const handleConfirmar = async (id) => {
    await updateDoc(doc(db, 'citas', id), { estado: 'confirmada' })
    cargarDatos()
  }

  const handleRechazar = async (id) => {
    if (!motivoRechazo) return alert('Ingresa el motivo de rechazo')
    await updateDoc(doc(db, 'citas', id), { estado: 'rechazada', motivoRechazo })
    setShowRechazo(null)
    setMotivoRechazo('')
    cargarDatos()
  }

  const citasFiltradas = citas.filter(c => {
    const coincideEstado = filtro === 'todas' ? true : c.estado === filtro
    const coincideBusqueda = busqueda === '' ? true :
      c.nombreCliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.nombreMascota?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.nombreDoctor?.toLowerCase().includes(busqueda.toLowerCase())
    const coincideFecha = fechaFiltro === '' ? true : c.fecha === fechaFiltro
    return coincideEstado && coincideBusqueda && coincideFecha
  })

  const estadoColor = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    confirmada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700'
  }

  const estadoIcon = {
    pendiente: '🟡',
    confirmada: '🟢',
    rechazada: '🔴'
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="bg-white text-blue-700 px-3 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">← Volver</button>
          <h1 className="text-xl font-bold">📅 Citas</h1>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-white text-blue-700 px-4 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">
          + Nueva Cita
        </button>
      </nav>

      <div className="p-6 max-w-4xl mx-auto">

        {/* Filtros */}
        <div className="flex gap-3 mb-4 flex-wrap">
          {['todas', 'pendiente', 'confirmada', 'rechazada'].map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-4 py-1 rounded-full capitalize font-medium transition ${filtro === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}>
              {f === 'todas' ? 'Todas' : `${estadoIcon[f]} ${f.charAt(0).toUpperCase() + f.slice(1)}`}
            </button>
          ))}
        </div>

        {/* Búsqueda y fecha */}
        <div className="flex gap-3 mb-6">
          <input placeholder="🔍 Buscar por cliente, mascota o doctor..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <input type="date" value={fechaFiltro} onChange={e => setFechaFiltro(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          {fechaFiltro && (
            <button onClick={() => setFechaFiltro('')}
              className="bg-gray-200 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-300">✕</button>
          )}
        </div>

        {/* Lista */}
        {citasFiltradas.length === 0 && <p className="text-gray-500 text-center mt-8">No hay citas</p>}

        <div className="space-y-4">
          {citasFiltradas.map(cita => (
            <div key={cita.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoColor[cita.estado]}`}>
                      {estadoIcon[cita.estado]} {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                    </span>
                  </div>
                  <p className="font-bold text-lg">🐾 {cita.nombreMascota}</p>
                  <p className="text-gray-500 text-sm">👤 {cita.nombreCliente}</p>
                  <p className="text-gray-500 text-sm">👨‍⚕️ Dr. {cita.nombreDoctor}</p>
                  <p className="text-gray-500 text-sm">📅 {cita.fecha} — {cita.hora}</p>
                  <p className="text-gray-500 text-sm">📋 {cita.motivo}</p>
                  {cita.motivoRechazo && <p className="text-red-500 text-sm mt-1">❌ {cita.motivoRechazo}</p>}
                </div>

                {cita.estado === 'pendiente' && (
                  <div className="flex flex-col gap-2 ml-4">
                    <button onClick={() => handleConfirmar(cita.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600">Confirmar</button>
                    <button onClick={() => setShowRechazo(cita.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600">Rechazar</button>
                  </div>
                )}
              </div>

              {showRechazo === cita.id && (
                <div className="mt-3 flex gap-2">
                  <input placeholder="Motivo de rechazo" value={motivoRechazo}
                    onChange={e => setMotivoRechazo(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                  <button onClick={() => handleRechazar(cita.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600">Enviar</button>
                  <button onClick={() => setShowRechazo(null)}
                    className="border px-3 py-1 rounded-lg text-sm hover:bg-gray-100">Cancelar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nueva Cita */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nueva Cita</h2>
            <div className="space-y-3">
              <select value={form.clienteId} onChange={e => { setForm({ ...form, clienteId: e.target.value, mascotaId: '' }); cargarMascotas(e.target.value) }}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Seleccionar cliente *</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <select value={form.mascotaId} onChange={e => setForm({ ...form, mascotaId: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={!form.clienteId}>
                <option value="">Seleccionar mascota *</option>
                {mascotas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
              <select value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Seleccionar doctor *</option>
                {doctores.map(d => <option key={d.id} value={d.id}>Dr. {d.nombre}</option>)}
              </select>
              <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input placeholder="Motivo *" value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-100">Cancelar</button>
              <button onClick={handleGuardar}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Citas