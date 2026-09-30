import Link from 'next/link'
import Icon from '@/components/Icon'
import Ornamento from '@/components/Ornamento'
import { FOTOS, escenario, soles, linkWhatsApp } from '@/lib/escenarios'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const PASOS = [
  { icon: 'rings', title: 'Creen su página', description: 'Regístrense gratis y elijan la portada de su boda: la playa, los Andes, un jardín…' },
  { icon: 'heart', title: 'Elijan sus regalos', description: 'Escojan de nuestro catálogo lo que necesitan para su nuevo hogar, o abran un fondo para la luna de miel.' },
  { icon: 'chat', title: 'Compartan el link', description: 'Envíenlo por WhatsApp. Sus invitados confirman asistencia y eligen qué regalarles.' },
  { icon: 'home', title: 'Reciban todo en casa', description: 'Nosotros compramos y les entregamos los regalos. Sin colas, sin cambios, sin repetidos.' },
]

const DECORACION = [
  { foto: FOTOS.centroMesa, title: 'Arreglos de mesa', description: 'Centros de mesa en la paleta de colores de su boda.' },
  { foto: FOTOS.mesa, title: 'Mesa de novios y entrada', description: 'El primer detalle que ven sus invitados al llegar.' },
  { foto: FOTOS.arreglo, title: 'Panel de firmas y mesa de fotos', description: 'Recuerdos que se llevan ustedes y sus invitados.' },
]

const LUGARES = ['andes', 'playa', 'jardin', 'petalos', 'acantilado'].map(escenario)

async function decoracion() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('decor_services')
      .select('id, category, title, description, image_url, price_label')
      .eq('active', true)
      .order('sort_order')
    return data || []
  } catch {
    return []
  }
}

