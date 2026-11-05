-- Cherry Bloom Studio · Novios — migración 16: croquis del salón y distribución de mesas
--
-- Cada celebración tiene un solo croquis (couple_id es la llave primaria).
-- "layout" guarda: medidas del salón, pista, mesa de novios, buffet, mesas y
-- qué invitación se sienta en qué mesa (por id de invitación). Los pases y
-- las confirmaciones NO se copian aquí: se leen siempre de "invitations".
--
-- Ejecuta esto una vez en el SQL Editor, después de la migración 15.
-- Se puede volver a ejecutar sin romper nada.

create table if not exists public.seating_layouts (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  layout jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint seating_layout_size_check check (pg_column_size(layout) < 200000)
);

alter table public.seating_layouts enable row level security;

-- Solo la pareja dueña lee y escribe su croquis.
drop policy if exists "seating_owner_all" on public.seating_layouts;
create policy "seating_owner_all" on public.seating_layouts for all
  using (exists (select 1 from public.couples c where c.id = seating_layouts.couple_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.couples c where c.id = seating_layouts.couple_id and c.user_id = auth.uid()));

-- El administrador puede verlo (para dar soporte con la decoración).
drop policy if exists "seating_admin_read" on public.seating_layouts;
create policy "seating_admin_read" on public.seating_layouts for select using (public.es_admin());

revoke all on public.seating_layouts from anon;
grant select, insert, update, delete on public.seating_layouts to authenticated;
