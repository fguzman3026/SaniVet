const LADO_MAXIMO = 400
const CALIDAD_JPEG = 0.7

/**
 * Redimensiona un archivo de imagen a un data URL JPEG: máximo 400px en el
 * lado mayor, recortada al cuadrado desde el centro.
 */
export async function redimensionarImagen(archivo: File): Promise<string> {
  const url = URL.createObjectURL(archivo)
  try {
    const imagen = await cargarImagen(url)
    return recortarYCodificar(imagen)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagen = new Image()
    imagen.onload = () => resolve(imagen)
    imagen.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    imagen.src = url
  })
}

function recortarYCodificar(imagen: HTMLImageElement): string {
  const ladoOrigen = Math.min(imagen.naturalWidth, imagen.naturalHeight)
  const xOrigen = (imagen.naturalWidth - ladoOrigen) / 2
  const yOrigen = (imagen.naturalHeight - ladoOrigen) / 2
  const ladoDestino = Math.min(LADO_MAXIMO, ladoOrigen)

  const lienzo = document.createElement('canvas')
  lienzo.width = ladoDestino
  lienzo.height = ladoDestino
  const contexto = lienzo.getContext('2d')
  if (!contexto) throw new Error('No se pudo preparar el lienzo para redimensionar la imagen.')

  contexto.drawImage(imagen, xOrigen, yOrigen, ladoOrigen, ladoOrigen, 0, 0, ladoDestino, ladoDestino)
  return lienzo.toDataURL('image/jpeg', CALIDAD_JPEG)
}
