import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'

export default function MascotaScreen({ route }) {
  const { mascota, clienteId } = route.params
  const [historial, setHistorial] = useState([])

  const cargarHistorial = async () => {
    const snap = await getDocs(collection(db, 'clientes', clienteId, 'mascotas', mascota.id, 'historial'))
    const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    setHistorial(lista)
  }

  useEffect(() => { cargarHistorial() }, [])

  return (
    <ScrollView style={styles.container}>

      {/* Perfil mascota */}
      <View style={styles.perfil}>
        {mascota.foto ? (
          <Image source={{ uri: mascota.foto }} style={styles.foto} />
        ) : (
          <View style={styles.avatar}><Text style={{ fontSize: 48 }}>🐶</Text></View>
        )}
        <Text style={styles.nombre}>{mascota.nombre}</Text>
        <Text style={styles.info}>{mascota.especie} — {mascota.raza}</Text>
        <View style={styles.datosRow}>
          <View style={styles.dato}>
            <Text style={styles.datoValor}>{mascota.sexo}</Text>
            <Text style={styles.datoLabel}>Sexo</Text>
          </View>
          <View style={styles.dato}>
            <Text style={styles.datoValor}>{mascota.edad}</Text>
            <Text style={styles.datoLabel}>Años</Text>
          </View>
          <View style={styles.dato}>
            <Text style={styles.datoValor}>{mascota.peso} kg</Text>
            <Text style={styles.datoLabel}>Peso</Text>
          </View>
        </View>
      </View>

      {/* Historial */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>📋 Historial de Consultas</Text>
        {historial.length === 0 && <Text style={styles.vacio}>No hay consultas registradas</Text>}
        {historial.map(consulta => (
          <View key={consulta.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.fecha}>📅 {consulta.fecha}</Text>
              <Text style={styles.peso}>⚖️ {consulta.peso} kg</Text>
            </View>
            <Text style={styles.campo}><Text style={styles.label}>Motivo: </Text>{consulta.motivo}</Text>
            <Text style={styles.campo}><Text style={styles.label}>Diagnóstico: </Text>{consulta.diagnostico}</Text>
            <Text style={styles.campo}><Text style={styles.label}>Tratamiento: </Text>{consulta.tratamiento}</Text>
            <Text style={styles.doctor}>👨‍⚕️ Dr. {consulta.doctor}</Text>
            {consulta.proximaCita && (
              <Text style={styles.proximaCita}>📅 Próxima cita: {consulta.proximaCita}</Text>
            )}
          </View>
        ))}
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  perfil: { backgroundColor: '#1D4ED8', padding: 24, alignItems: 'center', paddingTop: 50 },
  foto: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  nombre: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 12 },
  info: { fontSize: 14, color: '#BFDBFE', marginTop: 4 },
  datosRow: { flexDirection: 'row', gap: 24, marginTop: 16 },
  dato: { alignItems: 'center' },
  datoValor: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  datoLabel: { fontSize: 12, color: '#BFDBFE' },
  seccion: { padding: 16 },
  seccionTitulo: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fecha: { backgroundColor: '#DBEAFE', color: '#1D4ED8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 13 },
  peso: { backgroundColor: '#D1FAE5', color: '#065F46', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 13 },
  campo: { fontSize: 14, color: '#374151', marginBottom: 4 },
  label: { fontWeight: 'bold' },
  doctor: { fontSize: 13, color: '#6B7280', marginTop: 6 },
  proximaCita: { fontSize: 13, color: '#1D4ED8', marginTop: 4 },
  vacio: { color: '#9CA3AF', textAlign: 'center', marginTop: 8 }
})