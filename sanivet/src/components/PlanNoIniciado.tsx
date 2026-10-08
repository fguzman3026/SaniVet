import { useEffect, useState } from 'react'
import Boton from '@/components/ui/Boton'
import Campo from '@/components/ui/Campo'
import Tarjeta from '@/components/ui/Tarjeta'
import { formatearFecha } from '@/lib/fechas'
import type { FechaISO } from '@/domain/tipos'

interface PlanNoIniciadoProps {
  fechaSugerida: FechaISO
  onIniciar: (fecha: FechaISO) => void
}

const DEMORA_EXITO_MS = 450

/** La fecha de inicio sugerida, precargada pero editable, con el botón para arrancar el plan. */
export default function PlanNoIniciado({ fechaSugerida, onIniciar }: PlanNoIniciadoProps) {
  const [fecha, setFecha] = useState<FechaISO>(fechaSugerida)
  const [iniciado, setIniciado] = useState(false)

  useEffect(() => {
    if (!iniciado) return
    const id = setTimeout(() => onIniciar(fecha), DEMORA_EXITO_MS)
    return () => clearTimeout(id)
  }, [iniciado, fecha, onIniciar])

  return (
    <Tarjeta className="flex flex-col gap-3">
      <p className="font-semibold text-text">Plan no iniciado</p>
      <p className="text-sm text-muted">Fecha sugerida: {formatearFecha(fechaSugerida)}</p>
      <Campo label="Fecha de inicio" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={iniciado} />
      <Boton onClick={() => setIniciado(true)} estado={iniciado ? 'exito' : 'inactivo'} className="self-start">
        Iniciar plan
      </Boton>
    </Tarjeta>
  )
}
