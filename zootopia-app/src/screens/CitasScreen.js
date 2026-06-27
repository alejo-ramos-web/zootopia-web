import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native'
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore'
import { auth, db } from '../../firebase'

export default function CitasScreen() {
  const [citas, setCitas] = useState([])
  const [doctores, setDoctores] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ mascotaId: '', mascotaNombre: '', doctorId: '', doctorNombre: '', fecha: '', hora: '', motivo: '' })

  const cargarDatos = async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    const citasSnap = await getDocs(query(collection(db, 'citas'), where('clienteId', '==', uid)))
    const lista = citasSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    setCitas(lista)

    const mascotasSnap = await getDocs(collection(db, 'clientes', uid, 'mascotas'))
    setMascotas(mascotasSnap.docs.map(d => ({ id: d.id, ...d.data() })))

    const usuariosSnap = await getDocs(collection(db, 'usuarios'))
    const docs = usuariosSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    setDoctores(docs.filter(u => u.rol === 'doctor'))
  }

  useEffect(() => { cargarDatos() }, [])

  const handleSolicitarCita = async () => {
    if (!form.mascotaId || !form.doctorId || !form.fecha || !form.hora || !form.motivo)
      return Alert.alert('Error', 'Todos los campos son obligatorios')

    const ahora = new Date()
    const fechaHoraCita = new Date(`${form.fecha}T${form.hora}`)
    const diff = (fechaHoraCita - ahora) / (1000 * 60 * 60)
    if (diff < 2) return Alert.alert('Error', 'La cita debe agendarse con mínimo 2 horas de anticipación')

    const uid = auth.currentUser?.uid
    try {
      await addDoc(collection(db, 'citas'), {
        clienteId: uid,
        mascotaId: form.mascotaId,
        doctorId: form.doctorId,
        nombreMascota: form.mascotaNombre,
        nombreDoctor: form.doctorNombre,
        fecha: form.fecha,
        hora: form.hora,
        motivo: form.motivo,
        estado: 'pendiente',
        fechaCreacion: new Date().toISOString()
      })
      Alert.alert('¡Éxito!', 'Tu cita fue solicitada y está en espera de confirmación')
      setShowModal(false)
      setForm({ mascotaId: '', mascotaNombre: '', doctorId: '', doctorNombre: '', fecha: '', hora: '', motivo: '' })
      cargarDatos()
    } catch (err) {
      Alert.alert('Error', 'No se pudo solicitar la cita')
    }
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>📅 Mis Citas</Text>
        <TouchableOpacity style={styles.botonNueva} onPress={() => setShowModal(true)}>
          <Text style={styles.botonNuevaTexto}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.lista}>
        {citas.length === 0 && <Text style={styles.vacio}>No tienes citas registradas</Text>}
        {citas.map(cita => (
          <View key={cita.id} style={[styles.card, { backgroundColor: estadoColor[cita.estado] }]}>
            <Text style={styles.cardTitulo}>🐾 {cita.nombreMascota}</Text>
            <Text style={styles.cardSubtitulo}>👨‍⚕️ Dr. {cita.nombreDoctor}</Text>
            <Text style={styles.cardSubtitulo}>📅 {cita.fecha} — {cita.hora}</Text>
            <Text style={styles.cardSubtitulo}>📋 {cita.motivo}</Text>
            <Text style={styles.estado}>{estadoTexto[cita.estado]}</Text>
            {cita.estado === 'rechazada' && cita.motivoRechazo && (
              <Text style={styles.rechazo}>❌ {cita.motivoRechazo}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Nueva Cita</Text>
            <ScrollView>
              <Text style={styles.label}>Mascota *</Text>
              {mascotas.map(m => (
                <TouchableOpacity key={m.id} onPress={() => setForm({ ...form, mascotaId: m.id, mascotaNombre: m.nombre })}
                  style={[styles.opcion, form.mascotaId === m.id && styles.opcionSeleccionada]}>
                  <Text style={form.mascotaId === m.id ? styles.opcionTextoSeleccionado : styles.opcionTexto}>{m.nombre}</Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.label}>Doctor *</Text>
              {doctores.map(d => (
                <TouchableOpacity key={d.id} onPress={() => setForm({ ...form, doctorId: d.id, doctorNombre: d.nombre })}
                  style={[styles.opcion, form.doctorId === d.id && styles.opcionSeleccionada]}>
                  <Text style={form.doctorId === d.id ? styles.opcionTextoSeleccionado : styles.opcionTexto}>Dr. {d.nombre}</Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.label}>Fecha * (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} placeholder="2026-06-25" value={form.fecha}
                onChangeText={v => setForm({ ...form, fecha: v })} />

              <Text style={styles.label}>Hora * (HH:MM)</Text>
              <TextInput style={styles.input} placeholder="10:00" value={form.hora}
                onChangeText={v => setForm({ ...form, hora: v })} />

              <Text style={styles.label}>Motivo *</Text>
              <TextInput style={[styles.input, { height: 80 }]} placeholder="Describe el motivo"
                value={form.motivo} onChangeText={v => setForm({ ...form, motivo: v })} multiline />

              <TouchableOpacity style={styles.boton} onPress={handleSolicitarCita}>
                <Text style={styles.botonTexto}>Solicitar Cita</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botonCancelar} onPress={() => setShowModal(false)}>
                <Text style={styles.botonCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#1D4ED8', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  botonNueva: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  botonNuevaTexto: { color: '#1D4ED8', fontWeight: 'bold' },
  lista: { padding: 16 },
  card: { borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardTitulo: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  cardSubtitulo: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  estado: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  rechazo: { fontSize: 13, color: '#DC2626', marginTop: 4 },
  vacio: { color: '#9CA3AF', textAlign: 'center', marginTop: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 15 },
  opcion: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, marginBottom: 6 },
  opcionSeleccionada: { borderColor: '#1D4ED8', backgroundColor: '#EFF6FF' },
  opcionTexto: { color: '#374151' },
  opcionTextoSeleccionado: { color: '#1D4ED8', fontWeight: 'bold' },
  boton: { backgroundColor: '#1D4ED8', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  botonCancelar: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  botonCancelarTexto: { color: '#6B7280', fontSize: 16 }
})