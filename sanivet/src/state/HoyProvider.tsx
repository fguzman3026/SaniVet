import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { hoyISO } from '@/lib/fechas'
import type { FechaISO } from '@/domain/tipos'

const HoyContext = createContext<FechaISO | null>(null)

/**
 * Expone "hoy" y lo refresca al volver la pestaña a primer plano y a la
 * medianoche local. El dominio nunca llama a `new Date()` por su cuenta
 * (ver regla 3 del spec técnico): todo lo que depende de la fecha actual
 * pasa por este `hoy`, así queda determinístico y testeable.
 */
export function HoyProvider({ children }: { children: ReactNode }) {
  const [hoy, setHoy] = useState<FechaISO>(() => hoyISO())

  useEffect(() => {
    const actualizar = () => setHoy(hoyISO())

    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'visible') actualizar()
    }
    document.addEventListener('visibilitychange', alCambiarVisibilidad)

    let idTimeout: ReturnType<typeof setTimeout>

    const programarProximaMedianoche = () => {
      const ahora = new Date()
      const proximaMedianoche = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 5)
      const demoraMs = proximaMedianoche.getTime() - ahora.getTime()
      idTimeout = setTimeout(() => {
        actualizar()
        programarProximaMedianoche()
      }, demoraMs)
    }
    programarProximaMedianoche()

    return () => {
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
      clearTimeout(idTimeout)
    }
  }, [])

  return <HoyContext.Provider value={hoy}>{children}</HoyContext.Provider>
}

export function useHoy(): FechaISO {
  const hoy = useContext(HoyContext)
  if (hoy === null) throw new Error('useHoy debe usarse dentro de HoyProvider.')
  return hoy
}
