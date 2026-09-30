-- Cherry Bloom Studio · Novios — esquema inicial (Fase 1)
--
-- Ejecuta esto en el SQL Editor de un proyecto Supabase NUEVO (no el de
-- Cherry Bloom Studio Web). Este producto es de registro abierto para
-- cualquier pareja, así que conviene mantenerlo separado de la base de
-- datos interna de la tienda: son perímetros de seguridad distintos.

-- Cada fila = una boda / pareja registrada. user_id es el dueño de la
-- cuenta (quien inició sesión y puede editar todo lo demás).
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  groom_name text not null,
  bride_name text not null,
  wedding_date date,
  venue text,
  cover_message text,
  created_at timestamptz not null default now()
);

create index couples_user_id_idx on public.couples(user_id);

-- Invitados de una boda. Cualquier invitado (sin cuenta) puede insertar su
-- propia confirmación desde la página pública — pero solo los novios
-- (dueños) pueden leer la lista completa o editar/borrar.
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  name text not null,
  phone text,
  rsvp_status text not null default 'pendiente' check (rsvp_status in ('pendiente','confirmado','no_asiste')),
  guests_count int not null default 1,
  created_at timestamptz not null default now()
);

create index guests_couple_id_idx on public.guests(couple_id);

-- Lista de regalos: cada ítem es un producto físico (Cherry Bloom Studio
-- lo consigue y lo vende con su margen) o un "fondo" de dinero libre para
-- los novios. En Fase 1 no hay cobro real todavía — el paso de
-- "reservado"/"regalado" se hace a través de la función reservar_regalo()
-- de abajo, nunca con un UPDATE directo desde el navegador del invitado.
create table public.gift_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  type text not null check (type in ('producto', 'fondo')),
  title text not null,
  description text,
  image_url text,
  price numeric(10, 2), -- type='producto': precio final, ya con el margen de Cherry Bloom incluido
  target_amount numeric(10, 2), -- type='fondo': monto que se busca reunir (opcional, solo informativo)
  collected_amount numeric(10, 2) not null default 0,
  reserved_by text,
  status text not null default 'disponible' check (status in ('disponible', 'reservado', 'regalado')),
  created_at timestamptz not null default now()
);

create index gift_items_couple_id_idx on public.gift_items(couple_id);

alter table public.couples enable row level security;
alter table public.guests enable row level security;
alter table public.gift_items enable row level security;

-- couples: lectura pública (la página de la boda necesita mostrar
-- nombres/fecha/lugar sin que el visitante tenga sesión). Solo el dueño
-- puede crear/editar/borrar su propia fila.
create policy "couples_public_read" on public.couples for select using (true);
create policy "couples_owner_insert" on public.couples for insert with check (auth.uid() = user_id);
create policy "couples_owner_update" on public.couples for update using (auth.uid() = user_id);
create policy "couples_owner_delete" on public.couples for delete using (auth.uid() = user_id);

-- guests: la lista completa es privada (solo los novios dueños de esa
-- boda la leen). Cualquier invitado sin cuenta puede insertar su propia
-- confirmación de asistencia.
create policy "guests_owner_read" on public.guests for select using (
  exists (select 1 from public.couples c where c.id = guests.couple_id and c.user_id = auth.uid())
);
create policy "guests_public_insert" on public.guests for insert with check (true);
create policy "guests_owner_update" on public.guests for update using (
  exists (select 1 from public.couples c where c.id = guests.couple_id and c.user_id = auth.uid())
);
create policy "guests_owner_delete" on public.guests for delete using (
  exists (select 1 from public.couples c where c.id = guests.couple_id and c.user_id = auth.uid())
);

-- gift_items: la lista es pública (se muestra en la página de la boda).
-- Solo el dueño puede crear/editar/borrar ítems. El cambio de estado
-- ("reservar" / "regalar") NO tiene policy de UPDATE pública — pasa por
-- la función reservar_regalo() de abajo, para que un invitado no pueda
-- reescribir el precio o el título de un regalo ajeno.
create policy "gift_items_public_read" on public.gift_items for select using (true);
create policy "gift_items_owner_insert" on public.gift_items for insert with check (
  exists (select 1 from public.couples c where c.id = gift_items.couple_id and c.user_id = auth.uid())
);
create policy "gift_items_owner_update" on public.gift_items for update using (
  exists (select 1 from public.couples c where c.id = gift_items.couple_id and c.user_id = auth.uid())
);
create policy "gift_items_owner_delete" on public.gift_items for delete using (
  exists (select 1 from public.couples c where c.id = gift_items.couple_id and c.user_id = auth.uid())
);

-- Función que un invitado (sin sesión) llama para reservar/regalar un
-- ítem de la lista, sin necesitar permiso de UPDATE directo sobre toda la
-- tabla. Valida que el ítem siga "disponible" antes de tocarlo (evita que
-- dos invitados regalen lo mismo por una condición de carrera) — mismo
-- patrón que adjust_stock() en Cherry Bloom Studio Web.
--
-- IMPORTANTE para cuando conectemos Culqi (Fase 2): esta función NO debe
-- llamarse directo desde el navegador del invitado cuando haya cobro real
-- de por medio — el checkout debe confirmar el pago primero (o el
-- webhook de Culqi debe ser quien la invoque), nunca confiar en que el
-- cliente avise "ya pagué" por su cuenta.
create or replace function public.reservar_regalo(
  p_gift_id uuid,
  p_guest_name text,
  p_monto numeric default null
) returns public.gift_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.gift_items;
begin
  select * into v_item from public.gift_items where id = p_gift_id for update;

  if v_item.id is null then
    raise exception 'Regalo no encontrado';
  end if;

  if v_item.status <> 'disponible' then
    raise exception 'Este regalo ya no está disponible';
  end if;

  if v_item.type = 'producto' then
    update public.gift_items
      set status = 'regalado', reserved_by = p_guest_name
      where id = p_gift_id
      returning * into v_item;
  else
    update public.gift_items
      set collected_amount = collected_amount + coalesce(p_monto, 0),
          reserved_by = p_guest_name,
          status = case
            when target_amount is not null and collected_amount + coalesce(p_monto, 0) >= target_amount
            then 'regalado'
            else status
          end
      where id = p_gift_id
      returning * into v_item;
  end if;

  return v_item;
end;
$$;

grant execute on function public.reservar_regalo(uuid, text, numeric) to anon, authenticated;


-- Crea automáticamente la fila de "couples" cuando una pareja se registra.
-- Los datos llegan como metadata en supabase.auth.signUp({ options: { data } }).
-- Corre como security definer, así que no depende de que ya haya sesión
-- (necesario cuando la confirmación por correo está activada).
create or replace function public.handle_new_couple()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data ? 'slug' then
    insert into public.couples (user_id, slug, groom_name, bride_name, wedding_date)
    values (
      new.id,
      new.raw_user_meta_data->>'slug',
      coalesce(new.raw_user_meta_data->>'groom_name', ''),
      coalesce(new.raw_user_meta_data->>'bride_name', ''),
      nullif(new.raw_user_meta_data->>'wedding_date', '')::date
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_couple on auth.users;
create trigger on_auth_user_created_couple
  after insert on auth.users
  for each row execute function public.handle_new_couple();
