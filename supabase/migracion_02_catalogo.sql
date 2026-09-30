-- Cherry Bloom Studio · Novios — migración 02
-- 1) Catálogo de regalos administrado por Cherry Bloom Studio (tú).
-- 2) Los novios solo eligen productos de ese catálogo (el precio no lo
--    pueden cambiar) y además pueden crear fondos de dinero.
-- 3) Portada (escenario) elegible para la página pública.
--
-- Ejecuta esto UNA vez en el SQL Editor de Supabase, después de schema.sql y
-- fix_registro.sql. Se puede volver a ejecutar sin romper nada.

-- ---------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------
create table if not exists public.gift_catalog (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,               -- tu código interno, sirve para actualizar por carga masiva
  category text not null,
  title text not null,
  description text,
  image_url text,
  reference_price numeric(10, 2) not null, -- precio de la tienda de referencia (privado)
  reference_store text,                    -- privado
  reference_url text,                      -- privado
  -- Precio que ven los invitados: referencia + 10 % de margen, redondeado
  -- hacia arriba al sol entero. Se recalcula solo si cambias reference_price.
  price numeric(10, 2) generated always as (ceil(reference_price * 1.10)) stored,
  active boolean not null default true,
  sort_order int not null default 0,
  notes text,                              -- privado: notas tuyas (stock, fecha del precio...)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gift_catalog_category_idx on public.gift_catalog(category);

alter table public.gift_catalog enable row level security;

drop policy if exists "gift_catalog_public_read" on public.gift_catalog;
create policy "gift_catalog_public_read" on public.gift_catalog for select using (active = true);

-- Nadie escribe el catálogo desde la web: tú lo administras desde el panel
-- de Supabase (Table Editor / SQL Editor), que no pasa por estas reglas.
-- Además, los datos de referencia (precio de tienda, link, notas) no se
-- exponen al público: solo estas columnas son legibles desde la web.
revoke select on public.gift_catalog from anon, authenticated;
grant select (id, sku, category, title, description, image_url, price, active, sort_order)
  on public.gift_catalog to anon, authenticated;

-- ---------------------------------------------------------------------
-- gift_items: enlazar con el catálogo
-- ---------------------------------------------------------------------
alter table public.gift_items add column if not exists catalog_id uuid references public.gift_catalog(id) on delete set null;
alter table public.gift_items add column if not exists image_url text;
alter table public.gift_items add column if not exists category text;

create unique index if not exists gift_items_couple_catalog_uidx
  on public.gift_items(couple_id, catalog_id) where catalog_id is not null;

-- Los novios ya no pueden insertar productos con el precio que quieran:
-- desde el navegador solo pueden crear fondos de dinero. Los productos
-- entran con agregar_regalo_catalogo(), que copia el precio del catálogo.
drop policy if exists "gift_items_owner_insert" on public.gift_items;
create policy "gift_items_owner_insert" on public.gift_items for insert with check (
  type = 'fondo'
  and catalog_id is null
  and price is null
  and exists (select 1 from public.couples c where c.id = gift_items.couple_id and c.user_id = auth.uid())
);

-- Tampoco pueden editar un ítem ya creado (por ejemplo, bajarle el precio).
drop policy if exists "gift_items_owner_update" on public.gift_items;

create or replace function public.agregar_regalo_catalogo(p_catalog_id uuid)
returns public.gift_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
  v_cat public.gift_catalog;
  v_item public.gift_items;
begin
  select id into v_couple_id from public.couples where user_id = auth.uid();
  if v_couple_id is null then
    raise exception 'Primero inicia sesión con tu cuenta de novios';
  end if;

  select * into v_cat from public.gift_catalog where id = p_catalog_id and active = true;
  if v_cat.id is null then
    raise exception 'Ese regalo ya no está disponible en el catálogo';
  end if;

  insert into public.gift_items (couple_id, catalog_id, type, title, description, image_url, category, price)
  values (v_couple_id, v_cat.id, 'producto', v_cat.title, v_cat.description, v_cat.image_url, v_cat.category, v_cat.price)
  on conflict (couple_id, catalog_id) where catalog_id is not null do nothing
  returning * into v_item;

  if v_item.id is null then
    raise exception 'Ese regalo ya está en tu lista';
  end if;

  return v_item;
end;
$$;

revoke execute on function public.agregar_regalo_catalogo(uuid) from public, anon;
grant execute on function public.agregar_regalo_catalogo(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Portada de la página pública
-- ---------------------------------------------------------------------
alter table public.couples add column if not exists cover_theme text not null default 'atardecer';

-- ---------------------------------------------------------------------
-- Carga inicial del catálogo (31 productos, precios vistos en Ripley Perú
-- el 27/09/2026). Si vuelves a ejecutar esto, actualiza los que ya existen
-- por su sku (así funciona también la carga masiva: ver README).
-- ---------------------------------------------------------------------
insert into public.gift_catalog
  (sku, category, title, description, reference_price, reference_store, reference_url, image_url, sort_order, active, notes)
values
  ('RIP-2019207213470', 'Cocina', 'Licuadora Oster Xpert Series 2 L', 'Vaso de vidrio de 2 litros y 3 programas automáticos. Color rojo.', 476.10, 'Ripley', 'https://simple.ripley.com.pe/licuadora-oster-xpert-series-3-programas-automaticos-vaso-vidirio-2lts-roja-blst3ar2g053-2019207213470p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2019207213470/full_image-2019207213470', 10, true, 'Precio visto el 27/09/2026'),
  ('RIP-2019267758409', 'Cocina', 'Batidora de pedestal Bosch 900 W', 'Bowl de acero de 3.8 L, 7 velocidades y mezcla planetaria 3D.', 279.99, 'Ripley', 'https://simple.ripley.com.pe/batidora-de-pedestal-bosch-mums2vm00-2019267758409p', 'https://home.ripley.com.pe/Attachment/WOP_5/2019267758409/2019267758409_2.jpg', 20, true, 'Precio visto el 27/09/2026 · pronto disponible'),
  ('RIP-2019343969477', 'Cocina', 'Freidora de aire Oster 7.5 L digital', 'Ventana y luz interna, 10 programas, recubrimiento DiamondForce.', 419.00, 'Ripley', 'https://simple.ripley.com.pe/freidora-de-aire-oster-75l-digital-recubrimiento-diamondforce-ventana-y-luz-interna-10-programas-ckstaf75wdssdf-2019343969477p', 'https://home.ripley.com.pe/Attachment/WOP_5/2019343969477/2019343969477_2.jpg', 30, true, 'Precio visto el 27/09/2026'),
  ('RIP-2019298491504', 'Cocina', 'Cafetera de filtro Electrolux', 'Programable, con función de mantener caliente. 800 W.', 99.00, 'Ripley', 'https://simple.ripley.com.pe/cafetera-electrolux-filtro-ecm25-800w-2019298491504p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2019298491504/full_image-2019298491504.webp', 40, true, 'Precio visto el 27/09/2026'),
  ('RIP-2019191402034', 'Cocina', 'Cafetera espresso Oster PrimaLatte', '15 bares, prepara espresso, cappuccino y latte. Acero inoxidable.', 449.99, 'Ripley', 'https://simple.ripley.com.pe/cafetera-oster-automatica-prima-latte-i-15-bares-acero-inoxidable-cafe-espresso-cappuccino-latte-bvstem6603ss-2019191402034p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2019191402034/full_image-2019191402034', 50, true, 'Precio visto el 27/09/2026 · agotado al 27/09'),
  ('RIP-2019361680798', 'Cocina', 'Olla arrocera Oster 2.2 L 3 en 1', 'Sofríe, cocina y cocina al vapor. Incluye canasta vaporera.', 239.00, 'Ripley', 'https://simple.ripley.com.pe/olla-arrocera-oster-22-lt-ckstrc12dfske-2019361680798p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2019361680798/full_image-2019361680798', 60, true, 'Precio visto el 27/09/2026'),
  ('RIP-2019273993467', 'Cocina', 'Hervidor eléctrico Thomas 1.7 L', 'Base giratoria 360°, apagado automático. Negro texturizado.', 89.99, 'Ripley', 'https://simple.ripley.com.pe/hervidor-electrico-thomas-17l-th-5005n-th5005n-2019273993467p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2019273993467/full_image-2019273993467', 70, true, 'Precio visto el 27/09/2026 · agotado al 27/09'),
  ('RIP-2019144241758', 'Cocina', 'Tostadora Thomas 2 panes', '6 niveles de tostado y bandeja para migas. 800 W.', 99.00, 'Ripley', 'https://simple.ripley.com.pe/tostadora-thomas-2-panes-th120-2019144241758p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2019144241758/full_image-2019144241758.jpg', 80, true, 'Precio visto el 27/09/2026'),
  ('RIP-2019326051915', 'Cocina', 'Horno eléctrico Thomas 48 L', 'Con rosticero y grill, ideal para cocinar para la familia.', 399.00, 'Ripley', 'https://simple.ripley.com.pe/horno-electrico-thomas-48l-th-48n-2019326051915p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2019326051915/full_image-2019326051915', 90, true, 'Precio visto el 27/09/2026'),
  ('RIP-2019207213517', 'Cocina', 'Extractor de jugos Oster 400 W', 'Boca ancha para frutas enteras, fácil de limpiar.', 149.00, 'Ripley', 'https://simple.ripley.com.pe/extractor-de-jugos-oster-400w-fpstje316p051-2019207213517p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2019207213517/full_image-2019207213517.jpg', 100, true, 'Precio visto el 27/09/2026 · pronto disponible'),
  ('RIP-2019335570186', 'Cocina', 'Microondas Samsung 32 L con dorador', 'Grill y dorador, interior cerámico, 7 programas.', 529.00, 'Ripley', 'https://simple.ripley.com.pe/horno-microondas-cheff-samsung-32l-mg32dg4524agpe-con-dorador-2019335570186p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2019335570186/full_image-2019335570186', 110, true, 'Precio visto el 27/09/2026'),
  ('RIP-2086223479869', 'Cocina', 'Olla a presión Tramontina 6 L', 'Acero inoxidable, cocina rápido y conserva los nutrientes.', 559.00, 'Ripley', 'https://simple.ripley.com.pe/olla-a-presion-tramontina-acero-inoxidable-6-lt-2086223479869p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2086223479869/full_image-2086223479869', 120, true, 'Precio visto el 27/09/2026'),
  ('RIP-2086313937736', 'Cocina', 'Juego de ollas Tramontina Grano 6 piezas', '3 ollas con tapa, acero inoxidable, aptas para inducción.', 1099.00, 'Ripley', 'https://simple.ripley.com.pe/juego-de-ollas-tramontina-grano-acero-6-piezas-2086313937736p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2086313937736/full_image-2086313937736.jpg', 130, true, 'Precio visto el 27/09/2026'),
  ('RIP-2086276450082', 'Cocina', 'Juego de ollas Tramontina Grano 8 piezas', 'Acero inoxidable con mango de acero, aptas para inducción.', 1359.20, 'Ripley', 'https://simple.ripley.com.pe/juego-de-ollas-tramontina-grano-acero-8-piezas-2086276450082p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2086276450082/full_image-2086276450082', 140, true, 'Precio visto el 27/09/2026'),
  ('RIP-2086195765366', 'Cocina', 'Set de sartenes Tramontina 20 y 24 cm', 'Antiadherente Starflon Max, mangos de baquelita.', 54.99, 'Ripley', 'https://simple.ripley.com.pe/set-de-sartenes-tramontina-2-piezas-aluminio-rojo-20-y-24-cm-2086195765366p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2086195765366/full_image-2086195765366', 150, true, 'Precio visto el 27/09/2026'),
  ('RIP-2086342969685', 'Cocina', 'Set de cuchillos 8 piezas', 'Acero inoxidable, aptos para lavavajillas.', 39.99, 'Ripley', 'https://simple.ripley.com.pe/cuchillos-ripley-home-8-piezas-acero-inoxidable-2086342969685p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2086342969685/full_image-2086342969685', 160, true, 'Precio visto el 27/09/2026 · agotado al 27/09'),
  ('RIP-2089163728837', 'Mesa', 'Set de cubiertos Tramontina Amazonas 24 piezas', 'Acero inoxidable pulido, apto para lavavajillas.', 149.00, 'Ripley', 'https://simple.ripley.com.pe/set-cubiertos-tramontina-amazonas-24-piezas-2089163728837p', 'https://home.ripley.com.pe/Attachment/WOP_5/2089163728837/2089163728837_2.jpg', 170, true, 'Precio visto el 27/09/2026'),
  ('RIP-2089180092256', 'Mesa', 'Vajilla de porcelana 20 piezas blanco y dorado', 'Porcelana con filo dorado para 4 personas.', 129.00, 'Ripley', 'https://simple.ripley.com.pe/set-de-vajilla-bone-20-piezas-blancodorado-2089180092256p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2089180092256/full_image-2089180092256', 180, true, 'Precio visto el 27/09/2026'),
  ('RIP-2089347553729', 'Mesa', 'Set de 6 copas de vino D''Arques Longchamp', 'Cristal extra fuerte, 170 ml, aptas para lavavajillas.', 135.07, 'Ripley', 'https://simple.ripley.com.pe/set-x6-copa-de-vino-cristal-darques-longchamp-170-ml-2089347553729p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2089347553729/full_image-2089347553729', 190, true, 'Precio visto el 27/09/2026'),
  ('RIP-2089186291356', 'Mesa', 'Set de 12 vasos altos y bajos', 'Vidrio transparente, 6 altos y 6 bajos.', 39.99, 'Ripley', 'https://simple.ripley.com.pe/set-de-vasos-altos-y-bajos-12-piezas-2089186291356p', 'https://home.ripley.com.pe/Attachment/WOP_5/2089186291356/2089186291356_2.jpg', 200, true, 'Precio visto el 27/09/2026 · pronto disponible'),
  ('RIP-2077181702304', 'Dormitorio y baño', 'Juego de sábanas 300 hilos 2 plazas', '100% algodón jacquard, color taupe. Incluye 2 fundas.', 179.99, 'Ripley', 'https://simple.ripley.com.pe/set-de-sabanas-300h-stripes-100-algodon-2-plazas-taupe-2077181702304p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2077181702304/full_image-2077181702304.jpg', 210, true, 'Precio visto el 27/09/2026'),
  ('RIP-2077175433467', 'Dormitorio y baño', 'Plumón bamboo 2 plazas', 'Exterior 100% bambú, relleno bambú y microgel. Lavable.', 259.99, 'Ripley', 'https://simple.ripley.com.pe/plumon-ripley-home-bamboo-2-plazas-bamboo-233-hilos-blanco-liso-2077175433467p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2077175433467/full_image-2077175433467.webp', 220, true, 'Precio visto el 27/09/2026'),
  ('RIP-2077163605630', 'Dormitorio y baño', 'Par de almohadas queen 50 x 90 cm', 'Twin pack de almohadas de fibra.', 129.99, 'Ripley', 'https://simple.ripley.com.pe/almohada-ripley-home-twin-pack-queen-50x90-cm-2077163605630p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2077163605630/full_image-2077163605630', 230, true, 'Precio visto el 27/09/2026'),
  ('RIP-2079354919373', 'Dormitorio y baño', 'Set de 4 toallas 100% algodón', '400 g/m², 2 de baño y 2 de cara. Gris grafito.', 159.99, 'Ripley', 'https://simple.ripley.com.pe/set-de-bano-ripley-home-4-toallas-algodon-2079354919373p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2079354919373/full_image-2079354919373.webp', 240, true, 'Precio visto el 27/09/2026'),
  ('RIP-2019230788273', 'Hogar', 'Aspiradora Electrolux 1800 W', 'Aspiradora de trineo con accesorio Pet&Turbo.', 479.00, 'Ripley', 'https://simple.ripley.com.pe/aspiradora-electrolux-eas31-1800w-2019230788273p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2019230788273/full_image-2019230788273', 250, true, 'Precio visto el 27/09/2026 · pronto disponible'),
  ('RIP-2019263720448', 'Hogar', 'Robot aspiradora Loven WiFi', 'Se controla desde el celular y programa la limpieza.', 359.99, 'Ripley', 'https://simple.ripley.com.pe/aspiradora-robot-loven-wifi-black-2019263720448p', 'https://home.ripley.com.pe/Attachment/WOP_5/2019263720448/2019263720448_2.jpg', 260, true, 'Precio visto el 27/09/2026 · pronto disponible'),
  ('RIP-2019330808871', 'Hogar', 'Plancha a vapor Philips 2400 W', 'Suela SteamGlide Plus antiarañazos.', 199.00, 'Ripley', 'https://simple.ripley.com.pe/plancha-a-vapor-philips-2400-w-dst502020-2019330808871p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2019330808871/full_image-2019330808871.jpg', 270, true, 'Precio visto el 27/09/2026 · agotado al 27/09'),
  ('RIP-2065351410951', 'Tecnología', 'Parlante JBL Go 4', 'Bluetooth, portátil y resistente al agua.', 109.00, 'Ripley', 'https://simple.ripley.com.pe/parlante-bluetooth-jbl-go-4-negro-2065351410951p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2065351410951/full_image-2065351410951.jpg', 280, true, 'Precio visto el 27/09/2026 · agotado al 27/09'),
  ('RIP-2018334148099', 'Tecnología', 'Smart TV Samsung QLED 55"', 'Pantalla 4K QLED con Smart TV Tizen.', 689.99, 'Ripley', 'https://simple.ripley.com.pe/televisor-smart-tv-samsung-qled-55-qn55q60dagxpe-2018334148099p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2018334148099/full_image-2018334148099.jpg', 290, true, 'Precio visto el 27/09/2026 · agotado al 27/09 · oferta -70%, revisar precio antes de publicar'),
  ('RIP-2003368039222', 'Línea blanca', 'Refrigeradora LG No Frost 374 L', 'Top freezer, No Frost, color plateado.', 1799.00, 'Ripley', 'https://simple.ripley.com.pe/refrigeradora-lg-top-freezer-no-frost-vt38spyc-374l-2003368039222p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2003368039222/full_image-2003368039222.webp', 300, true, 'Precio visto el 27/09/2026'),
  ('RIP-2003336260658', 'Línea blanca', 'Lavadora Samsung 19 kg EcoBubble', 'Carga superior, gris oscuro.', 1399.00, 'Ripley', 'https://simple.ripley.com.pe/lavadora-samsung-19-kg-superior-carga-ecobubble-wa19cg6441bdpe-gris-oscuro-2003336260658p', 'https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2003336260658/full_image-2003336260658.webp', 310, true, 'Precio visto el 27/09/2026 · agotado al 27/09')
on conflict (sku) do update set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  reference_price = excluded.reference_price,
  reference_store = excluded.reference_store,
  reference_url = excluded.reference_url,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order,
  active = excluded.active,
  notes = excluded.notes,
  updated_at = now();
