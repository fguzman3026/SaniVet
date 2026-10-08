import { describe, expect, it } from 'vitest'
import { derivarCronograma, estadoDe } from '@/domain/cronograma'
import { crearMascota, planVacio } from '@/domain/__tests__/ayuda'

describe('derivarCronograma — vacunación perro cachorro', () => {
  it('5 dosis en el orden y los intervalos correctos, más el refuerzo anual', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2025-10-01',
      planes: { vacunacion: { ...planVacio(), fechaInicio: '2026-01-01' } },
    })
    const eventos = derivarCronograma(mascota, 'vacunacion', '2026-01-01')

    expect(eventos.map((e) => [e.etiqueta, e.desde])).toEqual([
      ['Quíntuple (1ª dosis)', '2026-01-01'],
      ['Quíntuple (2ª dosis)', '2026-01-22'],
      ['Séxtuple (1ª dosis)', '2026-02-12'],
      ['Séxtuple (2ª dosis)', '2026-03-05'],
      ['Antirrábica', '2026-03-26'],
      ['Refuerzo anual', '2027-03-26'],
    ])
  })
})

describe('derivarCronograma — vacunación perro adulto', () => {
  it('3 dosis (séxtuple x2, antirrábica) más el refuerzo anual', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2019-01-01',
      planes: { vacunacion: { ...planVacio(), fechaInicio: '2026-01-01' } },
    })
    const eventos = derivarCronograma(mascota, 'vacunacion', '2026-01-01')

    expect(eventos.map((e) => [e.etiqueta, e.desde])).toEqual([
      ['Séxtuple (1ª dosis)', '2026-01-01'],
      ['Séxtuple (2ª dosis)', '2026-01-22'],
      ['Antirrábica', '2026-02-12'],
      ['Refuerzo anual', '2027-02-12'],
    ])
  })
})

describe('derivarCronograma — vacunación gato', () => {
  it('3 dosis con intervalo mensual más el refuerzo anual', () => {
    const mascota = crearMascota({
      especie: 'gato',
      fechaNacimiento: '2025-01-01',
      planes: { vacunacion: { ...planVacio(), fechaInicio: '2026-01-01' } },
    })
    const eventos = derivarCronograma(mascota, 'vacunacion', '2026-01-01')

    expect(eventos.map((e) => [e.etiqueta, e.desde])).toEqual([
      ['Triple felina (1ª dosis)', '2026-01-01'],
      ['Triple felina (2ª dosis)', '2026-02-01'],
      ['Antirrábica', '2026-03-01'],
      ['Refuerzo anual', '2027-03-01'],
    ])
  })
})

describe('derivarCronograma — desparasitación', () => {
  it('tanda 1 de 3 días, tanda 2 a +15 del día 1, mantenimiento cada 6 meses, todas con duracionDias 3', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2020-01-01',
      planes: { desparasitacion: { ...planVacio(), fechaInicio: '2026-01-01' } },
    })
    const eventos = derivarCronograma(mascota, 'desparasitacion', '2026-01-01')

    expect(eventos.map((e) => [e.etiqueta, e.desde, e.hasta])).toEqual([
      ['Tanda inicial', '2026-01-01', '2026-01-03'],
      ['Refuerzo', '2026-01-16', '2026-01-18'],
      ['Mantenimiento', '2026-07-16', '2026-07-18'],
      ['Mantenimiento', '2027-01-16', '2027-01-18'],
      ['Mantenimiento', '2027-07-16', '2027-07-18'],
    ])
  })
})

describe('derivarCronograma — recálculo', () => {
  it('una dosis aplicada 10 días tarde corre todas las siguientes 10 días', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2020-01-01',
      planes: {
        desparasitacion: { fechaInicio: '2026-01-01', aplicaciones: [{ orden: 0, fechaReal: '2026-01-11' }] },
      },
    })
    const eventos = derivarCronograma(mascota, 'desparasitacion', '2026-02-01')

    // Teórico sin atraso: 2026-01-16. Con 10 días de atraso: 2026-01-26.
    expect(eventos[1]?.desde).toBe('2026-01-26')
    expect(eventos[1]?.esProyeccionRecalculada).toBe(true)
  })

  it('recálculo con adelanto: una dosis aplicada antes de lo estimado también corre el resto', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2020-01-01',
      planes: {
        desparasitacion: {
          fechaInicio: '2026-01-01',
          aplicaciones: [
            { orden: 0, fechaReal: '2026-01-01' }, // en fecha
            { orden: 1, fechaReal: '2026-01-09' }, // 7 días antes de lo estimado (2026-01-16)
          ],
        },
      },
    })
    const eventos = derivarCronograma(mascota, 'desparasitacion', '2026-02-01')

    expect(eventos[1]?.esProyeccionRecalculada).toBe(false) // la dosis 0 se aplicó en fecha
    // Teórico sin adelanto: 2026-07-16. Con 7 días de adelanto: 2026-07-09.
    expect(eventos[2]?.desde).toBe('2026-07-09')
    expect(eventos[2]?.esProyeccionRecalculada).toBe(true)
  })
})

