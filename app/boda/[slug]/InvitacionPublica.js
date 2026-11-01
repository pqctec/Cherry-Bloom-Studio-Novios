import Portada from '@/components/invitacion/Portadas'
import Sobre from '@/components/invitacion/Sobre'
import Musica from '@/components/invitacion/Musica'
import { Mensaje, Foto, Itinerario, DressCode, Ubicacion, Credito } from '@/components/invitacion/Secciones'
import { modelo, fuentesHref, variablesTema, invitacionConDefectos, textosEvento, partesFecha, iniciales } from '@/lib/temas'
import { cancion } from '@/lib/musica'
import { escenario } from '@/lib/escenarios'
import Invitado from './Invitado'

// La invitación completa, ya con el modelo y la personalización de la pareja.
// La usa la página pública (/boda/[slug]) y la vista previa del panel.
export default function InvitacionPublica({ couple, invitacion, regalos, codigo, codigoInvalido, limiteISO, slug, vistaPrevia = false }) {
  const inv = invitacionConDefectos(couple.invite || {}, couple)
  const m = modelo(inv.modelo)
  const t = textosEvento(couple)
  const f = partesFecha(couple.wedding_date)
  const fuentes = fuentesHref(m)
  const musica = cancion(inv.musica)
  const fotoPropia = couple.cover_theme === 'propia' && couple.cover_url ? couple.cover_url : null
  const portadaUrl = fotoPropia || escenario(couple.cover_theme).url
  const lista = couple.gifts_enabled === false ? [] : regalos || []
  const nombres = `${couple.bride_name} & ${couple.groom_name}`

  return (
    <main className="tema min-h-screen" data-modelo={m.id} style={variablesTema(m.id, inv.paleta)}>
      {fuentes && <link rel="stylesheet" href={fuentes} precedence="default" />}
      {inv.sobre && !vistaPrevia && <Sobre iniciales={iniciales(couple)} para={invitacion?.name} />}
      {musica && <Musica url={musica.url} nombre={musica.nombre} />}

      <Portada
        c={couple}
        t={t}
        f={f}
        inv={inv}
        invitacion={invitacion}
        hayRegalos={lista.length > 0}
        portadaUrl={portadaUrl}
        iniciales={iniciales(couple)}
      />

      {m.id !== 'clasica' && <Foto url={fotoPropia} nombres={nombres} />}
      <Mensaje texto={couple.cover_message} firma={nombres} />
      <Itinerario items={inv.itinerario} />
      <DressCode dresscode={inv.dresscode} />
      <Ubicacion venue={couple.venue} hospedaje={inv.hospedaje} />

      <Invitado
        slug={slug}
        fechaLimite={limiteISO}
        codigo={codigo || null}
        invitacionInicial={invitacion || null}
        codigoInvalido={!!codigoInvalido}
        regalos={lista}
        textos={t}
      />

      <section className="pb-6 pt-16 text-center">
        <p className="t-script t-accent text-5xl">¡Te esperamos!</p>
      </section>
      <Credito />
    </main>
  )
}
