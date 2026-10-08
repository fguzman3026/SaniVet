import type { ReactNode } from 'react'

/**
 * Contenedor de pantalla: ancho máximo, padding y fondo.
 * Andamio de la Fase 1 — las pantallas reales lo reemplazan o lo extienden.
 */
export default function Pantalla({
  titulo,
  children,
}: {
  titulo: string
  children?: ReactNode
}) {
  return (
    <main className="min-h-dvh bg-background text-text">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-3xl font-extrabold">{titulo}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  )
}
