import { useState } from 'react'
import { Link } from 'react-router-dom'
import AvatarMascota from '@/components/AvatarMascota'
import BadgeEstado from '@/components/BadgeEstado'
import DialogoMarcarAplicada from '@/components/DialogoMarcarAplicada'
import Boton from '@/components/ui/Boton'
import Tarjeta from '@/components/ui/Tarjeta'
import type { FechaISO, ItemAgenda, Mascota, PlanId } from '@/domain/tipos'
import { formatearRangoFechas, formatearRelativo } from '@/lib/fechas'

interface FilaAgendaProps {
  mascota: Mascota
  item: ItemAgenda
  hoy: FechaISO
  /** Es la próxima dosis pendiente de su plan: solo ahí tiene sentido la acción directa. */
  marcable: boolean
  onMarcarAplicada: (fecha: FechaISO) => void
}

const ETIQUETA_PLAN: Record<PlanId, string> = {
  vacunacion: 'Vacunación',
  desparasitacion: 'Desparasitación',
}

/** Avatar, nombre, dosis, plan, fecha, días relativos y badge de estado — con acción directa si es marcable. */
export default function FilaAgenda({ mascota, item, hoy, marcable, onMarcarAplicada }: FilaAgendaProps) {
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const { evento, plan } = item

  return (
    <li>
      <Tarjeta className="flex flex-wrap items-center justify-between gap-3">
        <Link to={`/mascotas/${mascota.id}`} className="flex items-center gap-3">
          <AvatarMascota nombre={mascota.nombre} foto={mascota.foto} tamaño="sm" />
          <div>
            <p className="font-semibold text-text">{mascota.nombre}</p>
            <p className="text-sm text-muted">
              {evento.etiqueta} · {ETIQUETA_PLAN[plan]}
            </p>
            <p className="text-sm text-muted">{formatearRangoFechas(evento.desde, evento.hasta)}</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <BadgeEstado estado={evento.estado} etiqueta={formatearRelativo(evento.desde, hoy)} />
          {marcable && <Boton onClick={() => setDialogoAbierto(true)}>Marcar aplicada</Boton>}
        </div>
      </Tarjeta>

      {marcable && (
        <DialogoMarcarAplicada
          abierto={dialogoAbierto}
          etiqueta={evento.etiqueta}
          hoy={hoy}
          fechaMinima={mascota.planes[plan].aplicaciones.at(-1)?.fechaReal ?? null}
          onCerrar={() => setDialogoAbierto(false)}
          onConfirmar={(fecha) => {
            onMarcarAplicada(fecha)
            setDialogoAbierto(false)
          }}
        />
      )}
    </li>
  )
}
