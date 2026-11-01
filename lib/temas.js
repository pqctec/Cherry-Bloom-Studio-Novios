// Modelos de invitación: cada uno define su paleta, tipografías y colores
// elegibles por la pareja. La página del invitado se pinta con variables CSS
// (--t-*) que salen de aquí, así todas las secciones combinan con el modelo.

const GF = 'https://fonts.googleapis.com/css2?display=swap&family='

export const MODELOS = [
  {
    id: 'clasica',
    nombre: 'Clásica con foto',
    descripcion: 'Su foto o un escenario de fondo, letras doradas. La de siempre.',
    fuentes: null,
    display: '"Cormorant Garamond", Georgia, serif',
    script: '"Great Vibes", cursive',
    body: 'Jost, system-ui, sans-serif',
    base: { bg: '#FBF6EF', text: '#3E2A23', muted: '#8A736A', card: '#FFFFFF', line: '#EADBC8', alt: '#F3E8DA' },
    paletas: [
      { id: 'terracota', nombre: 'Terracota', accent: '#A8553A', soft: '#EFD3C8' },
      { id: 'vino', nombre: 'Vino', accent: '#7A2E3A', soft: '#E8C9CE' },
      { id: 'salvia', nombre: 'Salvia', accent: '#5E7050', soft: '#DCE5D3' },
      { id: 'azul', nombre: 'Azul noche', accent: '#2F4A6B', soft: '#D3DEEA' },
    ],
  },
  {
    id: 'jardin',
    nombre: 'Jardín acuarela',
    descripcion: 'Romántico, con flores pintadas en acuarela.',
    fuentes: 'Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Great+Vibes&family=Jost:wght@400;500',
    display: '"Cormorant Garamond", Georgia, serif',
    script: '"Great Vibes", cursive',
    body: 'Jost, system-ui, sans-serif',
    base: { bg: '#FBF6F0', text: '#4A3229', muted: '#9A7B6C', card: '#FFFAF5', line: '#EEDFD2', alt: '#F5EAE0' },
    paletas: [
      { id: 'rosa', nombre: 'Rosa', accent: '#8A4B3C', soft: '#E8B4B0' },
      { id: 'lila', nombre: 'Lila', accent: '#6D4A7A', soft: '#D9B8D6' },
      { id: 'durazno', nombre: 'Durazno', accent: '#93562C', soft: '#F2C48D' },
      { id: 'celeste', nombre: 'Celeste', accent: '#3F5F86', soft: '#B9C8E0' },
    ],
  },
  {
    id: 'blacktie',
    nombre: 'Black Tie',
    descripcion: 'Negro con dorado, marco art déco. Para bodas de etiqueta.',
    fuentes: 'Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400',
    display: 'Cinzel, Georgia, serif',
    script: '"Cormorant Garamond", Georgia, serif',
    body: '"Cormorant Garamond", Georgia, serif',
    oscuro: true,
    base: { bg: '#0F0E0D', text: '#EFE6D4', muted: '#B9AE98', card: '#191715', line: '#3A3326', alt: '#141210' },
    paletas: [
      { id: 'oro', nombre: 'Dorado', accent: '#C9A962', soft: '#C9A962', onAccent: '#0F0E0D' },
      { id: 'plata', nombre: 'Plata', accent: '#CFCFCF', soft: '#CFCFCF', onAccent: '#0F0E0D' },
      { id: 'rosegold', nombre: 'Oro rosa', accent: '#D4A08A', soft: '#D4A08A', onAccent: '#0F0E0D' },
      { id: 'esmeralda', nombre: 'Esmeralda', accent: '#8FB59A', soft: '#8FB59A', onAccent: '#0F0E0D' },
    ],
  },
  {
    id: 'boho',
    nombre: 'Boho terracota',
    descripcion: 'Arco, pampas y tonos tierra. Para bodas de campo.',
    fuentes: 'Marcellus&family=Allura&family=Jost:wght@400;500',
    display: 'Marcellus, Georgia, serif',
    script: 'Allura, cursive',
    body: 'Jost, system-ui, sans-serif',
    base: { bg: '#EFE3D3', text: '#5A3A2C', muted: '#8F6A57', card: '#F8F0E6', line: '#D3BCA6', alt: '#E8D9C6' },
    paletas: [
      { id: 'terracota', nombre: 'Terracota', accent: '#A4532F', soft: '#E9C7B0' },
      { id: 'cafe', nombre: 'Café', accent: '#7A5A40', soft: '#E0CDB8' },
      { id: 'canela', nombre: 'Canela', accent: '#946240', soft: '#ECD2B8' },
      { id: 'oliva', nombre: 'Oliva', accent: '#68744F', soft: '#D9DEC7' },
    ],
  },
  {
    id: 'editorial',
    nombre: 'Editorial minimal',
    descripcion: 'Moderno, como portada de revista: tipografía grande y mucho aire.',
    fuentes: 'Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,600;1,6..96,400&family=Jost:wght@400;500',
    display: '"Bodoni Moda", Georgia, serif',
    script: '"Bodoni Moda", Georgia, serif',
    body: 'Jost, system-ui, sans-serif',
    base: { bg: '#FAFAF7', text: '#151515', muted: '#6B6B6B', card: '#FFFFFF', line: '#DADAD4', alt: '#F1F1EC' },
    paletas: [
      { id: 'rojo', nombre: 'Rojo', accent: '#B23A2B', soft: '#F1D9D5', boton: '#151515' },
      { id: 'verde', nombre: 'Verde', accent: '#2F5D50', soft: '#D6E4DF', boton: '#151515' },
      { id: 'morado', nombre: 'Morado', accent: '#5B4B8A', soft: '#E0DCEE', boton: '#151515' },
      { id: 'negro', nombre: 'Solo negro', accent: '#151515', soft: '#E4E4E0', boton: '#151515' },
    ],
  },
  {
    id: 'mar',
    nombre: 'Frente al mar',
    descripcion: 'Olas, arena y sol. Para bodas de playa o destino.',
    fuentes: 'Playfair+Display:ital,wght@0,400;0,600;1,400&family=Allura&family=Jost:wght@400;500',
    display: '"Playfair Display", Georgia, serif',
    script: 'Allura, cursive',
    body: 'Jost, system-ui, sans-serif',
    base: { bg: '#F6EFE4', text: '#24425A', muted: '#5F788A', card: '#FFFFFF', line: '#DCE3E6', alt: '#EAF1F3' },
    paletas: [
      { id: 'oceano', nombre: 'Océano', accent: '#3A7191', soft: '#CFE1EA' },
      { id: 'turquesa', nombre: 'Turquesa', accent: '#23807B', soft: '#CBE8E5' },
      { id: 'atardecer', nombre: 'Atardecer', accent: '#B0613F', soft: '#F3D8C8' },
      { id: 'lavanda', nombre: 'Lavanda', accent: '#56679F', soft: '#D9DDF0' },
    ],
  },
  {
    id: 'olivo',
    nombre: 'Olivo y salvia',
    descripcion: 'Botánico y sereno, con ramas de olivo.',
    fuentes: 'EB+Garamond:ital,wght@0,400;0,500;1,400&family=Pinyon+Script',
    display: '"EB Garamond", Georgia, serif',
    script: '"Pinyon Script", cursive',
    body: '"EB Garamond", Georgia, serif',
    base: { bg: '#F3F1EA', text: '#3C4234', muted: '#6F7862', card: '#FFFFFF', line: '#E4E1D6', alt: '#E9E8DE' },
    paletas: [
      { id: 'olivo', nombre: 'Olivo', accent: '#5F6E4E', soft: '#D8DECB' },
      { id: 'eucalipto', nombre: 'Eucalipto', accent: '#4F6B5A', soft: '#D2E0D6' },
      { id: 'trigo', nombre: 'Trigo', accent: '#7D6E50', soft: '#E6DEC9' },
      { id: 'pizarra', nombre: 'Pizarra', accent: '#55627A', soft: '#D9DEE8' },
    ],
  },
  {
    id: 'andino',
    nombre: 'Andino',
    descripcion: 'Franja de tejido andino y colores vivos. Para Cusco, el Valle o con orgullo peruano.',
    fuentes: 'Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Jost:wght@400;500',
    display: 'Fraunces, Georgia, serif',
    script: 'Fraunces, Georgia, serif',
    body: 'Jost, system-ui, sans-serif',
    base: { bg: '#FBF4E8', text: '#3B2420', muted: '#8B6A55', card: '#FFFBF4', line: '#E6D3B6', alt: '#F5EAD8' },
    paletas: [
      { id: 'magenta', nombre: 'Magenta', accent: '#B0264F', soft: '#F2D3DC' },
      { id: 'rojo', nombre: 'Rojo ladrillo', accent: '#B4472A', soft: '#F2D6CC' },
      { id: 'azul', nombre: 'Azul', accent: '#1F5F8B', soft: '#D2E2EE' },
      { id: 'morado', nombre: 'Morado', accent: '#6B2D5C', soft: '#E7D3E1' },
    ],
  },
  {
    id: 'sobre',
    nombre: 'Sobre con sello',
    descripcion: 'La invitación llega en un sobre con el monograma de la pareja y se abre al tocar el sello.',
    fuentes: 'Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Great+Vibes&family=Jost:wght@400;500',
    display: '"Cormorant Garamond", Georgia, serif',
    script: '"Great Vibes", cursive',
    body: 'Jost, system-ui, sans-serif',
    sobrePorDefecto: true,
    base: { bg: '#EFE5D7', text: '#4A3229', muted: '#7D6253', card: '#FFFBF6', line: '#DCCAB4', alt: '#E9DCCB' },
    paletas: [
      { id: 'vino', nombre: 'Lacre vino', accent: '#8E2F2F', soft: '#E9CFCB' },
      { id: 'oro', nombre: 'Lacre dorado', accent: '#9C7A34', soft: '#EDDDB8' },
      { id: 'verde', nombre: 'Lacre verde', accent: '#3F5A4A', soft: '#D3DFD6' },
      { id: 'azul', nombre: 'Lacre azul', accent: '#2E3A5C', soft: '#D3D8E6' },
    ],
  },
]

