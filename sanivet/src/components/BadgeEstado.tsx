import Badge from '@/components/ui/Badge'
import type { TonoBadge } from '@/components/ui/Badge'
import { IconoAlerta, IconoCheck, IconoCirculo, IconoReloj } from '@/components/ui/iconos'
import type { Estado } from '@/domain/tipos'

interface BadgeEstadoProps {
  estado: Estado
  etiqueta: string
}

const CONFIGURACION: Record<Estado, { tono: TonoBadge; Icono: typeof IconoCheck }> = {
  aplicada: { tono: 'success', Icono: IconoCheck },
  vencida: { tono: 'destructive', Icono: IconoAlerta },
  proxima: { tono: 'warning', Icono: IconoReloj },
  programada: { tono: 'neutral', Icono: IconoCirculo },
}

/** Los 4 estados de una dosis, legibles sin depender solo del color: ícono + texto siempre. */
export default function BadgeEstado({ estado, etiqueta }: BadgeEstadoProps) {
  const { tono, Icono } = CONFIGURACION[estado]
  return (
    <Badge tono={tono}>
      <Icono className="size-3.5" />
      {etiqueta}
    </Badge>
  )
}
