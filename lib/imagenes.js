// Utilidades de imágenes para el navegador.

// Lee el ancho y alto de una foto antes de subirla.
export async function medidas(file) {
  const bitmap = await createImageBitmap(file)
  const r = { ancho: bitmap.width, alto: bitmap.height }
  bitmap.close?.()
  return r
}

// Reduce la foto a `max` px en su lado mayor y la guarda como JPG. Así una
// foto de 8 MB del celular queda en unos cientos de KB sin perder calidad visible.
export async function comprimir(file, max = 2400, calidad = 0.85) {
  const bitmap = await createImageBitmap(file)
  const escala = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', calidad))
  return blob || file
}
