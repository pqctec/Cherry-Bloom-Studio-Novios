-- Cherry Bloom Studio · Novios — migración 12: crear cuentas de administrador desde /admin
-- Crea la cuenta ya confirmada, con una contraseña temporal, sin página de
-- boda, y la agrega como administrador. La persona entra con ese correo y
-- esa contraseña y luego la cambia desde "Cambiar contraseña".
--
-- Ejecuta esto una vez en el SQL Editor. Se puede volver a ejecutar.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.admin_crear_admin(p_email text, p_password text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  v_email text := lower(trim(p_email));
  v_id uuid;
begin
  if not public.es_admin() then
    raise exception 'Acceso solo para administradores';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Escribe un correo válido';
  end if;
  if length(coalesce(p_password, '')) < 8 then
    raise exception 'La contraseña temporal debe tener al menos 8 caracteres';
  end if;

  select id into v_id from auth.users where lower(email) = v_email;

  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
      '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
      'email', now(), now(), now()
    );
  end if;
  -- Si la cuenta ya existía, solo se le da el rol (no se cambia su contraseña).

  insert into public.admins (email) values (v_email) on conflict do nothing;
  return v_id;
end;
$$;

revoke execute on function public.admin_crear_admin(text, text) from public, anon;
grant execute on function public.admin_crear_admin(text, text) to authenticated;
