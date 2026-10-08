import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconoCerrar } from '@/components/ui/iconos'

interface ModalProps {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
}

const SELECTOR_FOCOABLES = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/** Centrado en escritorio, hoja pegada abajo en móvil. Cierra con Escape y clic en el telón; atrapa el foco adentro. */
export default function Modal({ abierto, titulo, onCerrar, children }: ModalProps) {
  const refDialogo = useRef<HTMLDivElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    if (!abierto) return

    const elementoActivoPrevio = document.activeElement as HTMLElement | null
    refDialogo.current?.focus()

    const alPresionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        onCerrar()
        return
      }
      if (evento.key !== 'Tab' || !refDialogo.current) return

      const focoables = refDialogo.current.querySelectorAll<HTMLElement>(SELECTOR_FOCOABLES)
      if (focoables.length === 0) return
      const primero = focoables[0] as HTMLElement
      const ultimo = focoables[focoables.length - 1] as HTMLElement

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', alPresionarTecla)
    return () => {
      document.removeEventListener('keydown', alPresionarTecla)
      elementoActivoPrevio?.focus()
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-[rgba(46,42,38,0.4)]" onClick={onCerrar} />
      <div
        ref={refDialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className="relative z-10 max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-xl bg-surface p-6 shadow-lg outline-none sm:rounded-xl"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id={idTitulo} className="font-display text-xl font-extrabold text-text">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-md p-1 text-muted transition-colors duration-150 ease-out hover:bg-surface-muted hover:text-text"
          >
            <IconoCerrar className="size-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
