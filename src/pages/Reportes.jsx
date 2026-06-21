import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useNavigate } from 'react-router-dom'

function Reportes() {
  const navigate = useNavigate()
  const [ventas, setVentas] = useState([])
  const [periodo, setPeriodo] = useState('hoy')

  const cargarVentas = async () => {
    const snap = await getDocs(collection(db, 'ventas'))
    setVentas(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { cargarVentas() }, [])

  const filtrarVentas = () => {
    const ahora = new Date()
    return ventas.filter(v => {
      const fecha = new Date(v.fecha)
      if (periodo === 'hoy') {
        return fecha.toDateString() === ahora.toDateString()
      } else if (periodo === 'semana') {
        const hace7 = new Date()
        hace7.setDate(ahora.getDate() - 7)
        return fecha >= hace7
      } else if (periodo === 'mes') {
        return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear()
      }
      return true
    })
  }

  const ventasFiltradas = filtrarVentas()
  const totalPeriodo = ventasFiltradas.reduce((acc, v) => acc + parseFloat(v.total || 0), 0)

  // Producto más vendido
  const productosCount = {}
  ventas.forEach(v => {
    v.items?.forEach(item => {
      if (!productosCount[item.nombre]) productosCount[item.nombre] = 0
      productosCount[item.nombre] += item.cantidad
    })
  })
  const productoTop = Object.entries(productosCount).sort((a, b) => b[1] - a[1])[0]

  // Cliente que más compra
  const clientesCount = {}
  ventas.forEach(v => {
    const nombre = v.clienteNombre || 'Ocasional'
    if (!clientesCount[nombre]) clientesCount[nombre] = 0
    clientesCount[nombre] += parseFloat(v.total || 0)
  })
  const clienteTop = Object.entries(clientesCount).sort((a, b) => b[1] - a[1])[0]

  const handleImprimir = () => {
    window.print()
  }

  const periodoLabel = {
    hoy: 'Hoy',
    semana: 'Esta Semana',
    mes: 'Este Mes'
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="bg-white text-blue-700 px-3 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">← Volver</button>
          <h1 className="text-xl font-bold">📊 Reportes</h1>
        </div>
        <button onClick={handleImprimir}
          className="bg-white text-blue-700 px-4 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">
          🖨️ Imprimir
        </button>
      </nav>

      <div className="p-6 max-w-4xl mx-auto space-y-6">

        {/* Filtros periodo */}
        <div className="flex gap-3 print:hidden">
          {['hoy', 'semana', 'mes'].map(p => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`px-4 py-2 rounded-lg font-medium transition ${periodo === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}>
              {periodoLabel[p]}
            </button>
          ))}
        </div>

        {/* Header impresión */}
        <div className="hidden print:block text-center mb-4">
          <h1 className="text-2xl font-bold">Veterinaria Zootopia</h1>
          <p className="text-gray-500">Reporte de Ventas — {periodoLabel[periodo]}</p>
          <p className="text-gray-500">{new Date().toLocaleDateString('es-BO')}</p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{ventasFiltradas.length}</p>
            <p className="text-gray-500 text-sm mt-1">Ventas {periodoLabel[periodo]}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">Bs. {totalPeriodo.toFixed(2)}</p>
            <p className="text-gray-500 text-sm mt-1">Total {periodoLabel[periodo]}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">Bs. {ventasFiltradas.length > 0 ? (totalPeriodo / ventasFiltradas.length).toFixed(2) : '0.00'}</p>
            <p className="text-gray-500 text-sm mt-1">Promedio por venta</p>
          </div>
        </div>

        {/* Top productos y clientes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="font-bold text-gray-700 mb-2">🏆 Producto más vendido</h3>
            {productoTop ? (
              <div>
                <p className="text-lg font-bold text-blue-600">{productoTop[0]}</p>
                <p className="text-gray-500 text-sm">{productoTop[1]} unidades vendidas</p>
              </div>
            ) : <p className="text-gray-400">Sin datos</p>}
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="font-bold text-gray-700 mb-2">⭐ Cliente frecuente</h3>
            {clienteTop ? (
              <div>
                <p className="text-lg font-bold text-blue-600">{clienteTop[0]}</p>
                <p className="text-gray-500 text-sm">Bs. {parseFloat(clienteTop[1]).toFixed(2)} en compras</p>
              </div>
            ) : <p className="text-gray-400">Sin datos</p>}
          </div>
        </div>

        {/* Detalle de ventas */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-bold text-gray-700 mb-4 text-lg">📋 Detalle de Ventas — {periodoLabel[periodo]}</h3>
          {ventasFiltradas.length === 0 && <p className="text-gray-400">No hay ventas en este período</p>}
          <div className="space-y-3">
            {ventasFiltradas.map(venta => (
              <div key={venta.id} className="border border-gray-200 rounded-xl p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">👤 {venta.clienteNombre}
                      {venta.clienteTipo === 'ocasional' && <span className="text-xs text-gray-400 ml-1">(ocasional)</span>}
                    </p>
                    <p className="text-gray-400 text-xs">📅 {new Date(venta.fecha).toLocaleDateString('es-BO')} {new Date(venta.fecha).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</p>
                    <div className="mt-1">
                      {venta.items?.map((item, i) => (
                        <p key={i} className="text-gray-500 text-sm">• {item.nombre} x{item.cantidad} — Bs. {(parseFloat(item.precio) * item.cantidad).toFixed(2)}</p>
                      ))}
                    </div>
                  </div>
                  <p className="font-bold text-blue-700">Bs. {parseFloat(venta.total).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          {ventasFiltradas.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <p className="font-bold text-gray-700">Total {periodoLabel[periodo]}:</p>
              <p className="text-2xl font-bold text-blue-700">Bs. {totalPeriodo.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reportes