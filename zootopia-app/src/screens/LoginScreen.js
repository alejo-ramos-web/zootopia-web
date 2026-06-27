import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Completa todos los campos')
    setCargando(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid
      const snap = await getDoc(doc(db, 'usuarios', uid))

      if (!snap.exists()) {
        Alert.alert('Error', 'Usuario no encontrado')
        setCargando(false)
        return
      }

      const rol = snap.data().rol
      if (rol !== 'cliente') {
        Alert.alert('Error', 'Esta cuenta no es de cliente')
        setCargando(false)
        return
      }

      navigation.replace('Main')
    } catch (err) {
      Alert.alert('Error', 'Correo o contraseña incorrectos')
    }
    setCargando(false)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>🐾 Zootopia</Text>
      <Text style={styles.subtitulo}>Sistema Veterinario</Text>

      <TextInput style={styles.input} placeholder="Correo electrónico"
        value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Contraseña"
        value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.boton} onPress={handleLogin} disabled={cargando}>
        <Text style={styles.botonTexto}>{cargando ? 'Ingresando...' : 'Ingresar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate aquí</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#EFF6FF' },
  titulo: { fontSize: 32, fontWeight: 'bold', color: '#1D4ED8', textAlign: 'center', marginBottom: 4 },
  subtitulo: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
  boton: { backgroundColor: '#1D4ED8', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#1D4ED8', textAlign: 'center', marginTop: 16, fontSize: 14 }
})