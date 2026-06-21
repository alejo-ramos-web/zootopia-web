import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useNavigate } from 'react-router-dom'

const CLOUD_NAME = 'ddm8xafbg'
const UPLOAD_PRESET = 'zootopia_preset'

async function subirImagen(archivo) {
  const formData = new FormData()
  formData.append('file', archivo)
  formData.append('upload_preset', UPLOAD_PRESET)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
  })
  const data = await res.json()
  return data.secure_url
}

function Clientes() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', direccion: '', foto: '' })

  const cargarClientes = async () => {
    const snapshot = await getDocs(collection(db, 'clientes'))
    const lista = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    setClientes(lista)
  }

  useEffect(() => { cargarClientes() }, [])

  const handleFoto = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    setSubiendoFoto(true)
    try {
      const url = await subirImagen(archivo)
      setForm({ ...form, foto: url })
    } catch (err) {
      alert('Error al subir la foto')
    }
    setSubiendoFoto(false)
  }

  const handleGuardar = async () => {
    if (!form.nombre || !form.telefono) return alert('Nombre y teléfono son obligatorios')
    if (editando) {
      await updateDoc(doc(db, 'clientes', editando), form)
    } else {
      await addDoc(collection(db, 'clientes'), form)
    }
    setForm({ nombre: '', telefono: '', email: '', direccion: '', foto: '' })
    setEditando(null)
    setShowModal(false)
    cargarClientes()
  }

  const handleEditar = (cliente) => {
    setForm({ nombre: cliente.nombre, telefono: cliente.telefono, email: cliente.email, direccion: cliente.direccion, foto: cliente.foto || '' })
    setEditando(cliente.id)
    setShowModal(true)
  }

  const handleEliminar = async (id) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      await deleteDoc(doc(db, 'clientes', id))
      cargarClientes()
    }
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono?.includes(busqueda)
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="bg-white text-blue-700 px-3 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">← Volver</button>
          <h1 className="text-xl font-bold">👥 Clientes</h1>
        </div>
        <button onClick={() => { setShowModal(true); setEditando(null); setForm({ nombre: '', telefono: '', email: '', direccion: '', foto: '' }) }}
          className="bg-white text-blue-700 px-4 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">
          + Agregar Cliente
        </button>
      </nav>

      <div className="p-6">
        <input type="text" placeholder="🔍 Buscar por nombre o teléfono..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400" />

        <div className="grid gap-4 max-w-4xl mx-auto">
          {clientesFiltrados.length === 0 && <p className="text-gray-500 text-center">No hay clientes registrados</p>}
          {clientesFiltrados.map(cliente => (
            <div key={cliente.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                {cliente.foto ? (
                  <img src={cliente.foto} alt={cliente.nombre} className="w-14 h-14 rounded-full object-cover border-2 border-blue-200" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl">👤</div>
                )}
                <div>
                  <p className="font-bold text-lg text-gray-800">{cliente.nombre}</p>
                  <p className="text-gray-500 text-sm">📞 {cliente.telefono}</p>
                  <p className="text-gray-500 text-sm">✉️ {cliente.email}</p>
                  <p className="text-gray-500 text-sm">📍 {cliente.direccion}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => navigate(`/clientes/${cliente.id}`)}
                  className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600">Ver</button>
                <button onClick={() => handleEditar(cliente)}
                  className="bg-yellow-400 text-white px-3 py-1 rounded-lg text-sm hover:bg-yellow-500">Editar</button>
                <button onClick={() => handleEliminar(cliente.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editando ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <div className="space-y-3">

              {/* Foto perfil */}
              <div className="flex flex-col items-center gap-2">
                {form.foto ? (
                  <img src={form.foto} alt="perfil" className="w-24 h-24 rounded-full object-cover border-2 border-blue-300" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-4xl">👤</div>
                )}
                <label className="cursor-pointer bg-blue-50 border border-blue-300 text-blue-600 px-4 py-1 rounded-lg text-sm hover:bg-blue-100">
                  {subiendoFoto ? 'Subiendo...' : '📷 Subir foto'}
                  <input type="file" accept="image/*" onChange={handleFoto} className="hidden" disabled={subiendoFoto} />
                </label>
              </div>

              <input placeholder="Nombre completo *" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input placeholder="Teléfono *" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input placeholder="Correo electrónico" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input placeholder="Dirección" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowModal(false); setEditando(null) }}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-100">Cancelar</button>
              <button onClick={handleGuardar} disabled={subiendoFoto}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {subiendoFoto ? 'Subiendo foto...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Clientes