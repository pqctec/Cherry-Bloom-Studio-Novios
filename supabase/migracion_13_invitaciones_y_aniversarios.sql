-- Cherry Bloom Studio · Novios — migración 13: aniversarios e invitaciones personalizables
--
-- 1. Cada pareja puede organizar una BODA o un ANIVERSARIO. En un aniversario,
--    wedding_date es la fecha de la celebración y original_wedding_date la
--    fecha en que se casaron (para calcular los años: bodas de plata, oro…).
-- 2. La lista de regalos se puede apagar (opcional en aniversarios).
-- 3. "invite" guarda cómo personalizó la pareja su invitación: modelo, colores,
--    frase, música, sobre animado, itinerario y dress code.
--
-- Ejecuta esto una vez en el SQL Editor. Se puede volver a ejecutar.

alter table public.couples add column if not exists event_type text not null default 'boda';
alter table public.couples drop constraint if exists couples_event_type_check;
alter table public.couples add constraint couples_event_type_check check (event_type in ('boda', 'aniversario'));

alter table public.couples add column if not exists original_wedding_date date;
alter table public.couples add column if not exists gifts_enabled boolean not null default true;
alter table public.couples add column if not exists invite jsonb not null default '{}'::jsonb;

-- Un tope de tamaño para que nadie guarde algo desmedido en la invitación.
alter table public.couples drop constraint if exists couples_invite_size_check;
alter table public.couples add constraint couples_invite_size_check check (pg_column_size(invite) < 20000);

-- El registro ahora también recibe el tipo de evento y la fecha original.
create or replace function public.handle_new_couple()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tipo text := coalesce(nullif(new.raw_user_meta_data->>'event_type', ''), 'boda');
begin
  if new.raw_user_meta_data ? 'slug' then
    if v_tipo not in ('boda', 'aniversario') then
      v_tipo := 'boda';
    end if;
    insert into public.couples (user_id, slug, groom_name, bride_name, wedding_date, event_type, original_wedding_date, gifts_enabled)
    values (
      new.id,
      new.raw_user_meta_data->>'slug',
      coalesce(new.raw_user_meta_data->>'groom_name', ''),
      coalesce(new.raw_user_meta_data->>'bride_name', ''),
      nullif(new.raw_user_meta_data->>'wedding_date', '')::date,
      v_tipo,
      nullif(new.raw_user_meta_data->>'original_wedding_date', '')::date,
      v_tipo = 'boda'   -- en aniversarios la lista de regalos empieza apagada
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_couple on auth.users;
create trigger on_auth_user_created_couple
  after insert on auth.users
  for each row execute function public.handle_new_couple();
