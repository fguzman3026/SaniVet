const CLASES_AVATAR = ['bg-avatar-1', 'bg-avatar-2', 'bg-avatar-3', 'bg-avatar-4', 'bg-avatar-5', 'bg-avatar-6']

/** El mismo nombre da siempre el mismo color: hash estable sobre la paleta de 6 tonos del design-system. */
export function colorDeNombre(nombre: string): string {
  let hash = 0
  for (let i = 0; i < nombre.length; i++) {
    hash = (hash * 31 + nombre.charCodeAt(i)) | 0
  }
  const indice = Math.abs(hash) % CLASES_AVATAR.length
  return CLASES_AVATAR[indice] ?? 'bg-avatar-1'
}
