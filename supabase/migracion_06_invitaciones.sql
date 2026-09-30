-- Cherry Bloom Studio · Novios — migración 06: invitaciones con pases
--
-- Cada invitación (una persona, pareja o familia) tiene un número de pases y
-- un link personal con un código único. El invitado confirma desde su link y
-- no puede confirmar más personas que los pases que le asignaron. Desde el
-- mismo link elige su regalo.
--
-- Ejecuta esto una vez en el SQL Editor, después de la migración 05.
-- Se puede volver a ejecutar sin romper nada.

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  code text not null unique default lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  name text not null,                         -- "Familia Pérez", "Tía Rosa y Carlos"
  passes int not null default 1 check (passes between 1 and 30),
  phone text,
  status text not null default 'pendiente' check (status in ('pendiente', 'confirmado', 'no_asiste')),
  attending int not null default 0,           -- cuántos confirmaron (<= passes)
  guest_names text,                           -- nombres de quienes asisten (opcional)
  message text,                               -- mensaje para los novios (opcional)
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  constraint attending_dentro_de_pases check (attending between 0 and passes)
);

create index if not exists invitations_couple_idx on public.invitations(couple_id);

alter table public.invitations enable row level security;

-- Los novios administran sus invitaciones. Los invitados NO leen esta tabla
-- directamente: usan las funciones de abajo con su código.
drop policy if exists "invitations_owner_all" on public.invitations;
create policy "invitations_owner_all" on public.invitations for all
  using (exists (select 1 from public.couples c where c.id = invitations.couple_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.couples c where c.id = invitations.couple_id and c.user_id = auth.uid()));

drop policy if exists "invitations_admin_read" on public.invitations;
create policy "invitations_admin_read" on public.invitations for select using (public.es_admin());

revoke all on public.invitations from anon;

-- Un regalo reservado queda ligado a la invitación que lo eligió.
alter table public.gift_items add column if not exists reserved_invitation_id uuid references public.invitations(id) on delete set null;

-- Se acabó la confirmación abierta: solo se confirma con link personal.
drop policy if exists "guests_public_insert" on public.guests;

-- ---------------------------------------------------------------------
-- Funciones públicas para el invitado (entra con su código)
-- ---------------------------------------------------------------------
create or replace function public.ver_invitacion(p_slug text, p_code text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'name', i.name, 'passes', i.passes, 'status', i.status, 'attending', i.attending,
    'guest_names', i.guest_names, 'message', i.message, 'responded_at', i.responded_at,
    'regalos', (
      select coalesce(json_agg(g.title), '[]'::json)
      from public.gift_items g where g.reserved_invitation_id = i.id
    )
  )
  from public.invitations i
  join public.couples c on c.id = i.couple_id
  where c.slug = p_slug and i.code = lower(trim(p_code));
$$;
grant execute on function public.ver_invitacion(text, text) to anon, authenticated;

create or replace function public.responder_invitacion(
  p_slug text,
  p_code text,
  p_asiste boolean,
  p_cantidad int default 1,
  p_nombres text default null,
  p_mensaje text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.invitations;
begin
  select i.* into v_inv
  from public.invitations i join public.couples c on c.id = i.couple_id
  where c.slug = p_slug and i.code = lower(trim(p_code))
  for update of i;

  if v_inv.id is null then
    raise exception 'Invitación no encontrada. Revisa el link que te enviaron los novios.';
  end if;

  if p_asiste and (p_cantidad is null or p_cantidad < 1 or p_cantidad > v_inv.passes) then
    raise exception 'Tu invitación es para máximo % %', v_inv.passes, case when v_inv.passes = 1 then 'persona' else 'personas' end;
  end if;

  update public.invitations set
    status = case when p_asiste then 'confirmado' else 'no_asiste' end,
    attending = case when p_asiste then p_cantidad else 0 end,
    guest_names = nullif(trim(coalesce(p_nombres, '')), ''),
    message = nullif(trim(coalesce(p_mensaje, '')), ''),
    responded_at = now()
  where id = v_inv.id;

  return public.ver_invitacion(p_slug, p_code);
end;
$$;
grant execute on function public.responder_invitacion(text, text, boolean, int, text, text) to anon, authenticated;

create or replace function public.regalar_con_invitacion(
  p_slug text,
  p_code text,
  p_gift_id uuid,
  p_monto numeric default null
)
returns public.gift_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.invitations;
  v_item public.gift_items;
begin
  select i.* into v_inv
  from public.invitations i join public.couples c on c.id = i.couple_id
  where c.slug = p_slug and i.code = lower(trim(p_code));

  if v_inv.id is null then
    raise exception 'Necesitas el link personal de tu invitación para regalar.';
  end if;

  select * into v_item from public.gift_items where id = p_gift_id and couple_id = v_inv.couple_id for update;
  if v_item.id is null then
    raise exception 'Regalo no encontrado';
  end if;
  if v_item.status <> 'disponible' then
    raise exception 'Este regalo ya lo eligió otro invitado';
  end if;

  if v_item.type = 'producto' then
    update public.gift_items
      set status = 'regalado', reserved_by = v_inv.name, reserved_invitation_id = v_inv.id
      where id = p_gift_id
      returning * into v_item;
  else
    if p_monto is null or p_monto <= 0 then
      raise exception 'Indica el monto de tu aporte';
    end if;
    update public.gift_items
      set collected_amount = collected_amount + p_monto,
          reserved_by = v_inv.name,
          reserved_invitation_id = v_inv.id,
          status = case
            when target_amount is not null and collected_amount + p_monto >= target_amount then 'regalado'
            else status
          end
      where id = p_gift_id
      returning * into v_item;
  end if;

  return v_item;
end;
$$;
grant execute on function public.regalar_con_invitacion(text, text, uuid, numeric) to anon, authenticated;

-- La función anterior (sin invitación) ya no se usa desde la web.
revoke execute on function public.reservar_regalo(uuid, text, numeric) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- El panel de administración ahora cuenta invitaciones en vez de "guests"
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
      (select count(*) from public.invitations i where i.couple_id = c.id and i.status = 'confirmado'),
      (select coalesce(sum(i.attending), 0) from public.invitations i where i.couple_id = c.id and i.status = 'confirmado'),
      (select count(*) from public.gift_items g where g.couple_id = c.id and g.type = 'producto'),
      (select count(*) from public.gift_items g where g.couple_id = c.id and g.type = 'producto' and g.status <> 'disponible'),
      (select coalesce(sum(g.price), 0) from public.gift_items g where g.couple_id = c.id and g.type = 'producto' and g.status <> 'disponible'),
      (select coalesce(sum(g.collected_amount), 0) from public.gift_items g where g.couple_id = c.id and g.type = 'fondo'),
      (select count(*) from public.decor_requests r where r.couple_id = c.id)
    from public.couples c
    left join auth.users u on u.id = c.user_id
    order by c.created_at desc;
end;
$$;

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
    'confirmaciones', (select coalesce(sum(attending), 0) from public.invitations where status = 'confirmado'),
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
