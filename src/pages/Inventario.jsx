import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useNavigate } from 'react-router-dom'

function Inventario() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', categoria: '', categoriaPersonalizada: '', cantidad: '', precio: '', descripcion: '' })

  const cargarItems = async () => {
    const snapshot = await getDocs(collection(db, 'inventario'))
    setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { cargarItems() }, [])

  const handleGuardar = async () => {
    if (!form.nombre || !form.cantidad || !form.precio) return alert('Nombre, cantidad y precio son obligatorios')
    if (form.categoria === 'Otro' && !form.categoriaPersonalizada) return alert('Especifica la categoría')
    const dataGuardar = {
      ...form,
      categoria: form.categoria === 'Otro' ? form.categoriaPersonalizada : form.categoria
    }
    if (editando) {
      await updateDoc(doc(db, 'inventario', editando), dataGuardar)
    } else {
      await addDoc(collection(db, 'inventario'), dataGuardar)
    }
    setForm({ nombre: '', categoria: '', categoriaPersonalizada: '', cantidad: '', precio: '', descripcion: '' })
    setEditando(null)
    setShowModal(false)
    cargarItems()
  }

  const handleEditar = (item) => {
    setForm({ nombre: item.nombre, categoria: item.categoria, categoriaPersonalizada: '', cantidad: item.cantidad, precio: item.precio, descripcion: item.descripcion })
    setEditando(item.id)
    setShowModal(true)
  }

  const handleEliminar = async (id) => {
    if (confirm('¿Eliminar este producto?')) {
      await deleteDoc(doc(db, 'inventario', id))
      cargarItems()
    }
  }

  const itemsFiltrados = items.filter(i =>
    i.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    i.categoria?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const stockBajo = (cantidad) => parseInt(cantidad) <= 5

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="bg-white text-blue-700 px-3 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">← Volver</button>
          <h1 className="text-xl font-bold">📦 Inventario</h1>
        </div>
        <button onClick={() => { setShowModal(true); setEditando(null); setForm({ nombre: '', categoria: '', categoriaPersonalizada: '', cantidad: '', precio: '', descripcion: '' }) }}
          className="bg-white text-blue-700 px-4 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">
          + Agregar Producto
        </button>
      </nav>

      <div className="p-6 max-w-4xl mx-auto">
        <input type="text" placeholder="🔍 Buscar por nombre o categoría..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400" />

        {itemsFiltrados.length === 0 && <p className="text-gray-500 text-center mt-8">No hay productos en inventario</p>}

        <div className="grid gap-4">
          {itemsFiltrados.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg text-gray-800">📦 {item.nombre}</p>
                  {stockBajo(item.cantidad) && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">⚠️ Stock bajo</span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">🏷️ {item.categoria}</p>
                <p className="text-gray-500 text-sm">📊 Cantidad: <span className={`font-medium ${stockBajo(item.cantidad) ? 'text-red-500' : 'text-green-600'}`}>{item.cantidad}</span></p>
                <p className="text-gray-500 text-sm">💰 Precio: <span className="font-medium text-gray-700">Bs. {item.precio}</span></p>
                {item.descripcion && <p className="text-gray-400 text-sm mt-1">{item.descripcion}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleEditar(item)}
                  className="bg-yellow-400 text-white px-3 py-1 rounded-lg text-sm hover:bg-yellow-500">Editar</button>
                <button onClick={() => handleEliminar(item.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editando ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <div className="space-y-3">
              <input placeholder="Nombre del producto *" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value, categoriaPersonalizada: '' })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Categoría</option>
                <option value="Medicamento">Medicamento</option>
                <option value="Vacuna">Vacuna</option>
                <option value="Alimento">Alimento</option>
                <option value="Accesorio">Accesorio</option>
                <option value="Higiene">Higiene</option>
                <option value="Otro">Otro</option>
              </select>
              {form.categoria === 'Otro' && (
                <input placeholder="Especifica la categoría *" value={form.categoriaPersonalizada}
                  onChange={e => setForm({ ...form, categoriaPersonalizada: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              )}
              <input placeholder="Cantidad *" type="number" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input placeholder="Precio (Bs.) *" type="number" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input placeholder="Descripción (opcional)" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowModal(false); setEditando(null) }}
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

export default Inventario