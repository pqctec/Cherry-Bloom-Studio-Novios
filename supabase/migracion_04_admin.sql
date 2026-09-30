-- Cherry Bloom Studio · Novios — migración 04: panel de administración (/admin)
--
-- Da acceso de administrador a los correos de la tabla "admins" para editar
-- el catálogo de regalos, la decoración y las solicitudes desde la web, y
-- crea el espacio de fotos "catalogo" en Storage.
--
-- Ejecuta esto una vez en el SQL Editor, después de la migración 03.
-- Se puede volver a ejecutar sin romper nada.

-- ---------------------------------------------------------------------
-- Administradores
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- Sin políticas: nadie la lee ni la edita desde la web.

-- Tu correo. Para agregar a alguien más:  insert into public.admins (email) values ('otro@correo.com');
insert into public.admins (email) values ('pqctec@gmail.com') on conflict do nothing;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    join auth.users u on lower(u.email) = lower(a.email)
    where u.id = auth.uid()
  );
$$;
grant execute on function public.es_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Catálogo de regalos: el admin lo edita desde la web
-- ---------------------------------------------------------------------
grant insert (sku, category, title, description, image_url, reference_price, reference_store, reference_url, active, sort_order, notes, updated_at)
  on public.gift_catalog to authenticated;
grant update (sku, category, title, description, image_url, reference_price, reference_store, reference_url, active, sort_order, notes, updated_at)
  on public.gift_catalog to authenticated;
grant delete on public.gift_catalog to authenticated;

drop policy if exists "gift_catalog_admin_read" on public.gift_catalog;
create policy "gift_catalog_admin_read" on public.gift_catalog for select using (public.es_admin());
drop policy if exists "gift_catalog_admin_insert" on public.gift_catalog;
create policy "gift_catalog_admin_insert" on public.gift_catalog for insert with check (public.es_admin());
drop policy if exists "gift_catalog_admin_update" on public.gift_catalog;
create policy "gift_catalog_admin_update" on public.gift_catalog for update using (public.es_admin()) with check (public.es_admin());
drop policy if exists "gift_catalog_admin_delete" on public.gift_catalog;
create policy "gift_catalog_admin_delete" on public.gift_catalog for delete using (public.es_admin());

