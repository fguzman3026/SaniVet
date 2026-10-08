import { describe, expect, it } from 'vitest'
import { definicionPara, vacunacionPerroAdulto, vacunacionPerroCachorro } from '@/domain/protocolo'
import { crearMascota, planVacio } from '@/domain/__tests__/ayuda'

describe('definicionPara — bifurcación de perro', () => {
  it('exactamente 6 meses al inicio cae en la rama adulto', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2025-07-01',
      planes: { vacunacion: { ...planVacio(), fechaInicio: '2026-01-01' } },
    })
    expect(definicionPara(mascota, 'vacunacion', '2026-01-01')).toBe(vacunacionPerroAdulto)
  })

  it('un día menos de 6 meses al inicio cae en la rama cachorro', () => {
    const mascota = crearMascota({
      fechaNacimiento: '2025-07-01',
      planes: { vacunacion: { ...planVacio(), fechaInicio: '2025-12-31' } },
    })
    expect(definicionPara(mascota, 'vacunacion', '2025-12-31')).toBe(vacunacionPerroCachorro)
  })

  it('la rama se evalúa contra la fecha de inicio, no contra hoy', () => {
    // Empezó de cachorro (3 meses) pero "hoy" ya es adulto: debe seguir en la rama cachorro.
    const mascota = crearMascota({
      fechaNacimiento: '2025-01-01',
      planes: { vacunacion: { ...planVacio(), fechaInicio: '2025-04-01' } },
    })
    expect(definicionPara(mascota, 'vacunacion', '2026-06-01')).toBe(vacunacionPerroCachorro)
  })
})
