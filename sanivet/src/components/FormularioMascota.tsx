import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Boton from '@/components/ui/Boton'
import Campo from '@/components/ui/Campo'
import Modal from '@/components/ui/Modal'
import SelectorEspecie from '@/components/ui/SelectorEspecie'
import { ajustarPlanTrasEdicion } from '@/domain/mutaciones'
import { fechaSugeridaInicio, validarFechaInicio, validarFechaNacimiento, validarNombre } from '@/domain/validacion'
import type { Especie, FechaISO, Mascota, Plan } from '@/domain/tipos'
import { edadEnTexto } from '@/lib/fechas'
import { redimensionarImagen } from '@/lib/imagen'
import { escribirStore } from '@/storage/store'
import { useHoy } from '@/state/HoyProvider'
import { usePets } from '@/state/PetsProvider'
import { useMascotas } from '@/state/hooks'

const TIPOS_IMAGEN_VALIDOS = ['image/jpeg', 'image/png', 'image/webp']
const MENSAJE_CUOTA =
  'No pudimos guardar la foto: el navegador se quedó sin espacio. Probá con una imagen más liviana o eliminá fotos de otras mascotas.'
const DEMORA_EXITO_MS = 450

interface ErroresFormulario {
  nombre?: string
  especie?: string
  fechaNacimiento?: string
  vacunacion?: string
  desparasitacion?: string
}

interface AvisosFormulario {
  nombre?: string
  vacunacion?: string
  desparasitacion?: string
}

type Fase = 'formulario' | 'confirmarRecalculo' | 'aviso' | 'guardando'

interface FormularioMascotaProps {
  mascotaExistente?: Mascota
}

function planVacio(): Plan {
  return { fechaInicio: null, aplicaciones: [] }
}

