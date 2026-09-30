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
