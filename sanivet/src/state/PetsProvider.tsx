import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  desmarcarUltima as desmarcarUltimaDominio,
  iniciarPlan as iniciarPlanDominio,
  marcarAplicada as marcarAplicadaDominio,
} from '@/domain/mutaciones'
import { leerStore, escribirStore } from '@/storage/store'
import type { FechaISO, Mascota, PlanId } from '@/domain/tipos'

const DEBOUNCE_MS = 300

type AccionMascotas =
  | { tipo: 'agregar'; mascota: Mascota }
  | { tipo: 'actualizar'; mascota: Mascota }
  | { tipo: 'eliminar'; id: string }
  | { tipo: 'reemplazarTodo'; mascotas: Mascota[] }

function reducer(mascotas: Mascota[], accion: AccionMascotas): Mascota[] {
  switch (accion.tipo) {
    case 'agregar':
      return [...mascotas, accion.mascota]
    case 'actualizar':
      return mascotas.map((m) => (m.id === accion.mascota.id ? accion.mascota : m))
    case 'eliminar':
      return mascotas.filter((m) => m.id !== accion.id)
    case 'reemplazarTodo':
      return accion.mascotas
  }
}

interface PetsContextValor {
  mascotas: Mascota[]
  recuperadoDeBackup: boolean
  errorDeCuota: boolean
  agregar(mascota: Mascota): void
  editar(mascota: Mascota): void
  eliminar(id: string): void
  iniciarPlan(id: string, plan: PlanId, fechaInicio: FechaISO): void
  marcarAplicada(id: string, plan: PlanId, orden: number, fechaReal: FechaISO, hoy: FechaISO): void
  desmarcarUltima(id: string, plan: PlanId): void
}

const PetsContext = createContext<PetsContextValor | null>(null)

export function PetsProvider({ children }: { children: ReactNode }) {
  const [{ store: storeInicial, recuperadoDeBackup }] = useState(() => leerStore())
  const [mascotas, dispatch] = useReducer(reducer, storeInicial.mascotas)
  const [errorDeCuota, setErrorDeCuota] = useState(false)

  const ultimoGuardadoRef = useRef<Mascota[]>(storeInicial.mascotas)
  const esPrimerRenderRef = useRef(true)

  useEffect(() => {
    // La lectura inicial ya está persistida: no hace falta reescribirla al montar.
    if (esPrimerRenderRef.current) {
      esPrimerRenderRef.current = false
      return
    }

    const idTimeout = setTimeout(() => {
      const ok = escribirStore({ version: 1, mascotas })
      if (ok) {
        ultimoGuardadoRef.current = mascotas
        setErrorDeCuota(false)
      } else {
        setErrorDeCuota(true)
        dispatch({ tipo: 'reemplazarTodo', mascotas: ultimoGuardadoRef.current })
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(idTimeout)
  }, [mascotas])

  const agregar = useCallback((mascota: Mascota) => dispatch({ tipo: 'agregar', mascota }), [])

  const editar = useCallback(
    (mascota: Mascota) => dispatch({ tipo: 'actualizar', mascota: { ...mascota, actualizadaEn: new Date().toISOString() } }),
    [],
  )

  const eliminar = useCallback((id: string) => dispatch({ tipo: 'eliminar', id }), [])

  const iniciarPlan = useCallback(
    (id: string, plan: PlanId, fechaInicio: FechaISO) => {
      const mascota = mascotas.find((m) => m.id === id)
      if (!mascota) return
      dispatch({ tipo: 'actualizar', mascota: iniciarPlanDominio(mascota, plan, fechaInicio) })
    },
    [mascotas],
  )

  const marcarAplicada = useCallback(
    (id: string, plan: PlanId, orden: number, fechaReal: FechaISO, hoy: FechaISO) => {
      const mascota = mascotas.find((m) => m.id === id)
      if (!mascota) return
      // Puede lanzar ReglaDeNegocioError: se propaga a quien llamó para mostrarlo en la UI.
      dispatch({ tipo: 'actualizar', mascota: marcarAplicadaDominio(mascota, plan, orden, fechaReal, hoy) })
    },
    [mascotas],
  )

  const desmarcarUltima = useCallback(
    (id: string, plan: PlanId) => {
      const mascota = mascotas.find((m) => m.id === id)
      if (!mascota) return
      dispatch({ tipo: 'actualizar', mascota: desmarcarUltimaDominio(mascota, plan) })
    },
    [mascotas],
  )

  const valor: PetsContextValor = {
    mascotas,
    recuperadoDeBackup,
    errorDeCuota,
    agregar,
    editar,
    eliminar,
    iniciarPlan,
    marcarAplicada,
    desmarcarUltima,
  }

  return <PetsContext.Provider value={valor}>{children}</PetsContext.Provider>
}

export function usePets(): PetsContextValor {
  const valor = useContext(PetsContext)
  if (valor === null) throw new Error('usePets debe usarse dentro de PetsProvider.')
  return valor
}
