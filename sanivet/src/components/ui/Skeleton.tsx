interface SkeletonProps {
  className?: string
}

/** Mismo tamaño y forma que el contenido real que va a reemplazar. Nunca un spinner centrado de página. */
export default function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-md bg-surface-muted ${className}`} aria-hidden="true" />
}
