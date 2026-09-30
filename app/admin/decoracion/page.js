import { createServerSupabaseClient } from '@/lib/supabase/server'
import DecoracionAdmin from './DecoracionAdmin'

export default async function AdminDecoracionPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('decor_services')
    .select('id, slug, category, title, description, image_url, price_label, sort_order, active')
    .order('sort_order')
  return <DecoracionAdmin servicios={data || []} />
}
