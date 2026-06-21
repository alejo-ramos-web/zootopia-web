import { useNavigate } from 'react-router-dom'

function Seleccion() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center relative overflow-hidden">

      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-2xl text-center z-10">

        <div className="flex items-center justify-center gap-2 mb-2">
          
          <h1 className="text-4xl font-bold text-blue-700">Zootopia</h1>
        </div>
        <p className="text-gray-400 mb-8">Sistema Veterinario</p>

        <h2 className="text-2xl font-bold text-gray-700 mb-1">¿Cómo deseas ingresar?</h2>
        <p className="text-gray-400 mb-8">Selecciona tu tipo de usuario para continuar</p>

        <div className="grid grid-cols-2 gap-6">

          <div className="border border-gray-200 rounded-2xl p-6 flex flex-col items-center hover:shadow-lg transition cursor-pointer"
            onClick={() => navigate('/login/recepcionista')}>
            <img src="/recepcionista.png" alt="Recepcionista" className="w-36 h-36 object-contain mb-4 rounded-full bg-blue-50" />
            <h3 className="text-xl font-bold text-blue-700 mb-4">Recepcionista</h3>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition w-full">
              Seleccionar →
            </button>
          </div>

          <div className="border border-gray-200 rounded-2xl p-6 flex flex-col items-center hover:shadow-lg transition cursor-pointer"
            onClick={() => navigate('/login/doctor')}>
            <img src="/doctor.png" alt="Doctor" className="w-36 h-36 object-contain mb-4 rounded-full bg-blue-50" />
            <h3 className="text-xl font-bold text-blue-700 mb-4">Doctor</h3>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition w-full">
              Seleccionar →
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Seleccion