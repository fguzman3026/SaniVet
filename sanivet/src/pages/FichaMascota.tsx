import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AvatarMascota from '@/components/AvatarMascota'
import BadgeEstado from '@/components/BadgeEstado'
import DialogoMarcarAplicada from '@/components/DialogoMarcarAplicada'
import LineaDeTiempo from '@/components/LineaDeTiempo'
import PlanNoIniciado from '@/components/PlanNoIniciado'
import Boton from '@/components/ui/Boton'
import Tarjeta from '@/components/ui/Tarjeta'
import { proximaPendiente } from '@/domain/cronograma'
import { fechaSugeridaInicio } from '@/domain/validacion'
import type { Mascota, PlanId } from '@/domain/tipos'
import { edadEnTexto, formatearFecha, formatearRangoFechas, formatearRelativo } from '@/lib/fechas'
import Pantalla from '@/pages/Pantalla'
import { useHoy } from '@/state/HoyProvider'
import { usePets } from '@/state/PetsProvider'
import { useCronograma, useMascota } from '@/state/hooks'

const ETIQUETA_PLAN: Record<PlanId, string> = {
  vacunacion: 'Vacunación',
  desparasitacion: 'Desparasitación',
}

export default function FichaMascota() {
  const { id } = useParams<{ id: string }>()
  const mascota = useMascota(id ?? '')
  const hoy = useHoy()

  if (!mascota) {
    return (
      <Pantalla titulo="Mascota no encontrada">
        <p className="text-muted">Esa mascota no existe.</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-primary hover:text-primary-hover">
          Volver a Inicio
        </Link>
      </Pantalla>
    )
  }

  return (
    <Pantalla titulo={mascota.nombre}>
      <div className="flex items-center gap-4">
        <AvatarMascota nombre={mascota.nombre} foto={mascota.foto} tamaño="lg" />
        <div>
          <p className="text-muted capitalize">{mascota.especie}</p>
          <p className="text-muted">{edadEnTexto(mascota.fechaNacimiento, hoy)}</p>
          <p className="text-sm text-muted">Nació el {formatearFecha(mascota.fechaNacimiento)}</p>
        </div>
      </div>

      <Link
        to={`/mascotas/${mascota.id}/editar`}
        className="mt-4 inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-text transition-colors duration-150 ease-out hover:bg-surface-muted"
      >
        Editar
      </Link>

      <div className="mt-8 flex flex-col gap-10">
        <BloquePlan mascota={mascota} plan="vacunacion" />
        <BloquePlan mascota={mascota} plan="desparasitacion" />
      </div>
    </Pantalla>
  )
}

function BloquePlan({ mascota, plan }: { mascota: Mascota; plan: PlanId }) {
  const hoy = useHoy()
  const { iniciarPlan, marcarAplicada, desmarcarUltima } = usePets()
  const planActual = mascota.planes[plan]
  const cronograma = useCronograma(mascota.id, plan)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [errorMarcar, setErrorMarcar] = useState<string | null>(null)

  if (planActual.fechaInicio === null) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-text">{ETIQUETA_PLAN[plan]}</h2>
        <PlanNoIniciado
          fechaSugerida={fechaSugeridaInicio(mascota.especie, mascota.fechaNacimiento, plan, hoy)}
          onIniciar={(fecha) => iniciarPlan(mascota.id, plan, fecha)}
        />
      </section>
    )
  }

  const proxima = proximaPendiente(cronograma)
  const fechaDosisAnterior = planActual.aplicaciones.at(-1)?.fechaReal ?? null

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-text">{ETIQUETA_PLAN[plan]}</h2>

      {proxima && (
        <Tarjeta className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-text">{proxima.etiqueta}</p>
            <p className="text-sm text-muted">{formatearRangoFechas(proxima.desde, proxima.hasta)}</p>
          </div>
          <div className="flex items-center gap-3">
            <BadgeEstado estado={proxima.estado} etiqueta={formatearRelativo(proxima.desde, hoy)} />
            <Boton
              onClick={() => {
                setErrorMarcar(null)
                setDialogoAbierto(true)
              }}
            >
              Marcar aplicada
            </Boton>
          </div>
        </Tarjeta>
      )}

      <LineaDeTiempo eventos={cronograma} hoy={hoy} />

      {errorMarcar && <p className="text-sm text-destructive">{errorMarcar}</p>}

      {planActual.aplicaciones.length > 0 && (
        <Boton variante="fantasma" className="self-start" onClick={() => desmarcarUltima(mascota.id, plan)}>
          Desmarcar última dosis
        </Boton>
      )}

      {proxima && (
        <DialogoMarcarAplicada
          abierto={dialogoAbierto}
          etiqueta={proxima.etiqueta}
          hoy={hoy}
          fechaMinima={fechaDosisAnterior}
          onCerrar={() => setDialogoAbierto(false)}
          onConfirmar={(fecha) => {
            try {
              marcarAplicada(mascota.id, plan, proxima.orden, fecha, hoy)
              setDialogoAbierto(false)
              setErrorMarcar(null)
            } catch (error) {
              setErrorMarcar(error instanceof Error ? error.message : 'No se pudo marcar la dosis.')
            }
          }}
        />
      )}
    </section>
  )
}