-- Lectura completa (incluye precio de referencia, tienda, link y notas, que
-- el público no puede ver) + cuántas parejas eligieron cada producto.
create or replace function public.admin_catalogo()
returns table (
  id uuid, sku text, category text, title text, description text, image_url text,
  reference_price numeric, reference_store text, reference_url text, price numeric,
  active boolean, sort_order int, notes text, updated_at timestamptz, en_listas bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Acceso solo para administradores';
  end if;
  return query
    select c.id, c.sku, c.category, c.title, c.description, c.image_url,
           c.reference_price, c.reference_store, c.reference_url, c.price,
           c.active, c.sort_order, c.notes, c.updated_at,
           (select count(*) from public.gift_items gi where gi.catalog_id = c.id)
    from public.gift_catalog c
    order by c.sort_order, c.title;
end;
$$;
revoke execute on function public.admin_catalogo() from public, anon;
grant execute on function public.admin_catalogo() to authenticated;

-- Importación masiva desde CSV (la usa el botón "Importar CSV" del panel).
-- Recibe una lista JSON de productos; inserta los nuevos y actualiza los
-- existentes por sku. Devuelve cuántas filas procesó.
create or replace function public.admin_importar_catalogo(p_filas jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n int;
begin
  if not public.es_admin() then
    raise exception 'Acceso solo para administradores';
  end if;

  insert into public.gift_catalog
    (sku, category, title, description, image_url, reference_price, reference_store, reference_url, sort_order, active, notes, updated_at)
  select
    trim(f->>'sku'), trim(f->>'category'), trim(f->>'title'), nullif(trim(f->>'description'), ''),
    nullif(trim(f->>'image_url'), ''), (f->>'reference_price')::numeric, nullif(trim(f->>'reference_store'), ''),
    nullif(trim(f->>'reference_url'), ''), coalesce(nullif(f->>'sort_order', '')::int, 0),
    coalesce(nullif(f->>'active', '')::boolean, true), nullif(trim(f->>'notes'), ''), now()
  from jsonb_array_elements(p_filas) f
  on conflict (sku) do update set
    category = excluded.category,
    title = excluded.title,
    description = excluded.description,
    image_url = coalesce(excluded.image_url, gift_catalog.image_url),
    reference_price = excluded.reference_price,
    reference_store = excluded.reference_store,
    reference_url = excluded.reference_url,
    sort_order = excluded.sort_order,
    active = excluded.active,
    notes = excluded.notes,
    updated_at = now();

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke execute on function public.admin_importar_catalogo(jsonb) from public, anon;
grant execute on function public.admin_importar_catalogo(jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- Decoración
-- ---------------------------------------------------------------------
grant insert, update, delete on public.decor_services to authenticated;

drop policy if exists "decor_services_admin_read" on public.decor_services;
create policy "decor_services_admin_read" on public.decor_services for select using (public.es_admin());
drop policy if exists "decor_services_admin_insert" on public.decor_services;
create policy "decor_services_admin_insert" on public.decor_services for insert with check (public.es_admin());
drop policy if exists "decor_services_admin_update" on public.decor_services;
create policy "decor_services_admin_update" on public.decor_services for update using (public.es_admin()) with check (public.es_admin());
drop policy if exists "decor_services_admin_delete" on public.decor_services;
create policy "decor_services_admin_delete" on public.decor_services for delete using (public.es_admin());

-- ---------------------------------------------------------------------
-- Solicitudes de decoración: el admin las ve todas y cambia el estado
-- ---------------------------------------------------------------------
alter table public.decor_requests add column if not exists admin_notes text;

grant update (status, admin_notes) on public.decor_requests to authenticated;

drop policy if exists "decor_requests_admin_read" on public.decor_requests;
create policy "decor_requests_admin_read" on public.decor_requests for select using (public.es_admin());
drop policy if exists "decor_requests_admin_update" on public.decor_requests;
create policy "decor_requests_admin_update" on public.decor_requests for update using (public.es_admin()) with check (public.es_admin());

create or replace function public.admin_solicitudes()
returns table (
  id uuid, created_at timestamptz, status text, services text[], guests_estimate int,
  contact_phone text, notes text, admin_notes text,
  couple_id uuid, slug text, bride_name text, groom_name text, wedding_date date, venue text, email text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Acceso solo para administradores';
  end if;
  return query
    select r.id, r.created_at, r.status, r.services, r.guests_estimate,
           r.contact_phone, r.notes, r.admin_notes,
           c.id, c.slug, c.bride_name, c.groom_name, c.wedding_date, c.venue, u.email::text
    from public.decor_requests r
    join public.couples c on c.id = r.couple_id
    left join auth.users u on u.id = c.user_id
    order by r.created_at desc;
end;
$$;
revoke execute on function public.admin_solicitudes() from public, anon;
grant execute on function public.admin_solicitudes() to authenticated;

-- ---------------------------------------------------------------------
-- Parejas registradas y resumen
-- ---------------------------------------------------------------------
create or replace function public.admin_parejas()
returns table (
  id uuid, slug text, bride_name text, groom_name text, wedding_date date, venue text,
  email text, created_at timestamptz, confirmados bigint, personas bigint,
  productos bigint, regalados bigint, valor_regalado numeric, fondos_recaudados numeric, solicitudes bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Acceso solo para administradores';
  end if;
  return query
    select c.id, c.slug, c.bride_name, c.groom_name, c.wedding_date, c.venue, u.email::text, c.created_at,
      (select count(*) from public.guests g where g.couple_id = c.id and g.rsvp_status = 'confirmado'),
      (select coalesce(sum(g.guests_count), 0) from public.guests g where g.couple_id = c.id and g.rsvp_status = 'confirmado'),
      (select count(*) from public.gift_items i where i.couple_id = c.id and i.type = 'producto'),
      (select count(*) from public.gift_items i where i.couple_id = c.id and i.type = 'producto' and i.status <> 'disponible'),
      (select coalesce(sum(i.price), 0) from public.gift_items i where i.couple_id = c.id and i.type = 'producto' and i.status <> 'disponible'),
      (select coalesce(sum(i.collected_amount), 0) from public.gift_items i where i.couple_id = c.id and i.type = 'fondo'),
      (select count(*) from public.decor_requests r where r.couple_id = c.id)
    from public.couples c
    left join auth.users u on u.id = c.user_id
    order by c.created_at desc;
end;
$$;
revoke execute on function public.admin_parejas() from public, anon;
grant execute on function public.admin_parejas() to authenticated;

create or replace function public.admin_resumen()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v json;
begin
  if not public.es_admin() then
    raise exception 'Acceso solo para administradores';
  end if;
  select json_build_object(
    'parejas', (select count(*) from public.couples),
    'parejas_mes', (select count(*) from public.couples where created_at >= date_trunc('month', now())),
    'proximas_bodas', (select count(*) from public.couples where wedding_date between current_date and current_date + 90),
    'productos_activos', (select count(*) from public.gift_catalog where active),
    'productos_total', (select count(*) from public.gift_catalog),
    'servicios_activos', (select count(*) from public.decor_services where active),
    'solicitudes_nuevas', (select count(*) from public.decor_requests where status = 'nueva'),
    'solicitudes_total', (select count(*) from public.decor_requests),
    'regalos_elegidos', (select count(*) from public.gift_items where type = 'producto' and status <> 'disponible'),
    'ventas_regalos', (select coalesce(sum(price), 0) from public.gift_items where type = 'producto' and status <> 'disponible'),
    -- Tu margen: el precio de venta ya incluye el 10 %, así que margen = venta - venta / 1.10
    'margen_estimado', (select coalesce(round(sum(price - price / 1.10), 2), 0) from public.gift_items where type = 'producto' and status <> 'disponible'),
    'fondos_recaudados', (select coalesce(sum(collected_amount), 0) from public.gift_items where type = 'fondo'),
    'confirmaciones', (select count(*) from public.guests where rsvp_status = 'confirmado'),
    'top_regalos', (
      select coalesce(json_agg(t), '[]'::json) from (
        select c.title, c.image_url, count(*) as veces
        from public.gift_items i join public.gift_catalog c on c.id = i.catalog_id
        group by c.id, c.title, c.image_url
        order by count(*) desc
        limit 5
      ) t
    )
  ) into v;
  return v;
end;
$$;
revoke execute on function public.admin_resumen() from public, anon;
grant execute on function public.admin_resumen() to authenticated;

-- ---------------------------------------------------------------------
-- Fotos: espacio público "catalogo" en Storage. Cualquiera puede ver las
-- fotos; solo el admin puede subir, reemplazar o borrar.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('catalogo', 'catalogo', true)
on conflict (id) do update set public = true;

drop policy if exists "catalogo_admin_read" on storage.objects;
create policy "catalogo_admin_read" on storage.objects for select to authenticated
  using (bucket_id = 'catalogo' and public.es_admin());
drop policy if exists "catalogo_admin_insert" on storage.objects;
create policy "catalogo_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'catalogo' and public.es_admin());
drop policy if exists "catalogo_admin_update" on storage.objects;
create policy "catalogo_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'catalogo' and public.es_admin());
drop policy if exists "catalogo_admin_delete" on storage.objects;
create policy "catalogo_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'catalogo' and public.es_admin());
