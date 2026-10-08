import BadgeEstado from '@/components/BadgeEstado'
import { IconoCheck } from '@/components/ui/iconos'
import { proximaPendiente } from '@/domain/cronograma'
import type { Estado, EventoCronograma, FechaISO } from '@/domain/tipos'
import { formatearFecha, formatearRangoFechas, formatearRelativo } from '@/lib/fechas'

interface LineaDeTiempoProps {
  eventos: EventoCronograma[]
  hoy: FechaISO
}

const COLOR_BORDE: Record<Estado, string> = {
  aplicada: 'border-success',
  vencida: 'border-destructive',
  proxima: 'border-warning',
  programada: 'border-neutral',
}

const COLOR_RELLENO: Record<Estado, string> = {
  aplicada: 'bg-success',
  vencida: 'bg-destructive',
  proxima: 'bg-warning',
  programada: 'bg-neutral',
}

/** Riel vertical con un nodo por dosis: aplicadas con check, pendientes huecas, la próxima rellena y más grande. */
export default function LineaDeTiempo({ eventos, hoy }: LineaDeTiempoProps) {
  const proxima = proximaPendiente(eventos)

  return (
    <ol className="flex flex-col gap-6 border-l-2 border-border pl-6">
      {eventos.map((evento, indice) => {
        const esProxima = proxima !== null && evento.orden === proxima.orden
        const relleno = evento.estado === 'aplicada' || esProxima
        const tamañoNodo = esProxima && evento.estado !== 'aplicada' ? 'size-3.5 -left-[27px]' : 'size-3 -left-[25px]'

        const anterior = eventos[indice - 1]

        return (
          <li key={evento.orden} className="relative">
            <span
              className={`absolute top-0.5 flex items-center justify-center rounded-full border-2 ${tamañoNodo} ${COLOR_BORDE[evento.estado]} ${relleno ? COLOR_RELLENO[evento.estado] : 'bg-surface'}`}
            >
              {evento.estado === 'aplicada' && <IconoCheck className="size-2 text-white" strokeWidth={3} />}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-text">{evento.etiqueta}</p>
              {!esProxima && <BadgeEstado estado={evento.estado} etiqueta={textoEstado(evento, hoy)} />}
            </div>

            {evento.estado === 'aplicada' ? (
              <p className="text-sm text-muted">Aplicada el {formatearFecha(evento.fechaReal as FechaISO)}</p>
            ) : (
              <p className="text-sm text-muted">{formatearRangoFechas(evento.desde, evento.hasta)}</p>
            )}

            {evento.esProyeccionRecalculada && anterior?.fechaReal && (
              <p className="text-sm text-muted italic">Recalculado: la dosis anterior se aplicó el {formatearFecha(anterior.fechaReal)}</p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function textoEstado(evento: EventoCronograma, hoy: FechaISO): string {
  if (evento.estado === 'aplicada') return 'Aplicada'
  if (evento.estado === 'vencida') return `Venció ${formatearRelativo(evento.desde, hoy)}`
  return formatearRelativo(evento.desde, hoy)
}
