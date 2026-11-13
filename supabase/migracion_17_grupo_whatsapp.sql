-- Cherry Bloom Studio · Novios — migración 17: grupo de WhatsApp de invitados
--
-- La pareja crea su grupo en WhatsApp, pega aquí el enlace de invitación y el
-- panel se lo envía a los invitados que confirmaron.
-- El enlace va en una tabla aparte (no en "couples", que es de lectura pública)
-- para que solo la pareja pueda verlo.
--
-- Ejecuta esto una vez en el SQL Editor, después de la migración 16.
-- Se puede volver a ejecutar sin romper nada.

create table if not exists public.couple_whatsapp_group (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  link text not null check (link ~ '^https://chat\.whatsapp\.com/[A-Za-z0-9]+'),
  updated_at timestamptz not null default now()
);

alter table public.couple_whatsapp_group enable row level security;

drop policy if exists "grupo_owner_all" on public.couple_whatsapp_group;
create policy "grupo_owner_all" on public.couple_whatsapp_group for all
  using (exists (select 1 from public.couples c where c.id = couple_whatsapp_group.couple_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.couples c where c.id = couple_whatsapp_group.couple_id and c.user_id = auth.uid()));

revoke all on public.couple_whatsapp_group from anon;
grant select, insert, update, delete on public.couple_whatsapp_group to authenticated;

-- A quién ya se le mandó el enlace del grupo.
alter table public.invitations add column if not exists group_sent_at timestamptz;