export function modelo(id) {
  return MODELOS.find((m) => m.id === id) || MODELOS[0]
}

export function paleta(m, id) {
  return m.paletas.find((p) => p.id === id) || m.paletas[0]
}

export function fuentesHref(m) {
  return m.fuentes ? GF + m.fuentes : null
}

// Variables CSS del tema (se ponen en el contenedor de la página).
export function variablesTema(modeloId, paletaId) {
  const m = modelo(modeloId)
  const p = paleta(m, paletaId)
  return {
    '--t-bg': m.base.bg,
    '--t-text': m.base.text,
    '--t-muted': m.base.muted,
    '--t-card': m.base.card,
    '--t-line': m.base.line,
    '--t-alt': m.base.alt,
    '--t-accent': p.accent,
    '--t-soft': p.soft,
    '--t-boton': p.boton || p.accent,
    '--t-on-accent': p.onAccent || '#FFFFFF',
    '--t-display': m.display,
    '--t-script': m.script,
    '--t-body': m.body,
  }
}

// Lo que la pareja puede personalizar, con valores por defecto.
export function invitacionConDefectos(invite = {}, couple = {}) {
  const m = modelo(invite.modelo || 'clasica')
  return {
    modelo: m.id,
    paleta: paleta(m, invite.paleta).id,
    frase: invite.frase || '',
    hora: invite.hora || '',
    musica: invite.musica || '',
    sobre: typeof invite.sobre === 'boolean' ? invite.sobre : !!m.sobrePorDefecto,
    itinerario: Array.isArray(invite.itinerario) ? invite.itinerario.filter((x) => x && (x.titulo || x.hora)) : [],
    dresscode: {
      texto: invite.dresscode?.texto || '',
      colores: Array.isArray(invite.dresscode?.colores) ? invite.dresscode.colores.filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 5) : [],
    },
    hospedaje: invite.hospedaje || '',
  }
}

