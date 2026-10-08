import { useEffect, useState } from 'react'
import { IconoLuna, IconoSol } from '@/components/ui/iconos'

type Tema = 'light' | 'dark'

const CLAVE_TEMA = 'sanivet:tema'

function temaInicial(): Tema {
  const guardado = localStorage.getItem(CLAVE_TEMA)
  if (guardado === 'light' || guardado === 'dark') return guardado
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Alterna modo claro/oscuro a mano, por encima de la preferencia del sistema. Persiste la elección. */
export default function ToggleTema() {
  const [tema, setTema] = useState<Tema>(temaInicial)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem(CLAVE_TEMA, tema)
  }, [tema])

  return (
    <button
      type="button"
      onClick={() => setTema((t) => (t === 'dark' ? 'light' : 'dark'))}
      aria-label={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-150 ease-out hover:bg-surface-muted hover:text-text"
    >
      {tema === 'dark' ? <IconoSol className="size-5" /> : <IconoLuna className="size-5" />}
    </button>
  )
}
