import type { SVGProps } from 'react'

type IconoProps = SVGProps<SVGSVGElement>

function Svg({ children, ...resto }: IconoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...resto}
    >
      {children}
    </svg>
  )
}

export function IconoCheck(props: IconoProps) {
  return (
    <Svg {...props}>
      <path d="M5 13l4 4L19 7" />
    </Svg>
  )
}

export function IconoAlerta(props: IconoProps) {
  return (
    <Svg {...props}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Svg>
  )
}

export function IconoReloj(props: IconoProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </Svg>
  )
}

export function IconoCirculo(props: IconoProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="5" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconoCargando(props: IconoProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </Svg>
  )
}

export function IconoCerrar(props: IconoProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  )
}

export function IconoInfo(props: IconoProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5v5.5" />
      <circle cx="12" cy="7.7" r="0.75" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconoPerro(props: IconoProps) {
  return (
    <Svg {...props}>
      <ellipse cx="7" cy="11" rx="2.2" ry="3.4" transform="rotate(-20 7 11)" />
      <ellipse cx="17" cy="11" rx="2.2" ry="3.4" transform="rotate(20 17 11)" />
      <circle cx="12" cy="14" r="6.3" />
      <circle cx="9.5" cy="13" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="13" r="0.6" fill="currentColor" stroke="none" />
      <path d="M9.8 16.8q2.2 1.7 4.4 0" />
    </Svg>
  )
}

export function IconoHuella(props: IconoProps) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="16.5" rx="4.3" ry="3.6" fill="currentColor" stroke="none" />
      <ellipse cx="6.3" cy="10.2" rx="2" ry="2.5" transform="rotate(-20 6.3 10.2)" fill="currentColor" stroke="none" />
      <ellipse cx="17.7" cy="10.2" rx="2" ry="2.5" transform="rotate(20 17.7 10.2)" fill="currentColor" stroke="none" />
      <ellipse cx="8.8" cy="5.8" rx="1.7" ry="2.2" transform="rotate(-12 8.8 5.8)" fill="currentColor" stroke="none" />
      <ellipse cx="15.2" cy="5.8" rx="1.7" ry="2.2" transform="rotate(12 15.2 5.8)" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconoSol(props: IconoProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </Svg>
  )
}

export function IconoLuna(props: IconoProps) {
  return (
    <Svg {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </Svg>
  )
}

export function IconoGato(props: IconoProps) {
  return (
    <Svg {...props}>
      <path d="M7 10 8.5 5 11 9.5" />
      <path d="M17 10 15.5 5 13 9.5" />
      <circle cx="12" cy="14" r="6.3" />
      <circle cx="9.5" cy="13" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="13" r="0.6" fill="currentColor" stroke="none" />
      <path d="M5 14.5h3M16 14.5h3M5.3 16.5l2.8-1M18.7 16.5l-2.8-1" />
    </Svg>
  )
}
