import { createServerSupabaseClient } from '@/lib/supabase/server'
import Catalogo from './Catalogo'
import FondoForm from './FondoForm'
import GiftRow from './GiftRow'
import Agradecimientos from './Agradecimientos'

export default async function RegalosPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: couple } = await supabase.from('couples').select('id, bride_name, groom_name').eq('user_id', user.id).maybeSingle()

  const [{ data: items }, { data: catalogo }] = await Promise.all([
    supabase
      .from('gift_items')
      .select('id, type, title, price, target_amount, collected_amount, status, image_url, catalog_id, reserved_by, quantity, units_reserved, shared')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('gift_catalog')
      .select('id, category, title, description, image_url, price, sort_order')
      .eq('active', true)
      .order('sort_order'),
  ])

  const lista = items || []
  const { data: aportes } = lista.length
    ? await supabase
        .from('gift_contributions')
        .select('id, gift_item_id, guest_name, units, amount, thanked_at, created_at, invitations(phone)')
        .in('gift_item_id', lista.map((i) => i.id))
        .order('created_at', { ascending: false })
    : { data: [] }
  const aportesPor = {}
  for (const a of aportes || []) (aportesPor[a.gift_item_id] ||= []).push(a)
  const tituloDe = Object.fromEntries(lista.map((i) => [i.id, i.title]))
  const paraAgradecer = (aportes || []).map((a) => ({ ...a, titulo: tituloDe[a.gift_item_id], telefono: a.invitations?.phone || null }))
  const enLista = lista.filter((i) => i.catalog_id).map((i) => i.catalog_id)
  const totalLista = lista.filter((i) => i.type === 'producto').reduce((s, i) => s + Number(i.price || 0) * (i.shared ? 1 : i.quantity || 1), 0)

  return (
    <div className="space-y-12">
      <div>
        <span className="eyebrow">Lista de regalos</span>
        <h1 className="titulo mt-2 text-4xl">Lo que soñamos para nuestro hogar</h1>
        <p className="mt-2 max-w-2xl text-sm text-cacao-700">
          Pueden pedir más de una unidad (ej. 2 juegos de toallas) o marcar un regalo como <b>compartido</b> para que
          varios invitados aporten hasta completar su precio. Elijan productos de nuestro catálogo — nosotros los compramos y se los entregamos — o abran un
          fondo de dinero para lo que ustedes quieran.
        </p>
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-serif text-2xl font-semibold">Nuestra lista ({lista.length})</h2>
          {totalLista > 0 && (
            <span className="text-xs text-cacao-500">
              Productos por S/ {totalLista.toLocaleString('es-PE')} en total
            </span>
          )}
        </div>
        {lista.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-arena-300 p-10 text-center text-sm text-cacao-500">
            Aún no eligen nada. Empiecen por el catálogo de abajo 👇
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {lista.map((item) => (
              <GiftRow key={item.id} item={item} aportes={aportesPor[item.id] || []} />
            ))}
          </div>
        )}
      </section>

      <Agradecimientos aportes={paraAgradecer} couple={couple} />

      <section>
        <h2 className="mb-4 font-serif text-2xl font-semibold">Fondos de dinero</h2>
        <FondoForm coupleId={couple.id} />
      </section>

      <section>
        <h2 className="mb-1 font-serif text-2xl font-semibold">Catálogo Cherry Bloom</h2>
        <p className="mb-5 text-sm text-cacao-700">Toquen “Agregar” en lo que les gustaría recibir.</p>
        <Catalogo productos={catalogo || []} enLista={enLista} />
      </section>
    </div>
  )
}
