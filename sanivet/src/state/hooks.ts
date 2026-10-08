import { useMemo } from 'react'
import { agenda, derivarCronograma } from '@/domain/cronograma'
import { useHoy } from '@/state/HoyProvider'
import { usePets } from '@/state/PetsProvider'
import type { EventoCronograma, ItemAgenda, Mascota, PlanId } from '@/domain/tipos'

export function useMascotas(): Mascota[] {
  return usePets().mascotas
}

export function useMascota(id: string): Mascota | undefined {
  const { mascotas } = usePets()
  return useMemo(() => mascotas.find((m) => m.id === id), [mascotas, id])
}

export function useAgenda(): ItemAgenda[] {
  const { mascotas } = usePets()
  const hoy = useHoy()
  return useMemo(() => agenda(mascotas, hoy), [mascotas, hoy])
}

export function useCronograma(id: string, plan: PlanId): EventoCronograma[] {
  const mascota = useMascota(id)
  const hoy = useHoy()
  return useMemo(() => (mascota ? derivarCronograma(mascota, plan, hoy) : []), [mascota, plan, hoy])
}
