import type { ReactNode } from 'react'

export type TonoBadge = 'success' | 'warning' | 'destructive' | 'neutral' | 'primary'

interface BadgeProps {
  tono?: TonoBadge
  children: ReactNode
}

const CLASES_POR_TONO: Record<TonoBadge, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  destructive: 'bg-destructive-soft text-destructive',
  neutral: 'bg-neutral-soft text-neutral',
  primary: 'bg-primary-soft text-primary',
}

/** Pill con ícono + texto. El estado nunca se comunica solo con color. */
export default function Badge({ tono = 'neutral', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${CLASES_POR_TONO[tono]}`}>
      {children}
    </span>
  )
}
