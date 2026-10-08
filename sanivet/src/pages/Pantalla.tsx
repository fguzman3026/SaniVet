import type { ReactNode } from 'react'
import ToggleTema from '@/components/ToggleTema'

/**
 * Contenedor de pantalla: ancho máximo, padding y fondo.
 * Andamio de la Fase 1 — las pantallas reales lo reemplazan o lo extienden.
 */
export default function Pantalla({
  titulo,
  icono,
  children,
}: {
  titulo: string
  icono?: ReactNode
  children?: ReactNode
}) {
  return (
    <main className="min-h-dvh bg-background text-text">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold">
            {icono}
            {titulo}
          </h1>
          <ToggleTema />
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  )
}
