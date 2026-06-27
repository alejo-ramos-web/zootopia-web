import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { auth, db } from '../../firebase'
import { signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export default function HomeScreen({ navigation }) {
  const [usuario, setUsuario] = useState(null)
  const [mascotas, setMascotas] = useState([])
  const [citas, setCitas] = useState([])

  const cargarDatos = async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    const userSnap = await getDoc(doc(db, 'usuarios', uid))
    if (userSnap.exists()) setUsuario(userSnap.data())

    const mascotasSnap = await getDocs(collection(db, 'clientes', uid, 'mascotas'))
    setMascotas(mascotasSnap.docs.map(d => ({ id: d.id, ...d.data() })))

    const citasSnap = await getDocs(query(collection(db, 'citas'), where('clienteId', '==', uid)))
    const lista = citasSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    setCitas(lista.slice(0, 3))
  }

  useEffect(() => { cargarDatos() }, [])

  const handleLogout = async () => {
    await signOut(auth)
    navigation.replace('Login')
  }

  const estadoColor = {
    pendiente: '#FEF3C7',
    confirmada: '#D1FAE5',
    rechazada: '#FEE2E2'
  }

  const estadoTexto = {
    pendiente: '🟡 En espera de confirmación',
    confirmada: '🟢 Confirmada',
    rechazada: '🔴 Rechazada'
  }

  return (
    <ScrollView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.bienvenida}>Hola, {usuario?.nombre?.split(' ')[0]} 👋</Text>
          <Text style={styles.subtitulo}>Bienvenido a Zootopia</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutTexto}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Mascotas */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>🐾 Mis Mascotas</Text>
        {mascotas.length === 0 && <Text style={styles.vacio}>No tienes mascotas registradas aún</Text>}
        {mascotas.map(mascota => (
          <TouchableOpacity key={mascota.id} style={styles.card}
            onPress={() => navigation.navigate('Mascota', { mascota, clienteId: auth.currentUser.uid })}>
            <View style={styles.mascotaRow}>
              {mascota.foto ? (
                <Image source={{ uri: mascota.foto }} style={styles.mascotaFoto} />
              ) : (
                <View style={styles.mascotaAvatar}><Text style={{ fontSize: 28 }}>🐶</Text></View>
              )}
              <View>
                <Text style={styles.cardTitulo}>{mascota.nombre}</Text>
                <Text style={styles.cardSubtitulo}>{mascota.especie} — {mascota.raza}</Text>
                <Text style={styles.cardSubtitulo}>{mascota.sexo} | {mascota.edad} años | {mascota.peso} kg</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Últimas citas */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>📅 Mis Últimas Citas</Text>
        {citas.length === 0 && <Text style={styles.vacio}>No tienes citas registradas</Text>}
        {citas.map(cita => (
          <View key={cita.id} style={[styles.card, { backgroundColor: estadoColor[cita.estado] }]}>
            <Text style={styles.cardTitulo}>🐾 {cita.nombreMascota}</Text>
            <Text style={styles.cardSubtitulo}>📅 {cita.fecha} — {cita.hora}</Text>
            <Text style={styles.cardSubtitulo}>👨‍⚕️ Dr. {cita.nombreDoctor}</Text>
            <Text style={styles.cardSubtitulo}>📋 {cita.motivo}</Text>
            <Text style={[styles.estado]}>{estadoTexto[cita.estado]}</Text>
            {cita.estado === 'rechazada' && cita.motivoRechazo && (
              <Text style={styles.rechazo}>❌ {cita.motivoRechazo}</Text>
            )}
          </View>
        ))}
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#1D4ED8', padding: 24, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bienvenida: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitulo: { fontSize: 14, color: '#BFDBFE' },
  logoutBtn: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  logoutTexto: { color: '#1D4ED8', fontWeight: 'bold' },
  seccion: { padding: 16 },
  seccionTitulo: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardTitulo: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  cardSubtitulo: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  estado: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  rechazo: { fontSize: 13, color: '#DC2626', marginTop: 4 },
  vacio: { color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
  mascotaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mascotaFoto: { width: 56, height: 56, borderRadius: 28 },
  mascotaAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' }
})