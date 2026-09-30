-- Cherry Bloom Studio · Novios — migración 07
-- 1) Paso "¿Desean nuestro servicio de decoración?" en la preparación.
-- 2) Regalos con cantidad (ej. 2 juegos de toallas) y regalos compartidos
--    (varios invitados aportan hasta completar el precio).
--
-- Ejecuta esto una vez en el SQL Editor, después de la migración 06.
-- Se puede volver a ejecutar sin romper nada.

-- ---------------------------------------------------------------------
-- 1) Decoración: respuesta de los novios (null = aún no responden)
-- ---------------------------------------------------------------------
alter table public.couples add column if not exists decor_interest text;
alter table public.couples drop constraint if exists couples_decor_interest_check;
alter table public.couples add constraint couples_decor_interest_check check (decor_interest in ('si', 'no'));

-- ---------------------------------------------------------------------
-- 2) Cantidad y regalo compartido
-- ---------------------------------------------------------------------
alter table public.gift_items add column if not exists quantity int not null default 1;
alter table public.gift_items add column if not exists units_reserved int not null default 0;
alter table public.gift_items add column if not exists shared boolean not null default false;
alter table public.gift_items drop constraint if exists gift_items_quantity_check;
alter table public.gift_items add constraint gift_items_quantity_check check (quantity between 1 and 50 and units_reserved between 0 and quantity);

-- Los regalos elegidos antes de esta migración cuentan como 1 unidad.
update public.gift_items set units_reserved = 1
where type = 'producto' and status <> 'disponible' and units_reserved = 0;

