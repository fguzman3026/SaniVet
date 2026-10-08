import { IconoGato, IconoPerro } from '@/components/ui/iconos'
import type { Especie } from '@/domain/tipos'

interface SelectorEspecieProps {
  valor: Especie | null
  onCambiar: (especie: Especie) => void
}

const OPCIONES = [
  { especie: 'perro' as const, etiqueta: 'Perro', Icono: IconoPerro },
  { especie: 'gato' as const, etiqueta: 'Gato', Icono: IconoGato },
]

/** Dos botones grandes lado a lado, no un <select>. */
export default function SelectorEspecie({ valor, onCambiar }: SelectorEspecieProps) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Especie">
      {OPCIONES.map(({ especie, etiqueta, Icono }) => {
        const seleccionado = valor === especie
        return (
          <button
            key={especie}
            type="button"
            role="radio"
            aria-checked={seleccionado}
            onClick={() => onCambiar(especie)}
            className={`flex h-24 flex-col items-center justify-center gap-2 rounded-md border-2 transition-colors duration-150 ease-out ${
              seleccionado ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-surface text-text hover:bg-surface-muted'
            }`}
          >
            <Icono className="size-7" />
            <span className="font-semibold">{etiqueta}</span>
          </button>
        )
      })}
    </div>
  )
}