// ---------------------------------------------------------------------------
// Aniversarios
// ---------------------------------------------------------------------------
const BODAS_DE = {
  1: 'papel', 2: 'algodón', 3: 'cuero', 4: 'lino', 5: 'madera', 6: 'hierro', 7: 'lana', 8: 'bronce',
  9: 'cerámica', 10: 'aluminio', 11: 'acero', 12: 'seda', 13: 'encaje', 14: 'marfil', 15: 'cristal',
  20: 'porcelana', 25: 'plata', 30: 'perlas', 35: 'coral', 40: 'rubí', 45: 'zafiro', 50: 'oro',
  55: 'esmeralda', 60: 'diamante', 65: 'platino', 70: 'titanio', 75: 'brillantes',
}

export function aniosDeCasados(fechaOriginal, fechaCelebracion) {
  if (!fechaOriginal || !fechaCelebracion) return null
  const a = new Date(fechaOriginal + 'T00:00:00')
  const b = new Date(fechaCelebracion + 'T00:00:00')
  let n = b.getFullYear() - a.getFullYear()
  if (b.getMonth() < a.getMonth() || (b.getMonth() === a.getMonth() && b.getDate() < a.getDate())) n -= 1
  return n > 0 ? n : null
}

export function nombreBodas(anios) {
  return anios && BODAS_DE[anios] ? `Bodas de ${BODAS_DE[anios]}` : null
}

