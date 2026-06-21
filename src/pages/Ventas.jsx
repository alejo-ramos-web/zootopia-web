import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useNavigate } from 'react-router-dom'

function Ventas() {
  const navigate = useNavigate()
  const [ventas, setVentas] = useState([])
  const [inventario, setInventario] = useState([])
  const [clientes, setClientes] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [itemsSeleccionados, setItemsSeleccionados] = useState([])
  const [clienteTipo, setClienteTipo] = useState('registrado')
  const [clienteId, setClienteId] = useState('')
  const [clienteOcasional, setClienteOcasional] = useState('')
  const [busquedaProducto, setBusquedaProducto] = useState('')

  const cargarDatos = async () => {
    const ventasSnap = await getDocs(query(collection(db, 'ventas'), orderBy('fecha', 'desc')))
    setVentas(ventasSnap.docs.map(d => ({ id: d.id, ...d.data() })))

    const inventarioSnap = await getDocs(collection(db, 'inventario'))
    setInventario(inventarioSnap.docs.map(d => ({ id: d.id, ...d.data() })))

    const clientesSnap = await getDocs(collection(db, 'clientes'))
    setClientes(clientesSnap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { cargarDatos() }, [])

  const agregarItem = (item) => {
    if (parseInt(item.cantidad) <= 0) return alert('Producto sin stock')
    const existe = itemsSeleccionados.find(i => i.id === item.id)
    if (existe) {
      if (existe.cantidadVenta >= parseInt(item.cantidad)) return alert('No hay suficiente stock')
      setItemsSeleccionados(itemsSeleccionados.map(i =>
        i.id === item.id ? { ...i, cantidadVenta: i.cantidadVenta + 1 } : i
      ))
    } else {
      setItemsSeleccionados([...itemsSeleccionados, { ...item, cantidadVenta: 1 }])
    }
  }

  const cambiarCantidad = (id, valor) => {
    const item = inventario.find(i => i.id === id)
    const cantidad = parseInt(valor)
    if (cantidad < 1) return
    if (cantidad > parseInt(item.cantidad)) return alert('No hay suficiente stock')
    setItemsSeleccionados(itemsSeleccionados.map(i =>
      i.id === id ? { ...i, cantidadVenta: cantidad } : i
    ))
  }

  const quitarItem = (id) => {
    setItemsSeleccionados(itemsSeleccionados.filter(i => i.id !== id))
  }

  const total = itemsSeleccionados.reduce((acc, i) => acc + (parseFloat(i.precio) * i.cantidadVenta), 0)

  const handleGuardar = async () => {
    if (itemsSeleccionados.length === 0) return alert('Agrega al menos un producto')
    if (clienteTipo === 'registrado' && !clienteId) return alert('Selecciona un cliente')
    if (clienteTipo === 'ocasional' && !clienteOcasional) return alert('Ingresa el nombre del cliente')

    const cliente = clienteTipo === 'registrado'
      ? clientes.find(c => c.id === clienteId)
      : null

    await addDoc(collection(db, 'ventas'), {
      clienteId: clienteTipo === 'registrado' ? clienteId : null,
      clienteNombre: clienteTipo === 'registrado' ? cliente?.nombre : clienteOcasional,
      clienteTipo,
      items: itemsSeleccionados.map(i => ({
        id: i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidadVenta
      })),
      total,
      fecha: new Date().toISOString()
    })

    // Restar stock del inventario
    for (const item of itemsSeleccionados) {
      const nuevoStock = parseInt(item.cantidad) - item.cantidadVenta
      await updateDoc(doc(db, 'inventario', item.id), { cantidad: nuevoStock.toString() })
    }

    setItemsSeleccionados([])
    setClienteId('')
    setClienteOcasional('')
    setClienteTipo('registrado')
    setShowModal(false)
    cargarDatos()
  }

  const productosFiltrados = inventario.filter(i =>
    i.nombre?.toLowerCase().includes(busquedaProducto.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="bg-white text-blue-700 px-3 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">← Volver</button>
          <h1 className="text-xl font-bold">💰 Ventas</h1>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-white text-blue-700 px-4 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">
          + Nueva Venta
        </button>
      </nav>

      <div className="p-6 max-w-4xl mx-auto">
        {ventas.length === 0 && <p className="text-gray-500 text-center mt-8">No hay ventas registradas</p>}
        <div className="space-y-4">
          {ventas.map(venta => (
            <div key={venta.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">👤 {venta.clienteNombre}
                    {venta.clienteTipo === 'ocasional' && <span className="text-xs text-gray-400 ml-2">(ocasional)</span>}
                  </p>
                  <p className="text-gray-500 text-sm">📅 {new Date(venta.fecha).toLocaleDateString('es-BO')}</p>
                  <div className="mt-2 space-y-1">
                    {venta.items?.map((item, i) => (
                      <p key={i} className="text-gray-600 text-sm">
                        • {item.nombre} x{item.cantidad} — Bs. {(parseFloat(item.precio) * item.cantidad).toFixed(2)}
                      </p>
                    ))}
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-700">Bs. {parseFloat(venta.total).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nueva Venta</h2>

            {/* Tipo de cliente */}
            <div className="flex gap-3 mb-4">
              <button onClick={() => setClienteTipo('registrado')}
                className={`flex-1 py-2 rounded-lg border font-medium transition ${clienteTipo === 'registrado' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'}`}>
                Cliente Registrado
              </button>
              <button onClick={() => setClienteTipo('ocasional')}
                className={`flex-1 py-2 rounded-lg border font-medium transition ${clienteTipo === 'ocasional' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'}`}>
                Cliente Ocasional
              </button>
            </div>

            {clienteTipo === 'registrado' ? (
              <select value={clienteId} onChange={e => setClienteId(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Seleccionar cliente *</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            ) : (
              <input placeholder="Nombre del cliente ocasional *" value={clienteOcasional}
                onChange={e => setClienteOcasional(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            )}

            {/* Buscar producto */}
            <input placeholder="🔍 Buscar producto..." value={busquedaProducto}
              onChange={e => setBusquedaProducto(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400" />

            {/* Lista de productos */}
            <div className="max-h-40 overflow-y-auto border rounded-lg mb-4">
              {productosFiltrados.map(item => (
                <div key={item.id} className="flex justify-between items-center px-3 py-2 hover:bg-blue-50 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{item.nombre}</p>
                    <p className="text-blue-600 text-xs">Bs. {item.precio} — Stock: {item.cantidad}</p>
                  </div>
                  <button onClick={() => agregarItem(item)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600">
                    + Agregar
                  </button>
                </div>
              ))}
            </div>

            {/* Productos seleccionados */}
            {itemsSeleccionados.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Productos seleccionados:</h3>
                <div className="space-y-2">
                  {itemsSeleccionados.map(item => (
                    <div key={item.id} className="flex justify-between items-center border rounded-lg px-3 py-2">
                      <p className="font-medium text-sm flex-1">{item.nombre}</p>
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" value={item.cantidadVenta}
                          onChange={e => cambiarCantidad(item.id, e.target.value)}
                          className="w-14 border rounded px-2 py-1 text-center text-sm" />
                        <p className="text-blue-600 text-sm w-20 text-right">Bs. {(parseFloat(item.precio) * item.cantidadVenta).toFixed(2)}</p>
                        <button onClick={() => quitarItem(item.id)} className="text-red-500 hover:text-red-700">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-right">
                  <p className="text-xl font-bold text-blue-700">Total: Bs. {total.toFixed(2)}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-3">
              <button onClick={() => { setShowModal(false); setItemsSeleccionados([]) }}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-100">Cancelar</button>
              <button onClick={handleGuardar}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Guardar Venta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Ventas