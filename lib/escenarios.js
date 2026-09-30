// Fotos de lugares románticos (libres de uso, alojadas en Unsplash) que se
// usan como fondo en la landing y como portada elegible de cada boda.
const u = (id, w = 1800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`

export const ESCENARIOS = [
  { id: 'atardecer', nombre: 'Muelle al atardecer', foto: '1590632396158-a5765ff11bda' },
  { id: 'playa', nombre: 'Playa dorada', foto: '1563196638-8c9457546e5f' },
  { id: 'andes', nombre: 'Machu Picchu', foto: '1587595431973-160d0d94add1' },
  { id: 'acantilado', nombre: 'Frente al mar', foto: '1514432433435-ce2c7903dfba' },
  { id: 'jardin', nombre: 'Jardín y lago', foto: '1622604061314-28cfb3ac2544' },
  { id: 'petalos', nombre: 'Camino de pétalos', foto: '1689455613365-39fa7720e841' },
].map((e) => ({ ...e, url: u(e.foto), mini: u(e.foto, 600) }))

export function escenario(id) {
  return ESCENARIOS.find((e) => e.id === id) || ESCENARIOS[0]
}

export const FOTOS = {
  anillo: u('1542286777-b6499aa99a0a', 1200),
  anilloCaja: u('1579555973297-560c43ca7562', 1200),
  mesa: u('1519225421980-715cb0215aed', 1200),
  centroMesa: u('1598284653127-24eb19dd82db', 1200),
  arreglo: u('1558535284-21b4a3839741', 1200),
  machuPicchu: u('1580619305218-8423a7ef79b4', 1200),
}

export function soles(n) {
  return `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

// WhatsApp de Cherry Bloom Studio para cotizaciones de decoración
// (código de país + número, sin espacios ni "+"). Cámbialo si usas otro.
export const WHATSAPP_NOVIOS = '51947499090'

export function linkWhatsApp(texto) {
  return `https://wa.me/${WHATSAPP_NOVIOS}?text=${encodeURIComponent(texto)}`
}
