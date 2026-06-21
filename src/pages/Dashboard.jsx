import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

function Dashboard() {
  const navigate = useNavigate()
  const [resumen, setResumen] = useState({ clientes: 0, citasPendientes: 0, ventasHoy: 0, totalHoy: 0 })

  const cargarResumen = async () => {
    const clientesSnap = await getDocs(collection(db, 'clientes'))
    const totalClientes = clientesSnap.size

    const citasSnap = await getDocs(query(collection(db, 'citas'), where('estado', '==', 'pendiente')))
    const totalPendientes = citasSnap.size

    const ventasSnap = await getDocs(collection(db, 'ventas'))
    const hoy = new Date().toLocaleDateString('es-BO')
    const ventasHoy = ventasSnap.docs.filter(d => {
      const fecha = new Date(d.data().fecha).toLocaleDateString('es-BO')
      return fecha === hoy
    })
    const totalHoy = ventasHoy.reduce((acc, d) => acc + parseFloat(d.data().total || 0), 0)

    setResumen({ clientes: totalClientes, citasPendientes: totalPendientes, ventasHoy: ventasHoy.length, totalHoy })
  }

  useEffect(() => { cargarResumen() }, [])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  const modulos = [
    { nombre: 'Clientes', icono: '👥', ruta: '/clientes', color: 'bg-blue-500' },
    { nombre: 'Doctores', icono: '👨‍⚕️', ruta: '/doctores', color: 'bg-teal-500' },
    { nombre: 'Citas', icono: '📅', ruta: '/citas', color: 'bg-green-500' },
    { nombre: 'Inventario', icono: '📦', ruta: '/inventario', color: 'bg-yellow-500' },
    { nombre: 'Ventas', icono: '💰', ruta: '/ventas', color: 'bg-purple-500' },
    { nombre: 'Reportes', icono: '📊', ruta: '/reportes', color: 'bg-red-500' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">Zootopia</h1>
        <div className="flex gap-3">
          <button onClick={() => navigate('/perfil')}
            className="bg-white text-blue-700 px-4 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">
            👤 Mi Perfil
          </button>
          <button onClick={handleLogout}
            className="bg-white text-blue-700 px-4 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{resumen.clientes}</p>
            <p className="text-gray-500 text-sm mt-1">👥 Clientes</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-yellow-500">{resumen.citasPendientes}</p>
            <p className="text-gray-500 text-sm mt-1">📅 Citas Pendientes</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{resumen.ventasHoy}</p>
            <p className="text-gray-500 text-sm mt-1">💰 Ventas Hoy</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-green-600">Bs. {resumen.totalHoy.toFixed(2)}</p>
            <p className="text-gray-500 text-sm mt-1">💵 Total Hoy</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-700 mb-4">¿Qué deseas gestionar?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {modulos.map((mod) => (
            <div key={mod.ruta} onClick={() => navigate(mod.ruta)}
              className={`${mod.color} text-white rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:opacity-90 transition shadow-md`}>
              <span className="text-5xl mb-3">{mod.icono}</span>
              <span className="text-lg font-semibold">{mod.nombre}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard