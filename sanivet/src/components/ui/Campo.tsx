import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { IconoAlerta, IconoInfo } from '@/components/ui/iconos'

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  aviso?: string
  error?: string
}

/** Label + input + error/aviso/hint. El label va siempre arriba, nunca solo placeholder. */
export default function Campo({ label, hint, aviso, error, id, className = '', ...resto }: CampoProps) {
  const idGenerado = useId()
  const idReal = id ?? idGenerado
  const idMensaje = `${idReal}-mensaje`
  const mensaje = error ?? aviso ?? hint

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={idReal} className="text-sm font-semibold text-text">
        {label}
      </label>
      <input
        id={idReal}
        aria-invalid={error ? true : undefined}
        aria-describedby={mensaje ? idMensaje : undefined}
        className={`h-11 rounded-md border bg-surface px-4 text-base text-text placeholder:text-muted focus:ring-3 focus:ring-primary-soft focus:outline-none ${
          error ? 'border-destructive' : 'border-border focus:border-primary'
        } ${className}`}
        {...resto}
      />
      {error && (
        <p id={idMensaje} className="flex items-center gap-1 text-sm text-destructive">
          <IconoAlerta className="size-4 shrink-0" />
          {error}
        </p>
      )}
      {!error && aviso && (
        <p id={idMensaje} className="flex items-center gap-1 text-sm text-warning">
          <IconoInfo className="size-4 shrink-0" />
          {aviso}
        </p>
      )}
      {!error && !aviso && hint && (
        <p id={idMensaje} className="text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
