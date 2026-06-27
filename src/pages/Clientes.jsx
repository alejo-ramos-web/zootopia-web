const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cliente? Se eliminarán también sus mascotas, historial y citas.')) return
    try {
      // Eliminar mascotas e historial
      const mascotasSnap = await getDocs(collection(db, 'clientes', id, 'mascotas'))
      for (const mascota of mascotasSnap.docs) {
        const historialSnap = await getDocs(collection(db, 'clientes', id, 'mascotas', mascota.id, 'historial'))
        for (const consulta of historialSnap.docs) {
          await deleteDoc(doc(db, 'clientes', id, 'mascotas', mascota.id, 'historial', consulta.id))
        }
        await deleteDoc(doc(db, 'clientes', id, 'mascotas', mascota.id))
      }

      // Eliminar citas del cliente
      const citasSnap = await getDocs(collection(db, 'citas'))
      for (const cita of citasSnap.docs) {
        if (cita.data().clienteId === id) {
          await deleteDoc(doc(db, 'citas', cita.id))
        }
      }

      // Eliminar usuario de la colección usuarios si existe
      try {
        await deleteDoc(doc(db, 'usuarios', id))
      } catch (e) {}

      // Eliminar cliente
      await deleteDoc(doc(db, 'clientes', id))
      cargarClientes()
    } catch (err) {
      alert('Error al eliminar el cliente')
    }
  }