async function catalogoDestacado() {
  try {
    const supabase = await createServerSupabaseClient()
    // Los precios solo se muestran (y solo se consultan) con sesión iniciada.
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('gift_catalog')
      .select(user ? 'id, title, image_url, price, category' : 'id, title, image_url, category')
      .eq('active', true)
      .order('sort_order')
      .limit(8)
    return data || []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [regalos, servicios] = await Promise.all([catalogoDestacado(), decoracion()])
  const portada = escenario('atardecer')

  return (
    <main className="min-h-screen">
      {/* Portada */}
      <section className="relative flex min-h-[92vh] items-end overflow-hidden">
        <img src={portada.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-cacao/90 via-cacao/40 to-cacao/30" />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-40">
          <span className="font-script text-4xl text-rubor sm:text-5xl">Dijeron que sí…</span>
          <h1 className="mt-3 max-w-3xl font-serif text-5xl font-medium leading-[1.02] text-white sm:text-7xl">
            ahora celebremos su historia de amor
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            La página de su boda, la confirmación de sus invitados y su lista de regalos en un solo
            lugar — y la decoración de su gran día, de la mano de Cherry Bloom Studio.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/registro" className="btn-primario">
              Crear nuestra página gratis
            </Link>
            <Link href="#como-funciona" className="btn border border-white/40 text-white hover:bg-white/10">
              ¿Cómo funciona?
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <span className="eyebrow">Paso a paso</span>
          <h2 className="titulo mt-3 text-4xl sm:text-5xl">Del “sí, acepto” al gran día</h2>
          <Ornamento className="mt-5 text-oro" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((paso, i) => (
            <div key={paso.title} className="tarjeta relative p-7">
              <span className="absolute right-6 top-5 font-serif text-5xl italic text-rubor">{i + 1}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rubor-100 text-terracota">
                <Icon name={paso.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-serif text-2xl font-semibold text-cacao">{paso.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cacao-700">{paso.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Lugares de ensueño */}
      <section className="bg-arena/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="eyebrow">Su portada</span>
              <h2 className="titulo mt-3 text-4xl sm:text-5xl">Donde empezó todo</h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-cacao-700">
                Elijan el escenario de su página: la playa donde se pidió la mano, las montañas de
                los Andes o un camino de pétalos. Lo pueden cambiar cuando quieran.
              </p>
            </div>
            <Link href="/registro" className="btn-claro">
              Elegir el nuestro
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {LUGARES.map((lugar, i) => (
              <figure
                key={lugar.id}
                className={`group relative overflow-hidden rounded-3xl shadow-suave ${i === 0 ? 'col-span-2 row-span-2 md:col-span-2' : ''}`}
              >
                <img
                  src={i === 0 ? lugar.url : lugar.mini}
                  alt={lugar.nombre}
                  className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${i === 0 ? 'h-full min-h-[320px]' : 'h-48 md:h-full md:min-h-[200px]'}`}
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cacao/80 to-transparent p-4 font-serif text-lg text-white">
                  {lugar.nombre}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Catálogo de regalos */}
      {regalos.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-12 text-center">
            <span className="eyebrow">Lista de regalos</span>
            <h2 className="titulo mt-3 text-4xl sm:text-5xl">Todo para su nuevo hogar</h2>
            <Ornamento className="mt-5 text-oro" />
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-cacao-700">
              Ustedes eligen de nuestro catálogo lo que quieren recibir; sus invitados lo regalan
              desde su página y nosotros se lo llevamos a casa.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {regalos.map((r) => (
              <div key={r.id} className="tarjeta overflow-hidden">
                <div className="flex aspect-square items-center justify-center bg-white p-5">
                  {r.image_url && <img src={r.image_url} alt={r.title} className="h-full w-full object-contain" loading="lazy" />}
                </div>
                <div className="border-t border-arena-200 p-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-rosa-600">{r.category}</span>
                  <h3 className="mt-1 line-clamp-2 text-sm font-medium text-cacao">{r.title}</h3>
                  {r.price != null ? (
                    <p className="mt-2 font-serif text-xl font-semibold text-terracota">{soles(r.price)}</p>
                  ) : (
                    <Link href="/login" className="mt-2 inline-block text-xs font-medium text-rosa-600 underline-offset-2 hover:text-terracota hover:underline">
                      Inicia sesión para ver el precio
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Decoración */}
      <section id="decoracion" className="bg-cacao py-24 text-crema">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <span className="block text-[11px] font-medium uppercase tracking-[0.3em] text-oro-300">Decoración de su evento</span>
            <h2 className="mt-3 font-serif text-4xl font-medium sm:text-5xl">Cada detalle, hecho con amor</h2>
            <Ornamento className="mt-5 text-oro-300" />
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-crema/75">
              Desde la ceremonia hasta la hora loca. Elijan lo que imaginan y les enviamos una cotización a
              la medida de su boda.
            </p>
          </div>

          {servicios.length === 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {DECORACION.map((d) => (
                <div key={d.title} className="overflow-hidden rounded-3xl bg-cacao-700/40">
                  <img src={d.foto} alt={d.title} className="h-64 w-full object-cover" loading="lazy" />
                  <div className="p-6">
                    <h3 className="font-serif text-2xl">{d.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-crema/75">{d.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            [...new Set(servicios.map((s) => s.category))].map((cat) => (
              <div key={cat} className="mb-12 last:mb-0">
                <h3 className="mb-5 font-script text-4xl text-rubor">{cat}</h3>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {servicios
                    .filter((s) => s.category === cat)
                    .map((s) => (
                      <div key={s.id} className="group flex flex-col overflow-hidden rounded-3xl bg-cacao-700/40">
                        <div className="relative overflow-hidden">
                          <img
                            src={s.image_url}
                            alt={s.title}
                            className="h-48 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                          <span className="absolute left-3 top-3 rounded-full bg-crema/90 px-3 py-1 text-[11px] font-medium text-terracota">
                            {s.price_label}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <h4 className="font-serif text-xl leading-snug">{s.title}</h4>
                          <p className="mt-2 text-xs leading-relaxed text-crema/70">{s.description}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Link href="/registro" className="btn-primario">
              Crear página y pedir cotización
            </Link>
            <a
              href={linkWhatsApp('¡Hola Cherry Bloom Studio! Quisiera una cotización de decoración para mi boda.')}
              target="_blank"
              rel="noreferrer"
              className="btn border border-crema/40 text-crema hover:bg-crema/10"
            >
              Cotizar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <div className="mb-12 text-center">
          <span className="eyebrow">Preguntas frecuentes</span>
          <h2 className="titulo mt-3 text-4xl">Resolvemos sus dudas</h2>
        </div>
        <div className="space-y-3">
          {[
            {
              q: '¿Cuánto cuesta crear nuestra página?',
              a: 'Nada. Crear la cuenta, la página, la confirmación de invitados y la lista de regalos es gratis.',
            },
            {
              q: '¿Cómo confirman nuestros invitados?',
              a: 'Desde el link de su página: cada invitado escribe su nombre y cuántos asisten. Ustedes ven la lista en su panel a medida que van confirmando.',
            },
            {
              q: '¿Podemos poner regalos que no estén en el catálogo?',
              a: 'Pueden abrir fondos de dinero (luna de miel, primer hogar, lo que quieran). Si buscan un producto que no está, escríbannos y lo agregamos al catálogo.',
            },
            {
              q: '¿Puedo pedir solo la decoración, o solo la lista?',
              a: 'Sí. Pueden usar solo la página y la lista, contratar solo la decoración, o combinar ambas.',
            },
          ].map((item) => (
            <details key={item.q} className="tarjeta group p-5 open:shadow-suave">
              <summary className="cursor-pointer list-none font-serif text-lg font-semibold text-cacao marker:content-none">
                <span className="flex items-center justify-between">
                  {item.q}
                  <span className="ml-4 text-rosa transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-cacao-700">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Llamado final */}
      <section className="relative overflow-hidden">
        <img src={escenario('andes').url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-cacao/60" />
        <div className="relative mx-auto max-w-2xl px-6 py-28 text-center text-white">
          <span className="font-script text-4xl text-rubor">¿Ya tienen fecha?</span>
          <h2 className="mt-2 font-serif text-4xl font-medium sm:text-5xl">Su página lista en un minuto</h2>
          <div className="mt-10">
            <Link href="/registro" className="btn-primario">
              Crear nuestra página gratis
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export const dynamic = 'force-dynamic'
