-- Cherry Bloom Studio · Novios — migración 11: usuarios y accesos desde /admin
-- Ver todas las cuentas, confirmar correos a mano, suspender o reactivar el
-- acceso, eliminar cuentas y agregar o quitar administradores.
--
-- Ejecuta esto una vez en el SQL Editor. Se puede volver a ejecutar.

-- Lista de cuentas con su estado
create or replace function public.admin_usuarios()
returns table (
  id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz,
  confirmado boolean, suspendido boolean, es_admin boolean,
  couple_id uuid, slug text, nombres text, wedding_date date
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
    select u.id, u.email::text, u.created_at, u.last_sign_in_at,
      u.email_confirmed_at is not null,
      coalesce(u.banned_until > now(), false),
      exists (select 1 from public.admins a where lower(a.email) = lower(u.email)),
      c.id, c.slug,
      case when c.id is null then null else c.bride_name || ' & ' || c.groom_name end,
      c.wedding_date
    from auth.users u
    left join public.couples c on c.user_id = u.id
    order by u.created_at desc;
end;
$$;

-- Lista de administradores (incluye correos que aún no se registran)
create or replace function public.admin_lista_admins()
returns table (email text, created_at timestamptz, registrado boolean)
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
    select a.email, a.created_at,
      exists (select 1 from auth.users u where lower(u.email) = lower(a.email))
    from public.admins a
    order by a.created_at;
end;
$$;

create or replace function public.admin_agregar_admin(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v text := lower(trim(p_email));
begin
  if not public.es_admin() then
    raise exception 'Acceso solo para administradores';
  end if;
  if v !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Escribe un correo válido';
  end if;
  insert into public.admins (email) values (v) on conflict do nothing;
end;
$$;

create or replace function public.admin_quitar_admin(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mio text;
begin
  if not public.es_admin() then
    raise exception 'Acceso solo para administradores';
  end if;
  select lower(email) into v_mio from auth.users where id = auth.uid();
  if lower(trim(p_email)) = v_mio then
    raise exception 'No puedes quitarte a ti mismo como administrador';
  end if;
  if (select count(*) from public.admins) <= 1 then
    raise exception 'Debe quedar al menos un administrador';
  end if;
  delete from public.admins where lower(email) = lower(trim(p_email));
end;
$$;

-- Confirmar el correo a mano (si el correo de confirmación no le llegó)
create or replace function public.admin_confirmar_usuario(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Acceso solo para administradores';
  end if;
  update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where id = p_user;
end;
$$;

-- Suspender o reactivar el acceso (no borra nada; la página de la boda sigue)
create or replace function public.admin_suspender_usuario(p_user uuid, p_suspender boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Acceso solo para administradores';
  end if;
  if p_user = auth.uid() then
    raise exception 'No puedes suspender tu propia cuenta';
  end if;
  if p_suspender and exists (
    select 1 from auth.users u join public.admins a on lower(a.email) = lower(u.email) where u.id = p_user
  ) then
    raise exception 'Primero quítale el rol de administrador';
  end if;
  update auth.users
    set banned_until = case when p_suspender then now() + interval '100 years' else null end
    where id = p_user;
  if p_suspender then
    delete from auth.sessions where user_id = p_user;       -- cierra sus sesiones abiertas
    delete from auth.refresh_tokens where user_id::text = p_user::text;
  end if;
end;
$$;

-- Eliminar una cuenta: borra al usuario y, en cascada, su boda, invitaciones,
-- regalos y solicitudes. La bitácora de aniversarios se conserva.
create or replace function public.admin_eliminar_usuario(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Acceso solo para administradores';
  end if;
  if p_user = auth.uid() then
    raise exception 'No puedes eliminar tu propia cuenta';
  end if;
  if exists (
    select 1 from auth.users u join public.admins a on lower(a.email) = lower(u.email) where u.id = p_user
  ) then
    raise exception 'Primero quítale el rol de administrador';
  end if;
  delete from auth.users where id = p_user;
end;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'admin_usuarios()', 'admin_lista_admins()', 'admin_agregar_admin(text)', 'admin_quitar_admin(text)',
    'admin_confirmar_usuario(uuid)', 'admin_suspender_usuario(uuid, boolean)', 'admin_eliminar_usuario(uuid)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
