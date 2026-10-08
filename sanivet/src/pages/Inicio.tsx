import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import FilaAgenda from '@/components/FilaAgenda'
import TarjetaMascota from '@/components/TarjetaMascota'
import { IconoCheck, IconoPerro, IconoReloj } from '@/components/ui/iconos'
import { derivarCronograma, proximaPendiente } from '@/domain/cronograma'
import type { PlanId } from '@/domain/tipos'
import { formatearFecha } from '@/lib/fechas'
import Pantalla from '@/pages/Pantalla'
import { useHoy } from '@/state/HoyProvider'
import { usePets } from '@/state/PetsProvider'
import { useAgenda, useMascotas } from '@/state/hooks'

const PLANES: PlanId[] = ['vacunacion', 'desparasitacion']

const CLASE_BOTON_AGREGAR =
  'inline-flex h-12 items-center rounded-md bg-primary px-5 font-semibold text-white transition-colors duration-150 ease-out hover:bg-primary-hover'

export default function Inicio() {
  const mascotas = useMascotas()
  const agenda = useAgenda()
  const hoy = useHoy()
  const { marcarAplicada } = usePets()

  const hayPlanIniciado = mascotas.some((m) => PLANES.some((plan) => m.planes[plan].fechaInicio !== null))
  const todoAlDia = hayPlanIniciado && agenda.length > 0 && agenda.every((item) => item.evento.estado === 'programada')

  // Para cada (mascota, plan), el `orden` de su próxima dosis pendiente: solo esa fila de la
  // agenda puede marcarse como aplicada directamente (el resto son dosis futuras, no la próxima).
  const ordenProximaPorPlan = new Map<string, number>()
  for (const mascota of mascotas) {
    for (const plan of PLANES) {
      const proxima = proximaPendiente(derivarCronograma(mascota, plan, hoy))
      if (proxima) ordenProximaPorPlan.set(`${mascota.id}:${plan}`, proxima.orden)
    }
  }

  return (
    <Pantalla titulo="SaniVet">
      <p className="text-muted">El plan sanitario de tus mascotas, calculado solo.</p>
      <Link to="/mascotas/nueva" className={`mt-6 ${CLASE_BOTON_AGREGAR}`}>
        Agregar mascota
      </Link>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-text">Próximas aplicaciones</h2>

        {mascotas.length === 0 ? (
          <EstadoVacio
            Icono={IconoPerro}
            titulo="Todavía no cargaste ninguna mascota"
            texto="Con la fecha de nacimiento y las de inicio, la app arma el calendario sanitario completo."
          >
            <Link to="/mascotas/nueva" className={CLASE_BOTON_AGREGAR}>
              Agregar mascota
            </Link>
          </EstadoVacio>
        ) : !hayPlanIniciado ? (
          <EstadoVacio Icono={IconoReloj} titulo="Ninguna mascota tiene planes iniciados todavía">
            <Link to={`/mascotas/${mascotas[0]?.id}`} className="font-semibold text-primary hover:text-primary-hover">
              Ir a la ficha de {mascotas[0]?.nombre}
            </Link>
          </EstadoVacio>
        ) : todoAlDia ? (
          <EstadoVacio Icono={IconoCheck} titulo="Todo al día">
            {(() => {
              const primero = agenda[0]
              if (!primero) return null
              const mascota = mascotas.find((m) => m.id === primero.mascotaId)
              if (!mascota) return null
              return (
                <p className="text-muted">
                  La próxima es la de {mascota.nombre}, el {formatearFecha(primero.evento.desde)}.
                </p>
              )
            })()}
          </EstadoVacio>
        ) : (
          <ol className="mt-4 flex flex-col gap-3">
            {agenda.map((item) => {
              const mascota = mascotas.find((m) => m.id === item.mascotaId)
              if (!mascota) return null
              return (
                <FilaAgenda
                  key={`${item.mascotaId}:${item.plan}:${item.evento.orden}`}
                  mascota={mascota}
                  item={item}
                  hoy={hoy}
                  marcable={ordenProximaPorPlan.get(`${item.mascotaId}:${item.plan}`) === item.evento.orden}
                  onMarcarAplicada={(fecha) => marcarAplicada(mascota.id, item.plan, item.evento.orden, fecha, hoy)}
                />
              )
            })}
          </ol>
        )}
      </section>

      {mascotas.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-text">Mis mascotas</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {mascotas.map((mascota) => (
              <TarjetaMascota key={mascota.id} mascota={mascota} hoy={hoy} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 text-center text-xs text-muted">Tus datos se guardan solo en este navegador.</p>
    </Pantalla>
  )
}

function EstadoVacio({
  Icono,
  titulo,
  texto,
  children,
}: {
  Icono: typeof IconoPerro
  titulo: string
  texto?: string
  children?: ReactNode
}) {
  return (
    <div className="mt-4 flex flex-col items-center gap-3 rounded-lg bg-surface p-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icono className="size-7" />
      </span>
      <p className="text-lg font-bold text-text">{titulo}</p>
      {texto && <p className="text-muted">{texto}</p>}
      {children}
    </div>
  )
}
