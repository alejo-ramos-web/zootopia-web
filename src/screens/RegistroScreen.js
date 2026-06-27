import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase'

export default function RegistroScreen({ navigation }) {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '', telefono: '', direccion: '' })
  const [cargando, setCargando] = useState(false)

  const handleRegistro = async () => {
    if (!form.nombre || !form.email || !form.password || !form.telefono)
      return Alert.alert('Error', 'Nombre, email, teléfono y contraseña son obligatorios')
    if (form.password.length < 6)
      return Alert.alert('Error', 'La contraseña debe tener mínimo 6 caracteres')
    if (form.password !== form.confirmar)
      return Alert.alert('Error', 'Las contraseñas no coinciden')

    setCargando(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password)
      const uid = userCredential.user.uid

      await sendEmailVerification(userCredential.user)

      await setDoc(doc(db, 'usuarios', uid), {
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        direccion: form.direccion,
        rol: 'cliente',
        fechaRegistro: new Date().toISOString()
      })

      await setDoc(doc(db, 'clientes', uid), {
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        direccion: form.direccion,
        foto: ''
      })

      Alert.alert(
        '¡Registro exitoso!',
        'Te enviamos un correo de verificación. Por favor verifica tu email antes de ingresar.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      )
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') Alert.alert('Error', 'Este correo ya está registrado')
      else Alert.alert('Error', 'No se pudo crear la cuenta')
    }
    setCargando(false)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.titulo}>🐾 Crear Cuenta</Text>
      <Text style={styles.subtitulo}>Regístrate para gestionar las citas de tu mascota</Text>

      <TextInput style={styles.input} placeholder="Nombre completo *" value={form.nombre}
        onChangeText={v => setForm({ ...form, nombre: v })} />
      <TextInput style={styles.input} placeholder="Correo electrónico *" value={form.email}
        onChangeText={v => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Teléfono *" value={form.telefono}
        onChangeText={v => setForm({ ...form, telefono: v })} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Dirección" value={form.direccion}
        onChangeText={v => setForm({ ...form, direccion: v })} />
      <TextInput style={styles.input} placeholder="Contraseña * (mínimo 6 caracteres)" value={form.password}
        onChangeText={v => setForm({ ...form, password: v })} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirmar contraseña *" value={form.confirmar}
        onChangeText={v => setForm({ ...form, confirmar: v })} secureTextEntry />

      <TouchableOpacity style={styles.boton} onPress={handleRegistro} disabled={cargando}>
        <Text style={styles.botonTexto}>{cargando ? 'Registrando...' : 'Crear Cuenta'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF6FF' },
  content: { padding: 24, paddingTop: 60 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#1D4ED8', textAlign: 'center', marginBottom: 4 },
  subtitulo: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
  boton: { backgroundColor: '#1D4ED8', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#1D4ED8', textAlign: 'center', marginTop: 16, fontSize: 14 }
})