-- Cada aporte o unidad elegida por un invitado queda registrado aquí.
create table if not exists public.gift_contributions (
  id uuid primary key default gen_random_uuid(),
  gift_item_id uuid not null references public.gift_items(id) on delete cascade,
  invitation_id uuid references public.invitations(id) on delete set null,
  guest_name text not null,
  units int not null default 0,
  amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists gift_contributions_item_idx on public.gift_contributions(gift_item_id);

alter table public.gift_contributions enable row level security;
drop policy if exists "gift_contributions_owner_read" on public.gift_contributions;
create policy "gift_contributions_owner_read" on public.gift_contributions for select using (
  exists (
    select 1 from public.gift_items g join public.couples c on c.id = g.couple_id
    where g.id = gift_contributions.gift_item_id and c.user_id = auth.uid()
  )
);
drop policy if exists "gift_contributions_admin_read" on public.gift_contributions;
create policy "gift_contributions_admin_read" on public.gift_contributions for select using (public.es_admin());
revoke all on public.gift_contributions from anon;

-- Pasar los regalos ya elegidos al nuevo registro de aportes (una sola vez).
insert into public.gift_contributions (gift_item_id, invitation_id, guest_name, units, amount)
select g.id, g.reserved_invitation_id, coalesce(g.reserved_by, 'Invitado'),
       case when g.type = 'producto' then 1 else 0 end,
       case when g.type = 'fondo' then g.collected_amount else 0 end
from public.gift_items g
where g.reserved_by is not null
  and not exists (select 1 from public.gift_contributions gc where gc.gift_item_id = g.id);

-- Los novios configuran cantidad y modo compartido (no pueden tocar el precio).
create or replace function public.configurar_regalo(p_gift_id uuid, p_cantidad int, p_compartido boolean)
returns public.gift_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.gift_items;
begin
  select g.* into v_item
  from public.gift_items g join public.couples c on c.id = g.couple_id
  where g.id = p_gift_id and c.user_id = auth.uid()
  for update of g;

  if v_item.id is null then
    raise exception 'Regalo no encontrado';
  end if;
  if v_item.type <> 'producto' then
    raise exception 'Solo los productos tienen cantidad';
  end if;
  if p_cantidad < 1 or p_cantidad > 50 then
    raise exception 'La cantidad debe estar entre 1 y 50';
  end if;
  if p_cantidad < v_item.units_reserved then
    raise exception 'Ya eligieron % unidades de este regalo; no puedes bajar la cantidad a menos de eso', v_item.units_reserved;
  end if;
  if p_compartido <> v_item.shared and (v_item.units_reserved > 0 or v_item.collected_amount > 0) then
    raise exception 'Este regalo ya tiene aportes; no se puede cambiar el modo';
  end if;
  if p_compartido and p_cantidad <> 1 then
    raise exception 'Un regalo compartido es de 1 unidad';
  end if;

  update public.gift_items set
    quantity = p_cantidad,
    shared = p_compartido,
    status = case
      when p_compartido then case when collected_amount >= price then 'regalado' else 'disponible' end
      else case when units_reserved >= p_cantidad then 'regalado' else 'disponible' end
    end
  where id = p_gift_id
  returning * into v_item;
  return v_item;
end;
$$;
revoke execute on function public.configurar_regalo(uuid, int, boolean) from public, anon;
grant execute on function public.configurar_regalo(uuid, int, boolean) to authenticated;

-- Regalar desde el link personal: unidades, aporte a regalo compartido o a fondo.
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
  v_falta numeric;
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
    raise exception 'Este regalo ya fue completado por otros invitados';
  end if;

  if v_item.type = 'producto' and not v_item.shared then
    -- Una unidad por vez
    update public.gift_items set
      units_reserved = units_reserved + 1,
      status = case when units_reserved + 1 >= quantity then 'regalado' else 'disponible' end,
      reserved_by = v_inv.name,
      reserved_invitation_id = v_inv.id
    where id = p_gift_id
    returning * into v_item;
    insert into public.gift_contributions (gift_item_id, invitation_id, guest_name, units)
    values (p_gift_id, v_inv.id, v_inv.name, 1);

  elsif v_item.type = 'producto' and v_item.shared then
    -- Aporte a un regalo compartido, sin pasarse del precio
    v_falta := v_item.price - v_item.collected_amount;
    if p_monto is null or p_monto <= 0 then
      raise exception 'Indica el monto de tu aporte';
    end if;
    if p_monto > v_falta then
      raise exception 'Solo faltan S/ % para completar este regalo', v_falta;
    end if;
    update public.gift_items set
      collected_amount = collected_amount + p_monto,
      status = case when collected_amount + p_monto >= price then 'regalado' else 'disponible' end,
      units_reserved = case when collected_amount + p_monto >= price then 1 else 0 end,
      reserved_by = v_inv.name,
      reserved_invitation_id = v_inv.id
    where id = p_gift_id
    returning * into v_item;
    insert into public.gift_contributions (gift_item_id, invitation_id, guest_name, amount)
    values (p_gift_id, v_inv.id, v_inv.name, p_monto);

  else
    -- Fondo de dinero
    if p_monto is null or p_monto <= 0 then
      raise exception 'Indica el monto de tu aporte';
    end if;
    update public.gift_items set
      collected_amount = collected_amount + p_monto,
      status = case when target_amount is not null and collected_amount + p_monto >= target_amount then 'regalado' else status end,
      reserved_by = v_inv.name,
      reserved_invitation_id = v_inv.id
    where id = p_gift_id
    returning * into v_item;
    insert into public.gift_contributions (gift_item_id, invitation_id, guest_name, amount)
    values (p_gift_id, v_inv.id, v_inv.name, p_monto);
  end if;

  return v_item;
end;
$$;
grant execute on function public.regalar_con_invitacion(text, text, uuid, numeric) to anon, authenticated;

-- Lo que ya eligió cada invitación (se muestra al volver a abrir su link).
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
      select coalesce(json_agg(distinct g.title), '[]'::json)
      from public.gift_contributions gc join public.gift_items g on g.id = gc.gift_item_id
      where gc.invitation_id = i.id
    )
  )
  from public.invitations i
  join public.couples c on c.id = i.couple_id
  where c.slug = p_slug and i.code = lower(trim(p_code));
$$;
grant execute on function public.ver_invitacion(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Panel de administración: valores con cantidades y aportes parciales
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
      (select count(*) from public.gift_items g where g.couple_id = c.id and g.type = 'producto' and (g.units_reserved > 0 or g.collected_amount > 0)),
      (select coalesce(sum((case when g.shared then g.collected_amount else g.price * g.units_reserved end)), 0) from public.gift_items g where g.couple_id = c.id and g.type = 'producto'),
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
    'regalos_elegidos', (select coalesce(sum(case when g.shared then (g.collected_amount > 0)::int else g.units_reserved end), 0) from public.gift_items g where g.type = 'producto'),
    'ventas_regalos', (select coalesce(sum((case when g.shared then g.collected_amount else g.price * g.units_reserved end)), 0) from public.gift_items g where g.type = 'producto'),
    -- Tu margen: el precio de venta ya incluye el 10 %, así que margen = venta - venta / 1.10
    'margen_estimado', (select coalesce(round(sum((case when g.shared then g.collected_amount else g.price * g.units_reserved end) - (case when g.shared then g.collected_amount else g.price * g.units_reserved end) / 1.10), 2), 0) from public.gift_items g where g.type = 'producto'),
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
