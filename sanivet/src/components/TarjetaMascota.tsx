import { Link } from 'react-router-dom'
import AvatarMascota from '@/components/AvatarMascota'
import BadgeEstado from '@/components/BadgeEstado'
import Tarjeta from '@/components/ui/Tarjeta'
import { derivarCronograma, proximaPendiente } from '@/domain/cronograma'
import type { EventoCronograma, FechaISO, Mascota, PlanId } from '@/domain/tipos'
import { edadEnTexto, formatearRelativo } from '@/lib/fechas'

interface TarjetaMascotaProps {
  mascota: Mascota
  hoy: FechaISO
}

const ETIQUETA_PLAN: Record<PlanId, string> = {
  vacunacion: 'Vacunación',
  desparasitacion: 'Desparasitación',
}

/** Foto, nombre, especie, edad y la próxima aplicación de cada plan. La tarjeta entera lleva a la ficha. */
export default function TarjetaMascota({ mascota, hoy }: TarjetaMascotaProps) {
  return (
    <Link to={`/mascotas/${mascota.id}`} className="block">
      <Tarjeta clickeable className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <AvatarMascota nombre={mascota.nombre} foto={mascota.foto} tamaño="md" />
          <div>
            <p className="font-semibold text-text">{mascota.nombre}</p>
            <p className="text-sm text-muted">
              <span className="capitalize">{mascota.especie}</span> · {edadEnTexto(mascota.fechaNacimiento, hoy)}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <FilaProximaPlan plan="vacunacion" mascota={mascota} hoy={hoy} />
          <FilaProximaPlan plan="desparasitacion" mascota={mascota} hoy={hoy} />
        </div>
      </Tarjeta>
    </Link>
  )
}

function FilaProximaPlan({ plan, mascota, hoy }: { plan: PlanId; mascota: Mascota; hoy: FechaISO }) {
  const fechaInicio = mascota.planes[plan].fechaInicio

  let proxima: EventoCronograma | null = null
  if (fechaInicio !== null) {
    proxima = proximaPendiente(derivarCronograma(mascota, plan, hoy))
  }

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted">{ETIQUETA_PLAN[plan]}</span>
      {fechaInicio === null ? (
        <span className="text-muted">No iniciado</span>
      ) : (
        proxima && <BadgeEstado estado={proxima.estado} etiqueta={formatearRelativo(proxima.desde, hoy)} />
      )}
    </div>
  )
}
