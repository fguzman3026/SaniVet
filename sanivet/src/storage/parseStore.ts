import type { Aplicacion, FechaISO, Mascota, Plan, SaniVetStore } from '@/domain/tipos'

const REGEX_FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/

function esFechaISO(valor: unknown): valor is FechaISO {
  return typeof valor === 'string' && REGEX_FECHA_ISO.test(valor)
}

function esAplicacion(valor: unknown): valor is Aplicacion {
  if (typeof valor !== 'object' || valor === null) return false
  const a = valor as Record<string, unknown>
  return typeof a.orden === 'number' && esFechaISO(a.fechaReal)
}

function esPlan(valor: unknown): valor is Plan {
  if (typeof valor !== 'object' || valor === null) return false
  const p = valor as Record<string, unknown>
  if (p.fechaInicio !== null && !esFechaISO(p.fechaInicio)) return false
  return Array.isArray(p.aplicaciones) && p.aplicaciones.every(esAplicacion)
}

function esMascota(valor: unknown): valor is Mascota {
  if (typeof valor !== 'object' || valor === null) return false
  const m = valor as Record<string, unknown>
  if (typeof m.id !== 'string' || typeof m.nombre !== 'string') return false
  if (m.especie !== 'perro' && m.especie !== 'gato') return false
  if (!esFechaISO(m.fechaNacimiento)) return false
  if (m.foto !== null && typeof m.foto !== 'string') return false
  if (typeof m.planes !== 'object' || m.planes === null) return false
  const planes = m.planes as Record<string, unknown>
  if (!esPlan(planes.vacunacion) || !esPlan(planes.desparasitacion)) return false
  return typeof m.creadaEn === 'string' && typeof m.actualizadaEn === 'string'
}

export function storeVacio(): SaniVetStore {
  return { version: 1, mascotas: [] }
}

/**
 * Valida la forma de un valor ya parseado de JSON. Nunca lanza: ante cualquier
 * forma inesperada devuelve `null` y es responsabilidad de quien llama decidir
 * qué hacer (en `storage/store.ts`, respaldar y arrancar con store vacío).
 */
export function parseStore(valor: unknown): SaniVetStore | null {
  if (typeof valor !== 'object' || valor === null) return null
  const s = valor as Record<string, unknown>
  if (s.version !== 1) return null
  if (!Array.isArray(s.mascotas) || !s.mascotas.every(esMascota)) return null
  return { version: 1, mascotas: s.mascotas }
}
