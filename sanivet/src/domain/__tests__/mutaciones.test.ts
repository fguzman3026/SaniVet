import { describe, expect, it } from 'vitest'
import { ajustarPlanTrasEdicion, desmarcarUltima, marcarAplicada, ReglaDeNegocioError } from '@/domain/mutaciones'
import { crearMascota, planVacio } from '@/domain/__tests__/ayuda'

describe('marcarAplicada', () => {
  it('rechaza un orden salteado', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2020-01-01',
      planes: { desparasitacion: { ...planVacio(), fechaInicio: '2026-01-01' } },
    })
    expect(() => marcarAplicada(mascota, 'desparasitacion', 1, '2026-01-05', '2026-01-10')).toThrow(ReglaDeNegocioError)
  })

  it('rechaza una fecha futura', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2020-01-01',
      planes: { desparasitacion: { ...planVacio(), fechaInicio: '2026-01-01' } },
    })
    expect(() => marcarAplicada(mascota, 'desparasitacion', 0, '2026-02-01', '2026-01-10')).toThrow(ReglaDeNegocioError)
  })

  it('rechaza una fecha anterior a la de la dosis previa', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2020-01-01',
      planes: {
        desparasitacion: { fechaInicio: '2026-01-01', aplicaciones: [{ orden: 0, fechaReal: '2026-01-10' }] },
      },
    })
    expect(() => marcarAplicada(mascota, 'desparasitacion', 1, '2026-01-05', '2026-01-20')).toThrow(ReglaDeNegocioError)
  })

  it('acepta la próxima dosis pendiente con una fecha válida', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2020-01-01',
      planes: { desparasitacion: { ...planVacio(), fechaInicio: '2026-01-01' } },
    })
    const resultado = marcarAplicada(mascota, 'desparasitacion', 0, '2026-01-02', '2026-01-10')
    expect(resultado.planes.desparasitacion.aplicaciones).toEqual([{ orden: 0, fechaReal: '2026-01-02' }])
  })
})

describe('desmarcarUltima', () => {
  it('es un no-op sobre un plan sin aplicaciones', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2020-01-01',
      planes: { desparasitacion: { ...planVacio(), fechaInicio: '2026-01-01' } },
    })
    expect(desmarcarUltima(mascota, 'desparasitacion')).toBe(mascota)
  })

  it('quita la última aplicación', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2020-01-01',
      planes: {
        desparasitacion: {
          fechaInicio: '2026-01-01',
          aplicaciones: [
            { orden: 0, fechaReal: '2026-01-01' },
            { orden: 1, fechaReal: '2026-01-16' },
          ],
        },
      },
    })
    const resultado = desmarcarUltima(mascota, 'desparasitacion')
    expect(resultado.planes.desparasitacion.aplicaciones).toEqual([{ orden: 0, fechaReal: '2026-01-01' }])
  })
})

describe('ajustarPlanTrasEdicion', () => {
  it('descarta las aplicaciones que quedaron fuera de rango al pasar de cachorro a adulto', () => {
    // A la fecha de inicio original (2026-01-01) el perro tenía 3 meses: rama cachorro, 5 pasos.
    // Se edita fechaNacimiento para que a esa misma fecha de inicio tenga 12 meses: rama adulto, 3 pasos.
    const mascota = crearMascota({
      fechaNacimiento: '2025-01-01',
      planes: {
        vacunacion: {
          fechaInicio: '2026-01-01',
          aplicaciones: [
            { orden: 0, fechaReal: '2026-01-01' },
            { orden: 1, fechaReal: '2026-01-22' },
            { orden: 2, fechaReal: '2026-02-12' },
            { orden: 3, fechaReal: '2026-03-05' },
            { orden: 4, fechaReal: '2026-03-26' },
          ],
        },
      },
    })

    const resultado = ajustarPlanTrasEdicion(mascota, 'vacunacion', '2026-04-01')

    expect(resultado.aplicacionesDescartadas).toBe(2)
    expect(resultado.mascota.planes.vacunacion.aplicaciones).toEqual([
      { orden: 0, fechaReal: '2026-01-01' },
      { orden: 1, fechaReal: '2026-01-22' },
      { orden: 2, fechaReal: '2026-02-12' },
    ])
  })

  it('no descarta nada si la rama no cambió', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2020-01-01', // perro claramente adulto en cualquier escenario
      planes: {
        vacunacion: {
          fechaInicio: '2026-01-01',
          aplicaciones: [{ orden: 0, fechaReal: '2026-01-01' }],
        },
      },
    })

    const resultado = ajustarPlanTrasEdicion(mascota, 'vacunacion', '2026-04-01')

    expect(resultado.aplicacionesDescartadas).toBe(0)
    expect(resultado.mascota).toBe(mascota)
  })

  it('es un no-op si el plan no tiene aplicaciones', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2025-01-01',
      planes: { vacunacion: { ...planVacio(), fechaInicio: '2026-01-01' } },
    })

    const resultado = ajustarPlanTrasEdicion(mascota, 'vacunacion', '2026-04-01')

    expect(resultado.aplicacionesDescartadas).toBe(0)
    expect(resultado.mascota).toBe(mascota)
  })

  it('es un no-op si el plan no está iniciado', () => {
    const mascota = crearMascota({ fechaNacimiento: '2025-01-01' })
    const resultado = ajustarPlanTrasEdicion(mascota, 'vacunacion', '2026-04-01')
    expect(resultado).toEqual({ mascota, aplicacionesDescartadas: 0 })
  })
})
