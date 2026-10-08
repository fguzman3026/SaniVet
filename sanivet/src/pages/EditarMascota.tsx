import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import FormularioMascota from '@/components/FormularioMascota'
import Boton from '@/components/ui/Boton'
import Modal from '@/components/ui/Modal'
import Pantalla from '@/pages/Pantalla'
import { usePets } from '@/state/PetsProvider'
import { useMascota } from '@/state/hooks'

const DEMORA_ELIMINAR_MS = 450

export default function EditarMascota() {
  const { id } = useParams<{ id: string }>()
  const navegar = useNavigate()
  const { eliminar } = usePets()
  const mascota = useMascota(id ?? '')
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  // El botón de confirmar queda con cara de "corriendo" (no inactivo) hasta
  // que la mascota se elimina de verdad y se navega a Inicio.
  useEffect(() => {
    if (!eliminando || !mascota) return
    const id = setTimeout(() => {
      eliminar(mascota.id)
      navegar('/')
    }, DEMORA_ELIMINAR_MS)
    return () => clearTimeout(id)
  }, [eliminando, mascota, eliminar, navegar])

  if (!mascota) {
    return (
      <Pantalla titulo="Editar mascota">
        <p className="text-muted">Esa mascota no existe.</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-primary hover:text-primary-hover">
          Volver a Inicio
        </Link>
      </Pantalla>
    )
  }

  return (
    <Pantalla titulo="Editar mascota">
      <FormularioMascota mascotaExistente={mascota} />

      <div className="mt-8 border-t border-border pt-6">
        <Boton variante="destructivo" onClick={() => setConfirmandoEliminar(true)}>
          Eliminar mascota
        </Boton>
      </div>

      <Modal abierto={confirmandoEliminar} titulo="Eliminar mascota" onCerrar={() => setConfirmandoEliminar(false)}>
        <p className="text-text">¿Eliminar a {mascota.nombre}? Esta acción no se puede deshacer.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setConfirmandoEliminar(false)} disabled={eliminando}>
            Cancelar
          </Boton>
          <Boton variante="destructivo" solido estado={eliminando ? 'pendiente' : 'inactivo'} onClick={() => setEliminando(true)}>
            Eliminar
          </Boton>
        </div>
      </Modal>
    </Pantalla>
  )
}