// Textos que cambian entre boda y aniversario.
export function textosEvento(couple) {
  const aniv = couple?.event_type === 'aniversario'
  const anios = aniv ? aniosDeCasados(couple.original_wedding_date, couple.wedding_date) : null
  const bodas = nombreBodas(anios)
  return {
    aniversario: aniv,
    anios,
    bodas,
    evento: aniv ? 'aniversario' : 'boda',
    nuestro: aniv ? 'Nuestro aniversario' : 'Nuestra boda',
    anuncio: aniv ? (anios ? `Celebramos ${anios} ${anios === 1 ? 'año' : 'años'} de casados` : 'Celebramos nuestro aniversario') : 'Nos casamos',
    eyebrow: aniv ? [bodas, anios ? `${anios} ${anios === 1 ? 'año' : 'años'}` : null].filter(Boolean).join(' · ') || 'Aniversario' : 'Nos casamos',
    invitamos: aniv ? 'tienen el gusto de invitarle a celebrar su aniversario' : 'tienen el honor de invitarle a su boda',
    regalosTitulo: aniv ? 'Tu presencia es nuestro mejor regalo' : 'Tu presencia es nuestro mejor regalo',
    regalosTexto: aniv
      ? 'Si deseas tener un detalle con nosotros, dejamos aquí algunas ideas. Cherry Bloom Studio se encarga de comprarlo y entregárnoslo.'
      : 'Pero si deseas hacernos un obsequio, aquí elegimos algunas cosas para nuestro nuevo hogar. Cherry Bloom Studio se encarga de comprarlo y entregárnoslo.',
  }
}

export function iniciales(couple) {
  const a = (couple?.bride_name || '').trim()[0] || ''
  const b = (couple?.groom_name || '').trim()[0] || ''
  return `${a.toUpperCase()}&${b.toUpperCase()}`
}

const mayuscula = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

export function partesFecha(fecha) {
  if (!fecha) return null
  const d = new Date(fecha + 'T00:00:00')
  return {
    dia: d.getDate(),
    diaSemana: d.toLocaleDateString('es-PE', { weekday: 'long' }),
    mes: d.toLocaleDateString('es-PE', { month: 'long' }),
    mesCorto: d.toLocaleDateString('es-PE', { month: 'short' }).replace('.', ''),
    anio: d.getFullYear(),
    dd: String(d.getDate()).padStart(2, '0'),
    mm: String(d.getMonth() + 1).padStart(2, '0'),
    aa: String(d.getFullYear()).slice(2),
    larga: mayuscula(d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })),
  }
}

// Todas las tipografías de los modelos en un solo enlace (para el editor).
export function todasLasFuentesHref() {
  const familias = new Map()
  for (const m of MODELOS) {
    if (!m.fuentes) continue
    for (const f of m.fuentes.split('&family=')) {
      const nombre = f.split(':')[0]
      if (!familias.has(nombre) || f.length > familias.get(nombre).length) familias.set(nombre, f)
    }
  }
  return GF + [...familias.values()].join('&family=')
}
