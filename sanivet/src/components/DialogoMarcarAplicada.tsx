import { useEffect, useState } from 'react'
import Boton from '@/components/ui/Boton'
import Campo from '@/components/ui/Campo'
import Modal from '@/components/ui/Modal'
import { validarFechaAplicacion } from '@/domain/validacion'
import type { FechaISO } from '@/domain/tipos'

interface DialogoMarcarAplicadaProps {
  abierto: boolean
  etiqueta: string
  hoy: FechaISO
  fechaMinima: FechaISO | null // fecha real de la dosis previa, si existe
  onConfirmar: (fecha: FechaISO) => void
  onCerrar: () => void
}

/** Fecha real con hoy por defecto, validada contra la dosis previa. */
export default function DialogoMarcarAplicada({ abierto, etiqueta, hoy, fechaMinima, onConfirmar, onCerrar }: DialogoMarcarAplicadaProps) {
  return (
    <Modal abierto={abierto} titulo={`Marcar aplicada: ${etiqueta}`} onCerrar={onCerrar}>
      {abierto && (
        <ContenidoDialogo
          // `key` fuerza un remount (y por lo tanto el reinicio del estado interno)
          // cada vez que se abre para una dosis distinta, sin necesitar un efecto.
          key={etiqueta}
          hoy={hoy}
          fechaMinima={fechaMinima}
          onConfirmar={onConfirmar}
          onCerrar={onCerrar}
        />
      )}
    </Modal>
  )
}

interface ContenidoDialogoProps {
  hoy: FechaISO
  fechaMinima: FechaISO | null
  onConfirmar: (fecha: FechaISO) => void
  onCerrar: () => void
}

const DEMORA_EXITO_MS = 450

function ContenidoDialogo({ hoy, fechaMinima, onConfirmar, onCerrar }: ContenidoDialogoProps) {
  const [fecha, setFecha] = useState<FechaISO>(hoy)
  const [error, setError] = useState<string | undefined>(undefined)
  const [confirmado, setConfirmado] = useState(false)

  // Al confirmar, el botón pasa a check verde un instante antes de cerrar
  // el modal — nunca queda con cara de inactivo mientras la acción "corre".
  useEffect(() => {
    if (!confirmado) return
    const id = setTimeout(() => onConfirmar(fecha), DEMORA_EXITO_MS)
    return () => clearTimeout(id)
  }, [confirmado, fecha, onConfirmar])

  function confirmar() {
    const resultado = validarFechaAplicacion(fecha, hoy, fechaMinima)
    const primerError = resultado.errores[0]
    if (primerError) {
      setError(primerError)
      return
    }
    setConfirmado(true)
  }

  return (
    <>
      <Campo
        label="Fecha de aplicación"
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        error={error}
        disabled={confirmado}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Boton variante="secundario" onClick={onCerrar} disabled={confirmado}>
          Cancelar
        </Boton>
        <Boton onClick={confirmar} estado={confirmado ? 'exito' : 'inactivo'}>
          Confirmar
        </Boton>
      </div>
    </>
  )
}
