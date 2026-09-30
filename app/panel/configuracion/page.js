import { createServerSupabaseClient } from '@/lib/supabase/server'
import Icon from '@/components/Icon'
import EditWeddingForm from './EditWeddingForm'

export default async function ConfiguracionPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: couple } = await supabase
    .from('couples')
    .select('id, slug, groom_name, bride_name, wedding_date, venue, cover_message, cover_theme, rsvp_deadline_days')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: privado } = await supabase.from('couple_private').select('whatsapp, notify_whatsapp').eq('couple_id', couple.id).maybeSingle()

  return (
    <div className="space-y-8">
      <div>
        <span className="eyebrow">Nuestra página</span>
        <h1 className="titulo mt-2 text-4xl">Así la verán sus invitados</h1>
        <p className="mt-2 text-sm text-cacao-700">Elijan la portada y los datos que aparecen en su página pública.</p>
      </div>
      <a href={`/boda/${couple.slug}`} target="_blank" className="btn-claro btn-sm">
        <Icon name="external" className="h-4 w-4" /> Vista previa de su página
      </a>
      <EditWeddingForm couple={couple} privado={privado || { whatsapp: '', notify_whatsapp: true }} />
    </div>
  )
}
