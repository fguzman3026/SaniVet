export type Especie = 'perro' | 'gato'
export type PlanId = 'vacunacion' | 'desparasitacion'

/** Fecha como 'YYYY-MM-DD' en hora local. Nunca Date ni ISO con zona:
 *  un timestamp UTC corre las fechas un día según el huso. */
export type FechaISO = string

export interface Aplicacion {
  orden: number // posición en el plan, base 0
  fechaReal: FechaISO
}

export interface Plan {
  fechaInicio: FechaISO | null // null = plan no iniciado
  aplicaciones: Aplicacion[] // ordenado por `orden`, sin huecos
}

export interface Mascota {
  id: string // crypto.randomUUID()
  nombre: string
  especie: Especie
  fechaNacimiento: FechaISO
  foto: string | null // data URL (JPEG base64), ya redimensionada
  planes: Record<PlanId, Plan>
  creadaEn: string // ISO completo, para ordenar
  actualizadaEn: string
}

export interface SaniVetStore {
  version: 1
  mascotas: Mascota[]
}

export type Vacuna = 'quintuple' | 'sextuple' | 'antirrabica' | 'triple_felina' | 'refuerzo_anual'

export type Intervalo =
  | { tipo: 'dias'; cantidad: number }
  | { tipo: 'meses'; cantidad: number }
  | { tipo: 'anios'; cantidad: number }

export interface PasoPlan {
  etiqueta: string // 'Quíntuple (2ª dosis)'
  vacunas: Vacuna[] // vacío para desparasitación
  desdeAnterior: Intervalo | null // null solo en el paso 0 (= fecha de inicio)
  duracionDias: number // 1 para una dosis, 3 para una tanda
}

export interface DefinicionPlan {
  pasos: PasoPlan[] // el plan inicial, finito
  repeticion: {
    paso: PasoPlan
    cada: Intervalo
  } | null
  edadMinimaDias: number
}

export type Estado = 'aplicada' | 'vencida' | 'proxima' | 'programada'

export interface EventoCronograma {
  orden: number
  etiqueta: string
  desde: FechaISO // día 1
  hasta: FechaISO // día 1 + duracionDias - 1
  estado: Estado
  fechaReal: FechaISO | null
  esProyeccionRecalculada: boolean // la anterior se aplicó en fecha distinta a la estimada
}

export interface ItemAgenda {
  mascotaId: string
  plan: PlanId
  evento: EventoCronograma
}
