-- Cherry Bloom Studio · Novios — migración 14: modelos de invitación PRO (de pago)
--
-- La pareja puede elegir y previsualizar un modelo PRO, pero sus invitados solo
-- lo ven cuando el administrador lo activa (después de recibir el pago).
-- La activación vive en una tabla aparte que las parejas NO pueden modificar.
--
-- Ejecuta esto una vez en el SQL Editor. Se puede volver a ejecutar.

create table if not exists public.couple_pro (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  requested_at timestamptz,          -- la pareja pidió activarlo
  unlocked_at timestamptz,           -- el admin lo activó (pagado)
  unlocked_by text
);

alter table public.couple_pro enable row level security;

-- Cualquiera puede saber si una invitación tiene el PRO activo (la página
-- pública lo necesita). Nadie escribe directamente: solo con las funciones.
drop policy if exists "couple_pro_read" on public.couple_pro;
create policy "couple_pro_read" on public.couple_pro for select using (true);
revoke insert, update, delete on public.couple_pro from anon, authenticated;
grant select on public.couple_pro to anon, authenticated;

-- La pareja pide activar el PRO (queda registrado para el administrador).
create or replace function public.solicitar_pro()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple uuid;
begin
  select id into v_couple from public.couples where user_id = auth.uid();
  if v_couple is null then
    raise exception 'No encontramos su celebración';
  end if;
  insert into public.couple_pro (couple_id, requested_at) values (v_couple, now())
  on conflict (couple_id) do update set requested_at = now();
end;
$$;
revoke execute on function public.solicitar_pro() from public, anon;
grant execute on function public.solicitar_pro() to authenticated;

-- El administrador activa o desactiva el PRO de una pareja.
create or replace function public.admin_activar_pro(p_couple uuid, p_activo boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin text;
begin
  if not public.es_admin() then
    raise exception 'Acceso solo para administradores';
  end if;
  select email into v_admin from auth.users where id = auth.uid();
  insert into public.couple_pro (couple_id, unlocked_at, unlocked_by)
  values (p_couple, case when p_activo then now() end, case when p_activo then v_admin end)
  on conflict (couple_id) do update set
    unlocked_at = case when p_activo then coalesce(public.couple_pro.unlocked_at, now()) end,
    unlocked_by = case when p_activo then coalesce(public.couple_pro.unlocked_by, v_admin) end;
end;
$$;
revoke execute on function public.admin_activar_pro(uuid, boolean) from public, anon;
grant execute on function public.admin_activar_pro(uuid, boolean) to authenticated;
