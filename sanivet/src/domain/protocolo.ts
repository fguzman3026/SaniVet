import { aplicarIntervalo, diffEnMeses } from '@/lib/fechas'
import type { DefinicionPlan, Especie, FechaISO, Intervalo, Mascota, PasoPlan, PlanId, Vacuna } from '@/domain/tipos'

function paso(etiqueta: string, vacunas: Vacuna[], desdeAnterior: Intervalo | null, duracionDias = 1): PasoPlan {
  return { etiqueta, vacunas, desdeAnterior, duracionDias }
}

const refuerzoAnual = paso('Refuerzo anual', ['refuerzo_anual'], { tipo: 'anios', cantidad: 1 })

export const vacunacionPerroCachorro: DefinicionPlan = {
  pasos: [
    paso('Quíntuple (1ª dosis)', ['quintuple'], null),
    paso('Quíntuple (2ª dosis)', ['quintuple'], { tipo: 'dias', cantidad: 21 }),
    paso('Séxtuple (1ª dosis)', ['sextuple'], { tipo: 'dias', cantidad: 21 }),
    paso('Séxtuple (2ª dosis)', ['sextuple'], { tipo: 'dias', cantidad: 21 }),
    paso('Antirrábica', ['antirrabica'], { tipo: 'dias', cantidad: 21 }),
  ],
  repeticion: { paso: refuerzoAnual, cada: { tipo: 'anios', cantidad: 1 } },
  edadMinimaDias: 45,
}

export const vacunacionPerroAdulto: DefinicionPlan = {
  pasos: [
    paso('Séxtuple (1ª dosis)', ['sextuple'], null),
    paso('Séxtuple (2ª dosis)', ['sextuple'], { tipo: 'dias', cantidad: 21 }),
    paso('Antirrábica', ['antirrabica'], { tipo: 'dias', cantidad: 21 }),
  ],
  repeticion: { paso: refuerzoAnual, cada: { tipo: 'anios', cantidad: 1 } },
  edadMinimaDias: 45,
}

export const vacunacionGato: DefinicionPlan = {
  pasos: [
    paso('Triple felina (1ª dosis)', ['triple_felina'], null),
    paso('Triple felina (2ª dosis)', ['triple_felina'], { tipo: 'meses', cantidad: 1 }),
    paso('Antirrábica', ['antirrabica'], { tipo: 'meses', cantidad: 1 }),
  ],
  repeticion: { paso: refuerzoAnual, cada: { tipo: 'anios', cantidad: 1 } },
  edadMinimaDias: 60,
}

export const desparasitacion: DefinicionPlan = {
  pasos: [
    paso('Tanda inicial', [], null, 3),
    paso('Refuerzo', [], { tipo: 'dias', cantidad: 15 }, 3),
  ],
  repeticion: {
    paso: paso('Mantenimiento', [], { tipo: 'meses', cantidad: 6 }, 3),
    cada: { tipo: 'meses', cantidad: 6 },
  },
  edadMinimaDias: 30,
}

export function edadMinimaParaPlan(especie: Especie, plan: PlanId): number {
  if (plan === 'desparasitacion') return desparasitacion.edadMinimaDias
  return especie === 'gato' ? vacunacionGato.edadMinimaDias : vacunacionPerroCachorro.edadMinimaDias
}

/**
 * La rama de vacunación de perro se decide por la edad en la fecha de inicio
 * del plan, no por la fecha de hoy. Si el plan todavía no se inició, se evalúa
 * contra la fecha en que la mascota alcanzaría la edad mínima (o hoy, lo que sea mayor).
 */
export function definicionPara(mascota: Mascota, plan: PlanId, hoy: FechaISO): DefinicionPlan {
  if (plan === 'desparasitacion') return desparasitacion
  if (mascota.especie === 'gato') return vacunacionGato

  const fechaInicio = mascota.planes.vacunacion.fechaInicio
  const fechaEvaluacion =
    fechaInicio ??
    maxFecha(hoy, aplicarIntervalo(mascota.fechaNacimiento, { tipo: 'dias', cantidad: vacunacionPerroCachorro.edadMinimaDias }))

  return diffEnMeses(mascota.fechaNacimiento, fechaEvaluacion) >= 6 ? vacunacionPerroAdulto : vacunacionPerroCachorro
}

function maxFecha(a: FechaISO, b: FechaISO): FechaISO {
  return a > b ? a : b
}
