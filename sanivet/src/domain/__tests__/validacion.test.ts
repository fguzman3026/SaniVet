import { describe, expect, it } from 'vitest'
import {
  fechaSugeridaInicio,
  validarFechaAplicacion,
  validarFechaInicio,
  validarFechaNacimiento,
  validarNombre,
} from '@/domain/validacion'

describe('validarNombre', () => {
  it('rechaza nombres demasiado cortos o demasiado largos', () => {
    expect(validarNombre('F', []).errores).toHaveLength(1)
    expect(validarNombre('F'.repeat(41), []).errores).toHaveLength(1)
    expect(validarNombre('Fido', []).errores).toHaveLength(0)
  })

  it('avisa (sin bloquear) si el nombre ya existe', () => {
    const resultado = validarNombre('Fido', ['Fido', 'Luna'])
    expect(resultado.errores).toHaveLength(0)
    expect(resultado.avisos).toHaveLength(1)
  })

  it('recorta espacios antes de comparar', () => {
    expect(validarNombre('  Fido  ', ['Fido']).avisos).toHaveLength(1)
  })
})

describe('validarFechaNacimiento', () => {
  const hoy = '2026-01-01'

  it('rechaza una fecha futura', () => {
    expect(validarFechaNacimiento('2026-01-02', hoy).errores).toHaveLength(1)
  })

  it('rechaza más de 30 años atrás', () => {
    expect(validarFechaNacimiento('1995-01-01', hoy).errores).toHaveLength(1)
  })

  it('acepta una fecha pasada razonable', () => {
    expect(validarFechaNacimiento('2024-06-01', hoy).errores).toHaveLength(0)
  })
})

describe('fechaSugeridaInicio', () => {
  it('devuelve la fecha de edad mínima cuando es posterior a hoy', () => {
    // Perro nacido hoy: edad mínima de vacunación son 45 días, cae después de hoy.
    expect(fechaSugeridaInicio('perro', '2026-01-01', 'vacunacion', '2026-01-01')).toBe('2026-02-15')
  })

  it('devuelve hoy cuando la mascota ya alcanzó la edad mínima', () => {
    expect(fechaSugeridaInicio('perro', '2020-01-01', 'vacunacion', '2026-01-01')).toBe('2026-01-01')
  })
})

describe('validarFechaInicio', () => {
  const hoy = '2026-01-01'

  it('rechaza una fecha de inicio anterior a la de nacimiento', () => {
    const resultado = validarFechaInicio('perro', '2026-01-01', 'vacunacion', '2025-12-31', hoy)
    expect(resultado.errores).toHaveLength(1)
  })

  it('rechaza una fecha futura si la mascota ya alcanzó la edad mínima', () => {
    const resultado = validarFechaInicio('perro', '2020-01-01', 'vacunacion', '2026-02-01', hoy)
    expect(resultado.errores).toHaveLength(1)
  })

  it('permite agendar a futuro si todavía no alcanza la edad mínima', () => {
    // Nació hoy: a los 45 días recién alcanza la edad mínima, y esa fecha es futura.
    const resultado = validarFechaInicio('perro', '2026-01-01', 'vacunacion', '2026-02-10', hoy)
    expect(resultado.errores).toHaveLength(0)
  })

  it('avisa (sin bloquear) si la fecha es anterior a la edad mínima', () => {
    const resultado = validarFechaInicio('perro', '2026-01-01', 'vacunacion', '2026-01-01', hoy)
    expect(resultado.errores).toHaveLength(0)
    expect(resultado.avisos).toHaveLength(1)
  })
})

describe('validarFechaAplicacion', () => {
  it('rechaza una fecha futura', () => {
    expect(validarFechaAplicacion('2026-01-02', '2026-01-01', null).errores).toHaveLength(1)
  })

  it('rechaza una fecha anterior a la dosis previa', () => {
    expect(validarFechaAplicacion('2026-01-01', '2026-01-10', '2026-01-05').errores).toHaveLength(1)
  })

  it('acepta una fecha válida', () => {
    expect(validarFechaAplicacion('2026-01-05', '2026-01-10', '2026-01-01').errores).toHaveLength(0)
  })
})
