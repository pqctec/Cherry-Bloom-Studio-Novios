-- Cherry Bloom Studio · Novios — migración 08
-- 1) Fecha límite para confirmar, elegida por los novios (90/60/45/30/15 días).
-- 2) Avisos para los novios (en su panel y, si se configura, por WhatsApp).
-- 3) Recordatorios a invitaciones sin responder y agradecimientos por regalo.
--
-- Ejecuta esto una vez en el SQL Editor, después de la migración 07.
-- Se puede volver a ejecutar sin romper nada.

-- ---------------------------------------------------------------------
-- 1) Fecha límite
-- ---------------------------------------------------------------------
alter table public.couples add column if not exists rsvp_deadline_days int not null default 30;
alter table public.couples drop constraint if exists couples_rsvp_deadline_check;
alter table public.couples add constraint couples_rsvp_deadline_check check (rsvp_deadline_days in (15, 30, 45, 60, 90));

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
  v_limite date;
begin
  select i.* into v_inv
  from public.invitations i join public.couples c on c.id = i.couple_id
  where c.slug = p_slug and i.code = lower(trim(p_code))
  for update of i;

  if v_inv.id is null then
    raise exception 'Invitación no encontrada. Revisa el link que te enviaron los novios.';
  end if;

  select c.wedding_date - c.rsvp_deadline_days into v_limite
  from public.couples c where c.id = v_inv.couple_id;
  if v_limite is not null and current_date > v_limite then
    raise exception 'El plazo para confirmar venció el %. Comunícate directamente con los novios.', to_char(v_limite, 'DD/MM/YYYY');
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
    'fecha_limite', c.wedding_date - c.rsvp_deadline_days,
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

-- ---------------------------------------------------------------------
-- 2) WhatsApp privado de los novios (no se expone en la página pública)
-- ---------------------------------------------------------------------
create table if not exists public.couple_private (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  whatsapp text,
  notify_whatsapp boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.couple_private enable row level security;
drop policy if exists "couple_private_owner_all" on public.couple_private;
create policy "couple_private_owner_all" on public.couple_private for all
  using (exists (select 1 from public.couples c where c.id = couple_private.couple_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.couples c where c.id = couple_private.couple_id and c.user_id = auth.uid()));
revoke all on public.couple_private from anon;

-- ---------------------------------------------------------------------
-- Avisos (novedades) para los novios
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  type text not null check (type in ('confirmacion', 'no_asiste', 'regalo', 'aporte')),
  invitation_id uuid references public.invitations(id) on delete set null,
  title text not null,
  body text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  sent_at timestamptz,         -- cuándo se envió por WhatsApp
  send_error text              -- motivo si no se pudo enviar
);
create index if not exists notifications_couple_idx on public.notifications(couple_id, created_at desc);

alter table public.notifications enable row level security;
drop policy if exists "notifications_owner_read" on public.notifications;
create policy "notifications_owner_read" on public.notifications for select using (
  exists (select 1 from public.couples c where c.id = notifications.couple_id and c.user_id = auth.uid())
);
drop policy if exists "notifications_owner_update" on public.notifications;
create policy "notifications_owner_update" on public.notifications for update using (
  exists (select 1 from public.couples c where c.id = notifications.couple_id and c.user_id = auth.uid())
);
revoke all on public.notifications from anon;
revoke insert, delete on public.notifications from authenticated;
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- Aviso automático cuando una invitación responde o cambia su respuesta.
create or replace function public.avisar_respuesta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.responded_at is distinct from old.responded_at and new.status <> 'pendiente' then
    insert into public.notifications (couple_id, type, invitation_id, title, body)
    values (
      new.couple_id,
      case when new.status = 'confirmado' then 'confirmacion' else 'no_asiste' end,
      new.id,
      case
        when new.status = 'confirmado' then new.name || ' confirmó ' || new.attending || ' de ' || new.passes || case when new.passes = 1 then ' pase' else ' pases' end
        else new.name || ' no podrá asistir'
      end,
      nullif(concat_ws(' · ', new.guest_names, case when new.message is not null then '“' || new.message || '”' end), '')
    );
  end if;
  return new;
end;
$$;
drop trigger if exists invitations_avisar_respuesta on public.invitations;
create trigger invitations_avisar_respuesta after update on public.invitations
  for each row execute function public.avisar_respuesta();

-- Aviso automático cuando un invitado elige un regalo o aporta.
create or replace function public.avisar_regalo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.gift_items;
begin
  select * into v_item from public.gift_items where id = new.gift_item_id;
  insert into public.notifications (couple_id, type, invitation_id, title, body)
  values (
    v_item.couple_id,
    case when new.amount > 0 then 'aporte' else 'regalo' end,
    new.invitation_id,
    case
      when new.amount > 0 then new.guest_name || ' aportó S/ ' || trim(to_char(new.amount, 'FM999G999D00')) || ' a “' || v_item.title || '”'
      else new.guest_name || ' eligió regalarles “' || v_item.title || '”'
    end,
    null
  );
  return new;
end;
$$;
drop trigger if exists gift_contributions_avisar on public.gift_contributions;
create trigger gift_contributions_avisar after insert on public.gift_contributions
  for each row execute function public.avisar_regalo();

-- ---------------------------------------------------------------------
-- 3) Recordatorios y agradecimientos
-- ---------------------------------------------------------------------
alter table public.invitations add column if not exists reminded_at timestamptz;
alter table public.gift_contributions add column if not exists thanked_at timestamptz;

create or replace function public.marcar_agradecido(p_contribution_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.gift_contributions gc set thanked_at = now()
  from public.gift_items g join public.couples c on c.id = g.couple_id
  where gc.id = p_contribution_id and g.id = gc.gift_item_id and c.user_id = auth.uid();
  if not found then
    raise exception 'Aporte no encontrado';
  end if;
end;
$$;
revoke execute on function public.marcar_agradecido(uuid) from public, anon;
grant execute on function public.marcar_agradecido(uuid) to authenticated;
