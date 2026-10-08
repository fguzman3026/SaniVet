import { aplicarIntervalo, diffEnDias } from '@/lib/fechas'
import { definicionPara } from '@/domain/protocolo'
import type { EventoCronograma, FechaISO, ItemAgenda, Mascota, PlanId, Estado } from '@/domain/tipos'

const HORIZONTE_MESES = 24
const TOPE_PASOS = 200

export function estadoDe(desde: FechaISO, hoy: FechaISO): Estado {
  const dias = diffEnDias(hoy, desde)
  if (dias < 0) return 'vencida'
  if (dias <= 7) return 'proxima'
  return 'programada'
}

export function derivarCronograma(mascota: Mascota, plan: PlanId, hoy: FechaISO): EventoCronograma[] {
  const planActual = mascota.planes[plan]
  if (planActual.fechaInicio === null) return []

  const definicion = definicionPara(mascota, plan, hoy)
  const horizonte = aplicarIntervalo(hoy, { tipo: 'meses', cantidad: HORIZONTE_MESES })

  const eventos: EventoCronograma[] = []
  let ancla = planActual.fechaInicio
  let anclaTeorica = planActual.fechaInicio
  let desdeTeoricoAnterior: FechaISO | null = null

  for (let i = 0; i < TOPE_PASOS; i++) {
    const paso = definicion.pasos[i] ?? definicion.repeticion?.paso
    if (!paso) break

    const aplicacion = planActual.aplicaciones.find((a) => a.orden === i)

    let desde: FechaISO
    let estado: Estado
    let fechaReal: FechaISO | null

    if (aplicacion) {
      desde = aplicacion.fechaReal
      fechaReal = aplicacion.fechaReal
      estado = 'aplicada'
      ancla = aplicacion.fechaReal
    } else {
      desde = i === 0 ? ancla : aplicarIntervalo(ancla, paso.desdeAnterior)
      ancla = desde
      fechaReal = null
      estado = estadoDe(desde, hoy)
    }

    const desdeTeorico = i === 0 ? anclaTeorica : aplicarIntervalo(anclaTeorica, paso.desdeAnterior)
    anclaTeorica = desdeTeorico

    const anterior = eventos[i - 1]
    const esProyeccionRecalculada =
      fechaReal === null && anterior !== undefined && anterior.estado === 'aplicada' && anterior.fechaReal !== desdeTeoricoAnterior

    desdeTeoricoAnterior = desdeTeorico

    const hasta = aplicarIntervalo(desde, { tipo: 'dias', cantidad: paso.duracionDias - 1 })
    const evento: EventoCronograma = { orden: i, etiqueta: paso.etiqueta, desde, hasta, estado, fechaReal, esProyeccionRecalculada }

    if (desde > horizonte) {
      const hayPendiente = eventos.some((e) => e.fechaReal === null)
      if (!hayPendiente) eventos.push(evento)
      break
    }
    eventos.push(evento)
  }

  return eventos
}

export function proximaPendiente(cronograma: EventoCronograma[]): EventoCronograma | null {
  return cronograma.find((e) => e.fechaReal === null) ?? null
}

export function agenda(mascotas: Mascota[], hoy: FechaISO): ItemAgenda[] {
  const planes: PlanId[] = ['vacunacion', 'desparasitacion']
  const items: ItemAgenda[] = []

  for (const mascota of mascotas) {
    for (const plan of planes) {
      const cronograma = derivarCronograma(mascota, plan, hoy)
      for (const evento of cronograma) {
        if (evento.fechaReal === null) {
          items.push({ mascotaId: mascota.id, plan, evento })
        }
      }
    }
  }

  items.sort((a, b) => a.evento.desde.localeCompare(b.evento.desde))
  return items.slice(0, 10)
}
