// Canciones de fondo para las invitaciones (Pixabay Music: uso libre, sin
// pagar derechos ni poner créditos). Los archivos están en public/musica/.
// Para agregar una canción: copia el MP3 a public/musica/ y añade una línea.
// Los nombres son orientativos: cámbialos si alguno no describe bien el tema.
export const CANCIONES = [
  { id: 'piano-amor', nombre: 'Piano de amor', estilo: 'Piano', archivo: 'miromaxmusic-love-piano-no-copyright-615111.mp3' },
  { id: 'romantica', nombre: 'Romántica', estilo: 'Cuerdas y piano', archivo: 'atlasaudio-romantic-wedding-625735.mp3' },
  { id: 'magica', nombre: 'Mágica y romántica', estilo: 'Instrumental', archivo: 'daynigthmorning-magical-romantic-wedding-background-music-376131.mp3' },
  { id: 'amor-romantico', nombre: 'Amor romántico', estilo: 'Instrumental', archivo: 'tunetank-wedding-romantic-love-music-349593.mp3' },
  { id: 'vals', nombre: 'Vals de boda', estilo: 'Vals', archivo: 'paulyudin-wedding-valse-375996.mp3' },
  { id: 'dulce', nombre: 'Dulce boda', estilo: 'Instrumental', archivo: 'paulyudin-wedding-485932.mp3' },
  { id: 'san-valentin', nombre: 'San Valentín', estilo: 'Romántica', archivo: 'paulyudin-wedding-music-valentines-day-182505.mp3' },
  { id: 'ceremonia-1', nombre: 'Ceremonia I', estilo: 'Clásica', archivo: 'leberch-wedding-583086.mp3' },
  { id: 'ceremonia-2', nombre: 'Ceremonia II', estilo: 'Clásica', archivo: 'leberch-wedding-584479.mp3' },
  { id: 'clasica', nombre: 'Clásica de boda', estilo: 'Clásica', archivo: 'andriig-wedding-wedding-music-471301.mp3' },
  { id: 'luminosa', nombre: 'Boda luminosa', estilo: 'Instrumental', archivo: 'jonasblakewood-wedding-wedding-music-519603.mp3' },
  { id: 'primer-baile', nombre: 'Primer baile', estilo: 'Instrumental', archivo: 'lnplusmusic-wedding-wedding-music-333017.mp3' },
  { id: 'acustica-suave', nombre: 'Acústica suave', estilo: 'Guitarra', archivo: 'the_mountain-wedding-165605.mp3' },
  { id: 'acustica-emotiva', nombre: 'Acústica emotiva', estilo: 'Guitarra', archivo: 'the_mountain-wedding-522480.mp3' },
  { id: 'cinematografica', nombre: 'Cinematográfica', estilo: 'Orquestal', archivo: 'petrushkasound-inspirational-cinematic-background-music-461940.mp3' },
  { id: 'alegre', nombre: 'Alegre y breve', estilo: 'Alegre', archivo: 'prettyjohn1-wedding-487335.mp3' },
  { id: 'fiesta-cubana', nombre: 'Fiesta cubana', estilo: 'Alegre · tropical', archivo: 'openmindaudio-cuban-wedding-celebration-music-624667.mp3' },
  { id: 'celebracion-india', nombre: 'Celebración oriental', estilo: 'Alegre', archivo: 'jonasblakewood-indian-wedding-indian-wedding-music-350631.mp3' },
].map((c) => ({ ...c, url: `/musica/${c.archivo}` }))

export function cancion(id) {
  return CANCIONES.find((c) => c.id === id) || null
}
