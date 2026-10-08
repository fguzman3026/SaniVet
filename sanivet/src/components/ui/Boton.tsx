import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { IconoCargando, IconoCheck } from '@/components/ui/iconos'

type VarianteBoton = 'primario' | 'secundario' | 'fantasma' | 'destructivo'
type EstadoBoton = 'inactivo' | 'pendiente' | 'exito' | 'error'
type TamañoBoton = 'normal' | 'grande'

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton
  /** Fondo destructivo sólido en vez de suave — solo para el botón de confirmar en el modal de "Eliminar mascota". */
  solido?: boolean
  estado?: EstadoBoton
  tamaño?: TamañoBoton
  children: ReactNode
}

const CLASES_POR_VARIANTE: Record<VarianteBoton, string> = {
  primario: 'bg-primary text-white hover:bg-primary-hover',
  secundario: 'border border-border bg-surface text-text hover:bg-surface-muted',
  fantasma: 'bg-transparent text-text hover:bg-surface-muted',
  destructivo: 'bg-destructive-soft text-destructive hover:bg-destructive hover:text-white',
}

const CLASES_DESTRUCTIVO_SOLIDO = 'bg-destructive text-white hover:bg-destructive/90'
const CLASES_ESTADO_ERROR = 'bg-destructive text-white hover:bg-destructive'

/**
 * Siempre refleja el estado de su acción: ver el modelo de interacción
 * del spec técnico (pendiente / éxito / error, nunca cara de inactivo
 * mientras la acción corre).
 */
export default function Boton({
  variante = 'primario',
  solido = false,
  estado = 'inactivo',
  tamaño = 'normal',
  className = '',
  disabled,
  children,
  ...resto
}: BotonProps) {
  const estaPendiente = estado === 'pendiente'

  const clasesColor =
    estado === 'error'
      ? CLASES_ESTADO_ERROR
      : variante === 'destructivo' && solido
        ? CLASES_DESTRUCTIVO_SOLIDO
        : CLASES_POR_VARIANTE[variante]

  const clases = [
    'inline-flex items-center justify-center gap-2 rounded-md px-5 font-semibold',
    'transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60',
    tamaño === 'grande' ? 'h-12' : 'h-11',
    clasesColor,
    className,
  ].join(' ')

  return (
    <button type="button" {...resto} className={clases} disabled={disabled || estaPendiente}>
      {estaPendiente && <IconoCargando className="size-4 animate-spin" />}
      {estado === 'exito' && <IconoCheck className="size-4" />}
      {children}
    </button>
  )
}
