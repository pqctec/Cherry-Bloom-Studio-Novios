import { createServerSupabaseClient } from '@/lib/supabase/server'
import Icon from '@/components/Icon'
import { todasLasFuentesHref } from '@/lib/temas'
import EditorInvitacion from './EditorInvitacion'

export default async function MiInvitacionPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: couple } = await supabase
    .from('couples')
    .select('id, slug, groom_name, bride_name, wedding_date, venue, cover_theme, cover_url, event_type, original_wedding_date, gifts_enabled, invite')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: pro } = await supabase.from('couple_pro').select('requested_at, unlocked_at').eq('couple_id', couple.id).maybeSingle()

  return (
    <div className="space-y-8">
      <link rel="stylesheet" href={todasLasFuentesHref()} precedence="default" />
      <div>
        <span className="eyebrow">Mi invitación</span>
        <h1 className="titulo mt-2 text-4xl">Diseñen su invitación</h1>
        <p className="mt-2 max-w-2xl text-sm text-cacao-700">
          Elijan un modelo y sus colores, escriban su frase, pongan música y armen el itinerario. Cada invitado la recibe con
          su nombre y sus pases. A la derecha ven cómo queda.
        </p>
      </div>
      <a href={`/boda/${couple.slug}`} target="_blank" className="btn-claro btn-sm">
        <Icon name="external" className="h-4 w-4" /> Ver la invitación completa
      </a>
      <EditorInvitacion couple={couple} pro={pro || null} />
    </div>
  )
}
