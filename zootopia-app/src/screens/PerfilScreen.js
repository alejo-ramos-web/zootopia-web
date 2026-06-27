import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { auth, db } from '../../firebase'

export default function PerfilScreen() {
  const [usuario, setUsuario] = useState(null)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargarDatos = async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const snap = await getDoc(doc(db, 'usuarios', uid))
    if (snap.exists()) {
      const data = snap.data()
      setUsuario(data)
      setNombre(data.nombre)
      setTelefono(data.telefono)
      setDireccion(data.direccion)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const handleGuardar = async () => {
    if (!nombre || !telefono) return Alert.alert('Error', 'Nombre y teléfono son obligatorios')
    setGuardando(true)
    try {
      const uid = auth.currentUser?.uid
      await updateDoc(doc(db, 'usuarios', uid), { nombre, telefono, direccion })
      await updateDoc(doc(db, 'clientes', uid), { nombre, telefono, direccion })
      Alert.alert('✅', 'Datos actualizados correctamente')
    } catch (err) {
      Alert.alert('Error', 'No se pudo actualizar')
    }
    setGuardando(false)
  }

  const handleCambiarPassword = async () => {
    if (!passwordActual || !passwordNueva) return Alert.alert('Error', 'Completa ambos campos')
    if (passwordNueva.length < 6) return Alert.alert('Error', 'La nueva contraseña debe tener mínimo 6 caracteres')
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, passwordActual)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, passwordNueva)
      setPasswordActual('')
      setPasswordNueva('')
      Alert.alert('✅', 'Contraseña actualizada correctamente')
    } catch (err) {
      if (err.code === 'auth/wrong-password') Alert.alert('Error', 'Contraseña actual incorrecta')
      else Alert.alert('Error', 'No se pudo cambiar la contraseña')
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 48 }}>👤</Text>
        </View>
        <Text style={styles.nombre}>{usuario?.nombre}</Text>
        <Text style={styles.email}>{usuario?.email}</Text>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>📝 Mis Datos</Text>
        <Text style={styles.label}>Nombre</Text>
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />
        <Text style={styles.label}>Teléfono</Text>
        <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
        <Text style={styles.label}>Dirección</Text>
        <TextInput style={styles.input} value={direccion} onChangeText={setDireccion} />
        <TouchableOpacity style={styles.boton} onPress={handleGuardar} disabled={guardando}>
          <Text style={styles.botonTexto}>{guardando ? 'Guardando...' : 'Guardar Cambios'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>🔒 Cambiar Contraseña</Text>
        <Text style={styles.label}>Contraseña actual</Text>
        <TextInput style={styles.input} value={passwordActual} onChangeText={setPasswordActual} secureTextEntry />
        <Text style={styles.label}>Nueva contraseña</Text>
        <TextInput style={styles.input} value={passwordNueva} onChangeText={setPasswordNueva} secureTextEntry />
        <TouchableOpacity style={[styles.boton, { backgroundColor: '#0F766E' }]} onPress={handleCambiarPassword}>
          <Text style={styles.botonTexto}>Cambiar Contraseña</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#1D4ED8', padding: 24, paddingTop: 50, alignItems: 'center' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  nombre: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  email: { fontSize: 14, color: '#BFDBFE', marginTop: 4 },
  seccion: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16, elevation: 2 },
  seccionTitulo: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 15 },
  boton: { backgroundColor: '#1D4ED8', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
})