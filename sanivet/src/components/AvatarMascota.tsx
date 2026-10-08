import { colorDeNombre } from '@/lib/colorDeNombre'

type TamañoAvatar = 'sm' | 'md' | 'lg'

interface AvatarMascotaProps {
  nombre: string
  foto: string | null
  tamaño?: TamañoAvatar
}

const CLASES_TAMAÑO: Record<TamañoAvatar, string> = {
  sm: 'size-8 text-sm',
  md: 'size-12 text-lg',
  lg: 'size-24 text-3xl',
}

/** Foto o inicial sobre color derivado del nombre. Siempre circular, siempre cuadrada de origen. */
export default function AvatarMascota({ nombre, foto, tamaño = 'md' }: AvatarMascotaProps) {
  const clasesBase = `flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-extrabold text-text ${CLASES_TAMAÑO[tamaño]}`

  if (foto) {
    return <img src={foto} alt={nombre} className={`${clasesBase} object-cover`} />
  }

  return (
    <div className={`${clasesBase} ${colorDeNombre(nombre)}`} aria-hidden="true">
      {nombre.charAt(0).toUpperCase()}
    </div>
  )
}
