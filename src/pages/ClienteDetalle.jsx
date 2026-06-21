import { useState, useEffect } from 'react'
import { doc, getDoc, collection, addDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useNavigate, useParams } from 'react-router-dom'

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

function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [mascotas, setMascotas] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [form, setForm] = useState({ nombre: '', especie: '', especiePersonalizada: '', raza: '', edad: '', peso: '', sexo: '', foto: '' })

  const cargarCliente = async () => {
    const docRef = doc(db, 'clientes', id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) setCliente({ id: docSnap.id, ...docSnap.data() })
  }

  const cargarMascotas = async () => {
    const snapshot = await getDocs(collection(db, 'clientes', id, 'mascotas'))
    setMascotas(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => {
    cargarCliente()
    cargarMascotas()
  }, [])

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
    if (!form.nombre || !form.especie) return alert('Nombre y especie son obligatorios')
    if (form.especie === 'Otro' && !form.especiePersonalizada) return alert('Especifica la especie')
    const dataGuardar = {
      ...form,
      especie: form.especie === 'Otro' ? form.especiePersonalizada : form.especie
    }
    if (editando) {
      await updateDoc(doc(db, 'clientes', id, 'mascotas', editando), dataGuardar)
    } else {
      await addDoc(collection(db, 'clientes', id, 'mascotas'), dataGuardar)
    }
    setForm({ nombre: '', especie: '', especiePersonalizada: '', raza: '', edad: '', peso: '', sexo: '', foto: '' })
    setEditando(null)
    setShowModal(false)
    cargarMascotas()
  }

  const handleEditar = (mascota) => {
    setForm({ nombre: mascota.nombre, especie: mascota.especie, especiePersonalizada: '', raza: mascota.raza, edad: mascota.edad, peso: mascota.peso, sexo: mascota.sexo, foto: mascota.foto || '' })
    setEditando(mascota.id)
    setShowModal(true)
  }

  const handleEliminar = async (mascotaId) => {
    if (confirm('¿Eliminar esta mascota?')) {
      await deleteDoc(doc(db, 'clientes', id, 'mascotas', mascotaId))
      cargarMascotas()
    }
  }

  if (!cliente) return <div className="p-8 text-gray-500">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/clientes')} className="bg-white text-blue-700 px-3 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">← Volver</button>
          <h1 className="text-xl font-bold">👤 Detalle del Cliente</h1>
        </div>
      </nav>

      <div className="p-6 max-w-3xl mx-auto space-y-6">

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">👤 {cliente.nombre}</h2>
          <div className="grid grid-cols-2 gap-3 text-gray-700">
            <p>📞 <span className="font-medium">{cliente.telefono}</span></p>
            <p>✉️ <span className="font-medium">{cliente.email}</span></p>
            <p>📍 <span className="font-medium">{cliente.direccion}</span></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-700">🐾 Mascotas</h2>
            <button onClick={() => { setShowModal(true); setEditando(null); setForm({ nombre: '', especie: '', especiePersonalizada: '', raza: '', edad: '', peso: '', sexo: '', foto: '' }) }}
              className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-700 transition">
              + Agregar Mascota
            </button>
          </div>

          {mascotas.length === 0 && <p className="text-gray-400">No hay mascotas registradas</p>}

          <div className="space-y-4">
            {mascotas.map(mascota => (
              <div key={mascota.id} className="border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {mascota.foto ? (
                    <img src={mascota.foto} alt={mascota.nombre} className="w-16 h-16 rounded-full object-cover border-2 border-blue-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl">🐶</div>
                  )}
                  <div>
                    <p className="font-bold text-lg">🐾 {mascota.nombre}</p>
                    <p className="text-gray-500 text-sm">Especie: {mascota.especie} | Raza: {mascota.raza} | Sexo: {mascota.sexo}</p>
                    <p className="text-gray-500 text-sm">Edad: {mascota.edad} años | Peso: {mascota.peso} kg</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => navigate(`/clientes/${id}/mascotas/${mascota.id}`)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600">Historial</button>
                  <button onClick={() => handleEditar(mascota)}
                    className="bg-yellow-400 text-white px-3 py-1 rounded-lg text-sm hover:bg-yellow-500">Editar</button>
                  <button onClick={() => handleEliminar(mascota.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editando ? 'Editar Mascota' : 'Nueva Mascota'}</h2>
            <div className="space-y-3">

              {/* Foto */}
              <div className="flex flex-col items-center gap-2">
                {form.foto ? (
                  <img src={form.foto} alt="mascota" className="w-24 h-24 rounded-full object-cover border-2 border-blue-300" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-4xl">🐶</div>
                )}
                <label className="cursor-pointer bg-blue-50 border border-blue-300 text-blue-600 px-4 py-1 rounded-lg text-sm hover:bg-blue-100">
                  {subiendoFoto ? 'Subiendo...' : '📷 Subir foto'}
                  <input type="file" accept="image/*" onChange={handleFoto} className="hidden" disabled={subiendoFoto} />
                </label>
              </div>

              <input placeholder="Nombre *" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <select value={form.especie} onChange={e => setForm({ ...form, especie: e.target.value, especiePersonalizada: '' })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Especie *</option>
                <option value="Perro">Perro</option>
                <option value="Gato">Gato</option>
                <option value="Ave">Ave</option>
                <option value="Otro">Otro</option>
              </select>
              {form.especie === 'Otro' && (
                <input placeholder="Especifica la especie *" value={form.especiePersonalizada}
                  onChange={e => setForm({ ...form, especiePersonalizada: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              )}
              <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Sexo *</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
              <input placeholder="Raza" value={form.raza} onChange={e => setForm({ ...form, raza: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input placeholder="Edad (años)" type="number" value={form.edad} onChange={e => setForm({ ...form, edad: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input placeholder="Peso (kg)" type="number" value={form.peso} onChange={e => setForm({ ...form, peso: e.target.value })}
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

export default ClienteDetalle