export default function FormularioMascota({ mascotaExistente }: FormularioMascotaProps) {
  const navegar = useNavigate()
  const hoy = useHoy()
  const { agregar, editar } = usePets()
  const mascotas = useMascotas()

  const [nombre, setNombre] = useState(mascotaExistente?.nombre ?? '')
  const [especie, setEspecie] = useState<Especie | null>(mascotaExistente?.especie ?? null)
  const [fechaNacimiento, setFechaNacimiento] = useState<FechaISO | ''>(mascotaExistente?.fechaNacimiento ?? '')
  const [foto, setFoto] = useState<string | null>(mascotaExistente?.foto ?? null)
  const [errorFoto, setErrorFoto] = useState<string | null>(null)
  const [fechaInicioVacunacionManual, setFechaInicioVacunacionManual] = useState<FechaISO | ''>(
    mascotaExistente?.planes.vacunacion.fechaInicio ?? '',
  )
  const [fechaInicioDesparasitacionManual, setFechaInicioDesparasitacionManual] = useState<FechaISO | ''>(
    mascotaExistente?.planes.desparasitacion.fechaInicio ?? '',
  )
  const [tocoVacunacion, setTocoVacunacion] = useState(mascotaExistente !== undefined)
  const [tocoDesparasitacion, setTocoDesparasitacion] = useState(mascotaExistente !== undefined)

  const [errores, setErrores] = useState<ErroresFormulario>({})
  const [avisos, setAvisos] = useState<AvisosFormulario>({})
  const [fase, setFase] = useState<Fase>('formulario')
  const [mensajesAviso, setMensajesAviso] = useState<string[]>([])

  const inputFotoRef = useRef<HTMLInputElement>(null)
  const mascotaPendienteRef = useRef<Mascota | null>(null)

  // El botón Guardar pasa a check verde un instante antes de navegar a la
  // ficha — nunca queda con cara de inactivo mientras la acción "corre".
  useEffect(() => {
    if (fase !== 'guardando') return
    const id = setTimeout(() => {
      const mascotaFinal = mascotaPendienteRef.current
      if (mascotaFinal) navegar(`/mascotas/${mascotaFinal.id}`)
    }, DEMORA_EXITO_MS)
    return () => clearTimeout(id)
  }, [fase, navegar])

  // Fechas de inicio sugeridas (solo en alta, y mientras el usuario no las haya tocado a mano):
  // se derivan en cada render en vez de sincronizarse con un efecto.
  const fechaInicioVacunacion =
    tocoVacunacion || !especie || !fechaNacimiento ? fechaInicioVacunacionManual : fechaSugeridaInicio(especie, fechaNacimiento, 'vacunacion', hoy)
  const fechaInicioDesparasitacion =
    tocoDesparasitacion || !especie || !fechaNacimiento
      ? fechaInicioDesparasitacionManual
      : fechaSugeridaInicio(especie, fechaNacimiento, 'desparasitacion', hoy)

  async function alElegirFoto(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!archivo) return

    if (!TIPOS_IMAGEN_VALIDOS.includes(archivo.type)) {
      setErrorFoto('Ese archivo no es una imagen.')
      return
    }

    try {
      setFoto(await redimensionarImagen(archivo))
      setErrorFoto(null)
    } catch {
      setErrorFoto('No pudimos procesar esa imagen. Probá con otra.')
    }
  }

  function validarTodo(): boolean {
    const nuevosErrores: ErroresFormulario = {}
    const nuevosAvisos: AvisosFormulario = {}

    if (!especie) nuevosErrores.especie = 'Elegí una especie.'

    const nombresExistentes = mascotas.filter((m) => m.id !== mascotaExistente?.id).map((m) => m.nombre)
    const resultadoNombre = validarNombre(nombre, nombresExistentes)
    if (resultadoNombre.errores[0]) nuevosErrores.nombre = resultadoNombre.errores[0]
    if (resultadoNombre.avisos[0]) nuevosAvisos.nombre = resultadoNombre.avisos[0]

    if (!fechaNacimiento) {
      nuevosErrores.fechaNacimiento = 'La fecha de nacimiento es requerida.'
    } else {
      const resultadoFecha = validarFechaNacimiento(fechaNacimiento, hoy)
      if (resultadoFecha.errores[0]) nuevosErrores.fechaNacimiento = resultadoFecha.errores[0]
    }

    if (especie && fechaNacimiento) {
      if (fechaInicioVacunacion) {
        const r = validarFechaInicio(especie, fechaNacimiento, 'vacunacion', fechaInicioVacunacion, hoy)
        if (r.errores[0]) nuevosErrores.vacunacion = r.errores[0]
        if (r.avisos[0]) nuevosAvisos.vacunacion = r.avisos[0]
      }
      if (fechaInicioDesparasitacion) {
        const r = validarFechaInicio(especie, fechaNacimiento, 'desparasitacion', fechaInicioDesparasitacion, hoy)
        if (r.errores[0]) nuevosErrores.desparasitacion = r.errores[0]
        if (r.avisos[0]) nuevosAvisos.desparasitacion = r.avisos[0]
      }
    }

    setErrores(nuevosErrores)
    setAvisos(nuevosAvisos)
    return Object.keys(nuevosErrores).length === 0
  }

  function construirMascotaFinal(): Mascota {
    const ahora = new Date().toISOString()
    const nombreLimpio = nombre.trim()
    const especieFinal = especie as Especie // validarTodo() ya garantizó que no es null

    if (mascotaExistente) {
      return {
        ...mascotaExistente,
        nombre: nombreLimpio,
        especie: especieFinal,
        fechaNacimiento: fechaNacimiento as FechaISO,
        foto,
        planes: {
          vacunacion: { ...mascotaExistente.planes.vacunacion, fechaInicio: fechaInicioVacunacion || null },
          desparasitacion: { ...mascotaExistente.planes.desparasitacion, fechaInicio: fechaInicioDesparasitacion || null },
        },
        actualizadaEn: ahora,
      }
    }

    return {
      id: crypto.randomUUID(),
      nombre: nombreLimpio,
      especie: especieFinal,
      fechaNacimiento: fechaNacimiento as FechaISO,
      foto,
      planes: {
        vacunacion: { ...planVacio(), fechaInicio: fechaInicioVacunacion || null },
        desparasitacion: { ...planVacio(), fechaInicio: fechaInicioDesparasitacion || null },
      },
      creadaEn: ahora,
      actualizadaEn: ahora,
    }
  }

  function necesitaConfirmacion(mascotaFinal: Mascota): boolean {
    if (!mascotaExistente) return false
    const cambioFechaNacimiento = mascotaFinal.fechaNacimiento !== mascotaExistente.fechaNacimiento
    const cambioVacunacion = mascotaFinal.planes.vacunacion.fechaInicio !== mascotaExistente.planes.vacunacion.fechaInicio
    const cambioDesparasitacion =
      mascotaFinal.planes.desparasitacion.fechaInicio !== mascotaExistente.planes.desparasitacion.fechaInicio

    const afectaVacunacion = (cambioFechaNacimiento || cambioVacunacion) && mascotaExistente.planes.vacunacion.aplicaciones.length > 0
    const afectaDesparasitacion = cambioDesparasitacion && mascotaExistente.planes.desparasitacion.aplicaciones.length > 0

    return afectaVacunacion || afectaDesparasitacion
  }

  function alEnviar(evento: FormEvent) {
    evento.preventDefault()
    if (!validarTodo()) return

    const mascotaFinal = construirMascotaFinal()
    if (necesitaConfirmacion(mascotaFinal)) {
      mascotaPendienteRef.current = mascotaFinal
      setFase('confirmarRecalculo')
      return
    }
    guardarYNavegar(mascotaFinal)
  }

  function confirmarRecalculo() {
    let mascotaAjustada = mascotaPendienteRef.current
    if (!mascotaAjustada) return

    let totalDescartadas = 0
    for (const plan of ['vacunacion', 'desparasitacion'] as const) {
      const resultado = ajustarPlanTrasEdicion(mascotaAjustada, plan, hoy)
      mascotaAjustada = resultado.mascota
      totalDescartadas += resultado.aplicacionesDescartadas
    }

    if (totalDescartadas > 0) {
      mascotaPendienteRef.current = mascotaAjustada
      setMensajesAviso([
        `Se quitaron ${totalDescartadas} ${totalDescartadas === 1 ? 'dosis que ya no corresponde' : 'dosis que ya no corresponden'} al nuevo plan de ${mascotaAjustada.nombre}.`,
      ])
      setFase('aviso')
      return
    }

    guardarYNavegar(mascotaAjustada)
  }

  function guardarYNavegar(mascotaFinal: Mascota) {
    const mascotasActualizadas = mascotaExistente
      ? mascotas.map((m) => (m.id === mascotaFinal.id ? mascotaFinal : m))
      : [...mascotas, mascotaFinal]

    let mascotaAPersistir = mascotaFinal
    const avisosFinales: string[] = []

    if (mascotaFinal.foto !== null) {
      const escrituraOk = escribirStore({ version: 1, mascotas: mascotasActualizadas })
      if (!escrituraOk) {
        mascotaAPersistir = { ...mascotaFinal, foto: null }
        const escrituraSinFotoOk = escribirStore({
          version: 1,
          mascotas: mascotasActualizadas.map((m) => (m.id === mascotaAPersistir.id ? mascotaAPersistir : m)),
        })
        if (escrituraSinFotoOk) avisosFinales.push(MENSAJE_CUOTA)
      }
    }

    if (mascotaExistente) editar(mascotaAPersistir)
    else agregar(mascotaAPersistir)

    mascotaPendienteRef.current = mascotaAPersistir

    if (avisosFinales.length > 0) {
      setMensajesAviso(avisosFinales)
      setFase('aviso')
      return
    }

    setFase('guardando')
  }

  function continuarTrasAviso() {
    const mascotaFinal = mascotaPendienteRef.current
    if (!mascotaFinal) return
    if (fase === 'aviso' && mensajesAviso.some((m) => m === MENSAJE_CUOTA)) {
      setFase('guardando')
      return
    }
    guardarYNavegar(mascotaFinal)
  }

  const edad = fechaNacimiento && fechaNacimiento <= hoy ? edadEnTexto(fechaNacimiento, hoy) : null

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-6" noValidate>
      <Campo
        label="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        error={errores.nombre}
        aviso={!errores.nombre ? avisos.nombre : undefined}
        required
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-text">Especie</span>
        <SelectorEspecie valor={especie} onCambiar={setEspecie} />
        {errores.especie && <p className="text-sm text-destructive">{errores.especie}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Campo
          label="Fecha de nacimiento"
          type="date"
          value={fechaNacimiento}
          onChange={(e) => setFechaNacimiento(e.target.value)}
          error={errores.fechaNacimiento}
          required
        />
        {edad && <p className="text-sm text-muted">{edad}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-text">Foto</span>
        <div className="flex items-center gap-4">
          {foto ? (
            <img src={foto} alt="" className="size-20 rounded-full object-cover" />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full bg-surface-muted text-xs text-muted">Sin foto</div>
          )}
          <div className="flex flex-col gap-2">
            <Boton type="button" variante="secundario" onClick={() => inputFotoRef.current?.click()}>
              {foto ? 'Cambiar foto' : 'Elegir foto'}
            </Boton>
            {foto && (
              <Boton type="button" variante="fantasma" onClick={() => setFoto(null)}>
                Quitar foto
              </Boton>
            )}
          </div>
        </div>
        <input
          ref={inputFotoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={alElegirFoto}
          className="hidden"
        />
        {errorFoto && <p className="text-sm text-destructive">{errorFoto}</p>}
      </div>

      <Campo
        label="Inicio de vacunación"
        type="date"
        value={fechaInicioVacunacion}
        onChange={(e) => {
          setTocoVacunacion(true)
          setFechaInicioVacunacionManual(e.target.value)
        }}
        error={errores.vacunacion}
        aviso={!errores.vacunacion ? avisos.vacunacion : undefined}
      />

      <Campo
        label="Inicio de desparasitación"
        type="date"
        value={fechaInicioDesparasitacion}
        onChange={(e) => {
          setTocoDesparasitacion(true)
          setFechaInicioDesparasitacionManual(e.target.value)
        }}
        error={errores.desparasitacion}
        aviso={!errores.desparasitacion ? avisos.desparasitacion : undefined}
      />

      <Boton type="submit" tamaño="grande" estado={fase === 'guardando' ? 'exito' : 'inactivo'} disabled={fase === 'guardando'}>
        Guardar
      </Boton>

      <Modal abierto={fase === 'confirmarRecalculo'} titulo="Confirmar cambio" onCerrar={() => setFase('formulario')}>
        <p className="text-text">
          Esto va a recalcular las dosis pendientes de {mascotaExistente?.nombre}. Las que ya marcaste como aplicadas no se tocan.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setFase('formulario')}>
            Cancelar
          </Boton>
          <Boton onClick={confirmarRecalculo}>Confirmar</Boton>
        </div>
      </Modal>

      <Modal abierto={fase === 'aviso'} titulo="Importante" onCerrar={continuarTrasAviso}>
        {mensajesAviso.map((mensaje) => (
          <p key={mensaje} className="text-text">
            {mensaje}
          </p>
        ))}
        <div className="mt-4 flex justify-end">
          <Boton onClick={continuarTrasAviso}>Entendido</Boton>
        </div>
      </Modal>
    </form>
  )
}
