import { aplicarIntervalo } from '@/lib/fechas'
import { edadMinimaParaPlan } from '@/domain/protocolo'
import type { Especie, FechaISO, PlanId } from '@/domain/tipos'

export interface ResultadoValidacion {
  errores: string[] // bloqueantes
  avisos: string[] // no bloqueantes
}

const SIN_PROBLEMAS: ResultadoValidacion = { errores: [], avisos: [] }

/**
 * Mayor entre hoy y la fecha en que la mascota alcanza la edad mínima del plan.
 * Toma `especie`/`fechaNacimiento` sueltos (no una `Mascota` completa) porque el
 * formulario de alta la necesita antes de que exista una mascota real.
 */
export function fechaSugeridaInicio(especie: Especie, fechaNacimiento: FechaISO, plan: PlanId, hoy: FechaISO): FechaISO {
  const edadMinima = edadMinimaParaPlan(especie, plan)
  const fechaPorEdadMinima = aplicarIntervalo(fechaNacimiento, { tipo: 'dias', cantidad: edadMinima })
  return fechaPorEdadMinima > hoy ? fechaPorEdadMinima : hoy
}

export function validarNombre(nombre: string, nombresExistentes: string[]): ResultadoValidacion {
  const errores: string[] = []
  const avisos: string[] = []
  const nombreLimpio = nombre.trim()

  if (nombreLimpio.length < 2 || nombreLimpio.length > 40) {
    errores.push('El nombre debe tener entre 2 y 40 caracteres.')
  }
  if (nombresExistentes.includes(nombreLimpio)) {
    avisos.push('Ya tenés una mascota con ese nombre.')
  }

  return { errores, avisos }
}

export function validarFechaNacimiento(fechaNacimiento: FechaISO, hoy: FechaISO): ResultadoValidacion {
  const errores: string[] = []

  if (fechaNacimiento > hoy) {
    errores.push('La fecha de nacimiento no puede ser futura.')
  }
  if (fechaNacimiento < aplicarIntervalo(hoy, { tipo: 'anios', cantidad: -30 })) {
    errores.push('La fecha de nacimiento no puede ser de más de 30 años atrás.')
  }

  return errores.length > 0 ? { errores, avisos: [] } : SIN_PROBLEMAS
}

export function validarFechaInicio(
  especie: Especie,
  fechaNacimiento: FechaISO,
  plan: PlanId,
  fechaInicio: FechaISO,
  hoy: FechaISO,
): ResultadoValidacion {
  const errores: string[] = []
  const avisos: string[] = []

  if (fechaInicio < fechaNacimiento) {
    errores.push('La fecha de inicio no puede ser anterior a la fecha de nacimiento.')
  }

  const edadMinima = edadMinimaParaPlan(especie, plan)
  const fechaMinima = aplicarIntervalo(fechaNacimiento, { tipo: 'dias', cantidad: edadMinima })
  const yaAlcanzoEdadMinima = hoy >= fechaMinima

  if (fechaInicio > hoy && yaAlcanzoEdadMinima) {
    errores.push('La fecha de inicio no puede ser futura.')
  }
  if (fechaInicio < fechaMinima) {
    avisos.push('Según el plan, este plan arranca más adelante según la edad mínima. Revisá la fecha si fue un error.')
  }

  return { errores, avisos }
}

export function validarFechaAplicacion(fechaReal: FechaISO, hoy: FechaISO, fechaAnterior: FechaISO | null): ResultadoValidacion {
  const errores: string[] = []

  if (fechaReal > hoy) {
    errores.push('La fecha de aplicación no puede ser futura.')
  }
  if (fechaAnterior !== null && fechaReal < fechaAnterior) {
    errores.push('La fecha de aplicación no puede ser anterior a la de la dosis previa.')
  }

  return errores.length > 0 ? { errores, avisos: [] } : SIN_PROBLEMAS
}
