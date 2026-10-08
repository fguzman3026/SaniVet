import { parseStore, storeVacio } from '@/storage/parseStore'
import type { SaniVetStore } from '@/domain/tipos'

const CLAVE_STORE = 'sanivet:store'
const CLAVE_BACKUP = 'sanivet:store:backup'

export interface ResultadoLectura {
  store: SaniVetStore
  recuperadoDeBackup: boolean
}

/**
 * Nunca borra datos ante un problema de lectura: si el JSON es inválido o la
 * forma no es la esperada, copia el valor crudo a `sanivet:store:backup` y
 * arranca con un store vacío.
 */
export function leerStore(): ResultadoLectura {
  const crudo = localStorage.getItem(CLAVE_STORE)
  if (crudo === null) return { store: storeVacio(), recuperadoDeBackup: false }

  try {
    const parseado = parseStore(JSON.parse(crudo))
    if (parseado !== null) return { store: parseado, recuperadoDeBackup: false }
  } catch {
    // JSON inválido: cae al respaldo de abajo.
  }

  respaldar(crudo)
  return { store: storeVacio(), recuperadoDeBackup: true }
}

function respaldar(crudo: string): void {
  try {
    localStorage.setItem(CLAVE_BACKUP, crudo)
  } catch {
    // Si ni el respaldo entra (cuota llena), no hay nada más por hacer.
  }
}

export function escribirStore(store: SaniVetStore): boolean {
  try {
    localStorage.setItem(CLAVE_STORE, JSON.stringify(store))
    return true
  } catch {
    return false
  }
}
