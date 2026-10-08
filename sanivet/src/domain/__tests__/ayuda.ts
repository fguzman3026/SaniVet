import type { Especie, Mascota, Plan, PlanId } from '@/domain/tipos'

export function planVacio(): Plan {
  return { fechaInicio: null, aplicaciones: [] }
}

export function crearMascota(opciones: {
  especie?: Especie
  fechaNacimiento: string
  planes?: Partial<Record<PlanId, Plan>>
}): Mascota {
  return {
    id: 'test-id',
    nombre: 'Test',
    especie: opciones.especie ?? 'perro',
    fechaNacimiento: opciones.fechaNacimiento,
    foto: null,
    planes: {
      vacunacion: opciones.planes?.vacunacion ?? planVacio(),
      desparasitacion: opciones.planes?.desparasitacion ?? planVacio(),
    },
    creadaEn: '2020-01-01T00:00:00.000Z',
    actualizadaEn: '2020-01-01T00:00:00.000Z',
  }
}
