import { describe, expect, it } from 'vitest'
import { parseStore, storeVacio } from '@/storage/parseStore'

function mascotaValida() {
  return {
    id: 'abc',
    nombre: 'Fido',
    especie: 'perro',
    fechaNacimiento: '2024-01-01',
    foto: null,
    planes: {
      vacunacion: { fechaInicio: '2024-02-15', aplicaciones: [{ orden: 0, fechaReal: '2024-02-15' }] },
      desparasitacion: { fechaInicio: null, aplicaciones: [] },
    },
    creadaEn: '2024-01-01T00:00:00.000Z',
    actualizadaEn: '2024-01-01T00:00:00.000Z',
  }
}

describe('storeVacio', () => {
  it('devuelve un store válido sin mascotas', () => {
    expect(storeVacio()).toEqual({ version: 1, mascotas: [] })
  })
})

describe('parseStore', () => {
  it('acepta un store con una mascota bien formada', () => {
    const store = { version: 1, mascotas: [mascotaValida()] }
    expect(parseStore(store)).toEqual(store)
  })

  it('acepta un store vacío', () => {
    expect(parseStore({ version: 1, mascotas: [] })).toEqual({ version: 1, mascotas: [] })
  })

  it('rechaza null, arrays y primitivos', () => {
    expect(parseStore(null)).toBeNull()
    expect(parseStore([])).toBeNull()
    expect(parseStore('sanivet')).toBeNull()
    expect(parseStore(42)).toBeNull()
  })

  it('rechaza una versión desconocida', () => {
    expect(parseStore({ version: 2, mascotas: [] })).toBeNull()
  })

  it('rechaza si `mascotas` no es un array', () => {
    expect(parseStore({ version: 1, mascotas: {} })).toBeNull()
  })

  it('rechaza una mascota con especie inválida', () => {
    const mascota = { ...mascotaValida(), especie: 'loro' }
    expect(parseStore({ version: 1, mascotas: [mascota] })).toBeNull()
  })

  it('rechaza una mascota con fechaNacimiento mal formada', () => {
    const mascota = { ...mascotaValida(), fechaNacimiento: '01/01/2024' }
    expect(parseStore({ version: 1, mascotas: [mascota] })).toBeNull()
  })

  it('rechaza un plan sin `aplicaciones`', () => {
    const mascota = mascotaValida()
    mascota.planes.vacunacion = { fechaInicio: '2024-02-15' } as never
    expect(parseStore({ version: 1, mascotas: [mascota] })).toBeNull()
  })

  it('rechaza una aplicación sin `fechaReal`', () => {
    const mascota = mascotaValida()
    mascota.planes.vacunacion.aplicaciones = [{ orden: 0 } as never]
    expect(parseStore({ version: 1, mascotas: [mascota] })).toBeNull()
  })

  it('rechaza si falta un campo requerido de la mascota', () => {
    const { nombre, ...sinNombre } = mascotaValida()
    expect(parseStore({ version: 1, mascotas: [sinNombre] })).toBeNull()
    expect(nombre).toBe('Fido') // evita el warning de variable sin uso
  })
})