describe('derivarCronograma — bordes de calendario', () => {
  it('inicio el 31 de enero con intervalo mensual cae en el 28 de febrero (año no bisiesto)', () => {
    const mascota = crearMascota({
      especie: 'gato',
      fechaNacimiento: '2024-01-01',
      planes: { vacunacion: { ...planVacio(), fechaInicio: '2026-01-31' } },
    })
    const eventos = derivarCronograma(mascota, 'vacunacion', '2026-01-31')
    expect(eventos[1]?.desde).toBe('2026-02-28')
  })

  it('inicio el 31 de enero con intervalo mensual cae en el 29 de febrero (año bisiesto)', () => {
    const mascota = crearMascota({
      especie: 'gato',
      fechaNacimiento: '2022-01-01',
      planes: { vacunacion: { ...planVacio(), fechaInicio: '2024-01-31' } },
    })
    const eventos = derivarCronograma(mascota, 'vacunacion', '2024-01-31')
    expect(eventos[1]?.desde).toBe('2024-02-29')
  })

  it('cruce de año', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2025-10-01',
      planes: { vacunacion: { ...planVacio(), fechaInicio: '2025-12-20' } },
    })
    const eventos = derivarCronograma(mascota, 'vacunacion', '2025-12-20')
    expect(eventos[1]?.desde).toBe('2026-01-10')
  })
})

describe('estadoDe', () => {
  const hoy = '2026-01-10'
  it('vencida si desde < hoy', () => {
    expect(estadoDe('2026-01-09', hoy)).toBe('vencida')
  })
  it('proxima en el borde inferior (0 días)', () => {
    expect(estadoDe('2026-01-10', hoy)).toBe('proxima')
  })
  it('proxima en el borde superior (7 días)', () => {
    expect(estadoDe('2026-01-17', hoy)).toBe('proxima')
  })
  it('programada a partir de 8 días', () => {
    expect(estadoDe('2026-01-18', hoy)).toBe('programada')
  })
})

describe('derivarCronograma — estado aplicada', () => {
  it('una dosis con aplicación registrada siempre figura como aplicada', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2020-01-01',
      planes: {
        desparasitacion: { fechaInicio: '2020-02-01', aplicaciones: [{ orden: 0, fechaReal: '2020-02-01' }] },
      },
    })
    const eventos = derivarCronograma(mascota, 'desparasitacion', '2026-01-01')
    expect(eventos[0]?.estado).toBe('aplicada')
    expect(eventos[0]?.fechaReal).toBe('2020-02-01')
  })
})

describe('derivarCronograma — plan no iniciado', () => {
  it('devuelve un array vacío cuando fechaInicio es null', () => {
    const mascota = crearMascota({ fechaNacimiento: '2024-01-01' })
    expect(derivarCronograma(mascota, 'vacunacion', '2026-01-01')).toEqual([])
    expect(derivarCronograma(mascota, 'desparasitacion', '2026-01-01')).toEqual([])
  })
})

describe('derivarCronograma — horizonte', () => {
  it('corta a 24 meses pero siempre incluye al menos una dosis pendiente', () => {
    const mascota = crearMascota({
      fechaNacimiento: '1989-01-01',
      planes: { desparasitacion: { ...planVacio(), fechaInicio: '1990-01-01' } },
    })
    const eventos = derivarCronograma(mascota, 'desparasitacion', '2026-01-01')

    expect(eventos.length).toBeGreaterThan(0)
    expect(eventos.length).toBeLessThan(200)
    expect(eventos.some((e) => e.fechaReal === null)).toBe(true)
  })
})
