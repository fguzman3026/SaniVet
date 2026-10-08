import { addDays, addMonths, addYears, differenceInCalendarDays, differenceInMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { FechaISO, Intervalo } from '@/domain/tipos'

/** 'YYYY-MM-DD' -> Date a medianoche local. No usar `new Date(fecha)`:
 *  parsea como UTC y corre la fecha un día según el huso. */
export function fechaISOaDate(fecha: FechaISO): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(anio as number, (mes as number) - 1, dia as number)
}

export function dateAFechaISO(fecha: Date): FechaISO {
  return format(fecha, 'yyyy-MM-dd')
}

export function hoyISO(): FechaISO {
  return dateAFechaISO(new Date())
}

export function aplicarIntervalo(fecha: FechaISO, intervalo: Intervalo | null): FechaISO {
  if (intervalo === null) return fecha
  const base = fechaISOaDate(fecha)
  const resultado =
    intervalo.tipo === 'dias'
      ? addDays(base, intervalo.cantidad)
      : intervalo.tipo === 'meses'
        ? addMonths(base, intervalo.cantidad)
        : addYears(base, intervalo.cantidad)
  return dateAFechaISO(resultado)
}

/** Días de calendario entre dos FechaISO: positivo si `hasta` es posterior a `desde`. */
export function diffEnDias(desde: FechaISO, hasta: FechaISO): number {
  return differenceInCalendarDays(fechaISOaDate(hasta), fechaISOaDate(desde))
}

/** Meses completos entre dos FechaISO (respeta el día del mes, no solo el mes calendario). */
export function diffEnMeses(desde: FechaISO, hasta: FechaISO): number {
  return differenceInMonths(fechaISOaDate(hasta), fechaISOaDate(desde))
}

export function formatearFecha(fecha: FechaISO): string {
  return format(fechaISOaDate(fecha), "d 'de' MMMM", { locale: es })
}

export function formatearRangoFechas(desde: FechaISO, hasta: FechaISO): string {
  if (desde === hasta) return formatearFecha(desde)
  const d1 = fechaISOaDate(desde)
  const d2 = fechaISOaDate(hasta)
  const mismoMes = d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
  if (mismoMes) {
    return `${d1.getDate()} al ${formatearFecha(hasta)}`
  }
  return `${formatearFecha(desde)} al ${formatearFecha(hasta)}`
}

export function formatearRelativo(fecha: FechaISO, hoy: FechaISO): string {
  const dias = diffEnDias(hoy, fecha)
  if (dias === 0) return 'hoy'
  if (dias > 0) return `en ${dias} día${dias === 1 ? '' : 's'}`
  const atraso = Math.abs(dias)
  return `hace ${atraso} día${atraso === 1 ? '' : 's'}`
}

/** "4 meses y 12 días". */
export function edadEnTexto(fechaNacimiento: FechaISO, hoy: FechaISO): string {
  let meses = diffEnMeses(fechaNacimiento, hoy)
  const dias = diffEnDias(dateAFechaISO(addMonths(fechaISOaDate(fechaNacimiento), meses)), hoy)
  const anios = Math.floor(meses / 12)
  meses = meses % 12

  const partes: string[] = []
  if (anios > 0) partes.push(`${anios} año${anios === 1 ? '' : 's'}`)
  if (meses > 0) partes.push(`${meses} mes${meses === 1 ? '' : 'es'}`)
  if (dias > 0 || partes.length === 0) partes.push(`${dias} día${dias === 1 ? '' : 's'}`)
  return partes.join(' y ')
}
