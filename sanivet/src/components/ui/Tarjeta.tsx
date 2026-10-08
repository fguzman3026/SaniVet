import type { HTMLAttributes, ReactNode } from 'react'

interface TarjetaProps extends HTMLAttributes<HTMLDivElement> {
  clickeable?: boolean
  children: ReactNode
}

export default function Tarjeta({ clickeable = false, className = '', children, ...resto }: TarjetaProps) {
  const clases = [
    'rounded-lg bg-surface p-4 shadow-sm sm:p-6',
    clickeable ? 'cursor-pointer transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={clases} {...resto}>
      {children}
    </div>
  )
}
