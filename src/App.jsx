import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Seleccion from './pages/Seleccion'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DashboardDoctor from './pages/DashboardDoctor'
import Clientes from './pages/Clientes'
import ClienteDetalle from './pages/ClienteDetalle'
import MascotaHistorial from './pages/MascotaHistorial'
import Doctores from './pages/Doctores'
import Citas from './pages/Citas'
import Inventario from './pages/Inventario'
import Ventas from './pages/Ventas'
import Perfil from './pages/Perfil'
import Reportes from './pages/Reportes'
import RutaProtegida from './components/RutaProtegida'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Seleccion />} />
        <Route path="/login/:rol" element={<Login />} />

        {/* Rutas Recepcionista */}
        <Route path="/dashboard" element={<RutaProtegida rolRequerido="recepcionista"><Dashboard /></RutaProtegida>} />
        <Route path="/clientes" element={<RutaProtegida rolRequerido="recepcionista"><Clientes /></RutaProtegida>} />
        <Route path="/clientes/:id" element={<RutaProtegida rolRequerido="recepcionista"><ClienteDetalle /></RutaProtegida>} />
        <Route path="/clientes/:clienteId/mascotas/:mascotaId" element={<RutaProtegida rolRequerido="recepcionista"><MascotaHistorial /></RutaProtegida>} />
        <Route path="/doctores" element={<RutaProtegida rolRequerido="recepcionista"><Doctores /></RutaProtegida>} />
        <Route path="/citas" element={<RutaProtegida rolRequerido="recepcionista"><Citas /></RutaProtegida>} />
        <Route path="/inventario" element={<RutaProtegida rolRequerido="recepcionista"><Inventario /></RutaProtegida>} />
        <Route path="/ventas" element={<RutaProtegida rolRequerido="recepcionista"><Ventas /></RutaProtegida>} />
        <Route path="/perfil" element={<RutaProtegida rolRequerido="recepcionista"><Perfil /></RutaProtegida>} />
        <Route path="/reportes" element={<RutaProtegida rolRequerido="recepcionista"><Reportes /></RutaProtegida>} />

        {/* Rutas Doctor */}
        <Route path="/dashboard-doctor" element={<RutaProtegida rolRequerido="doctor"><DashboardDoctor /></RutaProtegida>} />
        <Route path="/doctor/clientes/:clienteId/mascotas/:mascotaId" element={<RutaProtegida rolRequerido="doctor"><MascotaHistorial /></RutaProtegida>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App