import { definicionPara } from '@/domain/protocolo'
import type { FechaISO, Mascota, PlanId } from '@/domain/tipos'

export class ReglaDeNegocioError extends Error {}

export function iniciarPlan(mascota: Mascota, plan: PlanId, fechaInicio: FechaISO): Mascota {
  return {
    ...mascota,
    planes: { ...mascota.planes, [plan]: { fechaInicio, aplicaciones: [] } },
    actualizadaEn: new Date().toISOString(),
  }
}

export function marcarAplicada(mascota: Mascota, plan: PlanId, orden: number, fechaReal: FechaISO, hoy: FechaISO): Mascota {
  const planActual = mascota.planes[plan]

  if (planActual.fechaInicio === null) {
    throw new ReglaDeNegocioError('El plan no está iniciado.')
  }
  if (orden !== planActual.aplicaciones.length) {
    throw new ReglaDeNegocioError('Solo se puede marcar como aplicada la próxima dosis pendiente.')
  }
  if (fechaReal > hoy) {
    throw new ReglaDeNegocioError('La fecha de aplicación no puede ser futura.')
  }
  const anterior = planActual.aplicaciones.at(-1)
  if (anterior !== undefined && fechaReal < anterior.fechaReal) {
    throw new ReglaDeNegocioError('La fecha de aplicación no puede ser anterior a la de la dosis previa.')
  }

  return {
    ...mascota,
    planes: {
      ...mascota.planes,
      [plan]: { ...planActual, aplicaciones: [...planActual.aplicaciones, { orden, fechaReal }] },
    },
    actualizadaEn: new Date().toISOString(),
  }
}

export function desmarcarUltima(mascota: Mascota, plan: PlanId): Mascota {
  const planActual = mascota.planes[plan]
  if (planActual.aplicaciones.length === 0) return mascota

  return {
    ...mascota,
    planes: {
      ...mascota.planes,
      [plan]: { ...planActual, aplicaciones: planActual.aplicaciones.slice(0, -1) },
    },
    actualizadaEn: new Date().toISOString(),
  }
}

export interface ResultadoAjustePlan {
  mascota: Mascota
  aplicacionesDescartadas: number
}

/**
 * Tras editar `fechaNacimiento` o la `fechaInicio` de un plan, descarta las
 * aplicaciones cuyo `orden` quedó fuera del esquema inicial del nuevo
 * esquema (p. ej. un perro que pasó de cachorro — 5 pasos — a adulto —
 * 3 pasos — y tenía aplicaciones con `orden` 3 o 4). Ver "Edición de fechas
 * base" en el spec técnico.
 *
 * Caso no cubierto a propósito: si ya hay refuerzos anuales aplicados más
 * allá del esquema inicial (`orden` por encima de `pasos.length`), también
 * se descartan — el spec solo describe el recorte de la cola del esquema
 * inicial, no una reconciliación más fina de los refuerzos ya aplicados.
 */
export function ajustarPlanTrasEdicion(mascota: Mascota, plan: PlanId, hoy: FechaISO): ResultadoAjustePlan {
  const planActual = mascota.planes[plan]
  if (planActual.fechaInicio === null || planActual.aplicaciones.length === 0) {
    return { mascota, aplicacionesDescartadas: 0 }
  }

  const definicion = definicionPara(mascota, plan, hoy)
  const aplicacionesValidas = planActual.aplicaciones.filter((a) => a.orden < definicion.pasos.length)
  const aplicacionesDescartadas = planActual.aplicaciones.length - aplicacionesValidas.length

  if (aplicacionesDescartadas === 0) return { mascota, aplicacionesDescartadas: 0 }

  return {
    mascota: {
      ...mascota,
      planes: { ...mascota.planes, [plan]: { ...planActual, aplicaciones: aplicacionesValidas } },
      actualizadaEn: new Date().toISOString(),
    },
    aplicacionesDescartadas,
  }
}
